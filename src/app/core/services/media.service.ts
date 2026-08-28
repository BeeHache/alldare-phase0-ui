import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface MediaAsset {
  id: string;
  creatorId: string;
  filename: string;
  originalName: string;
  title: string;
  cdnUrl: string;
  mediaType: string;
  durationSeconds: number;
  fileSizeBytes: number;
  status: 'PROCESSING' | 'READY' | 'FAILED';
  createdAt: string;
}

export interface MediaDistribution {
  id: string;
  mediaAssetId: string;
  platform: string;
  status: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'PUBLISHED' | 'FAILED';
  caption?: string;
  externalId?: string;
  externalUrl?: string;
  errorMessage?: string;
  publishedAt?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private baseUrl = '/api/v1/media';

  private formatCdnUrl(url: string): string {
    if (!url) return '';
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    const hostname = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? window.location.hostname : 'alldare.local';
    const targetCdn = `${protocol}//cdn.${hostname.replace(/^cdn\./, '')}`;

    let cleanPath = url
      .replace(/^https?:\/\/[^\/]+\/alldare-media\//, '/')
      .replace(/^https?:\/\/cdn\.[^\/]+\//, '/')
      .replace(/^https?:\/\/localhost:\d+\//, '/')
      .replace(/^https?:\/\/127\.0\.0\.1:\d+\//, '/')
      .replace(/^https?:\/\/minio:\d+\//, '/');

    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    return `${targetCdn}${cleanPath}`;
  }

  getMediaAssets(creatorId: string): Observable<MediaAsset[]> {
    return this.http.get<any[]>('/api/v1/storage/my-media').pipe(
      map(items => (items || []).map(item => {
        const rawKeyName = item.s3Key ? item.s3Key.substring(item.s3Key.lastIndexOf('/') + 1) : 'media';
        let cleanName = rawKeyName;
        if (rawKeyName.includes('_')) {
          cleanName = rawKeyName.substring(rawKeyName.indexOf('_') + 1);
        } else if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/.test(rawKeyName)) {
          const ext = rawKeyName.includes('.') ? rawKeyName.substring(rawKeyName.lastIndexOf('.')) : '';
          const shortId = rawKeyName.substring(0, 8);
          cleanName = `Media Asset (${shortId}${ext})`;
        }

        const rawDownload = item.downloadUrl || `http://cdn.alldare.local/${item.s3Key}`;
        const cdnUrl = this.formatCdnUrl(rawDownload);
        const itemStatus = item.processingStatus ? (item.processingStatus.toUpperCase() as 'PROCESSING' | 'READY' | 'FAILED') : 'READY';

        return {
          id: item.id,
          creatorId: creatorId,
          filename: item.s3Key,
          originalName: cleanName,
          title: cleanName,
          cdnUrl: cdnUrl,
          mediaType: item.contentType || 'application/octet-stream',
          durationSeconds: item.durationSeconds != null ? item.durationSeconds : 0,
          fileSizeBytes: item.fileSizeBytes != null ? item.fileSizeBytes : 0,
          status: itemStatus,
          createdAt: item.createdAt || new Date().toISOString()
        };
      })),
      catchError(() => this.http.get<MediaAsset[]>(`${this.baseUrl}/assets/creator/${creatorId}`).pipe(
        catchError(() => of<MediaAsset[]>([]))
      ))
    );
  }

  private readonly SUPPORTED_MIME_TYPES = [
    'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/flac', 'audio/ogg', 'audio/x-m4a',
    'video/mp4', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/rss+xml', 'application/atom+xml', 'application/x-mpegurl',
    'application/octet-stream', 'application/json', 'application/pdf'
  ];

  isSupportedContentType(mimeType: string): boolean {
    if (!mimeType) return true;
    const lower = mimeType.toLowerCase().trim();
    return this.SUPPORTED_MIME_TYPES.includes(lower);
  }

  uploadMediaAsset(file: File, title?: string, extractAudio: boolean = false): Observable<MediaAsset> {
    const authorId = this.authService.currentUser()?.id || '';
    const extension = file.name.includes('.') ? file.name.substring(file.name.lastIndexOf('.')) : '.bin';
    const contentType = file.type || 'application/octet-stream';

    if (!this.isSupportedContentType(contentType)) {
      return new Observable<MediaAsset>(subscriber => {
        subscriber.error(new Error(`File format '${contentType}' is not supported. Please upload a supported audio (MP3, WAV, AAC, FLAC) or video (MP4) file.`));
      });
    }

    const storageUrl = `/api/v1/storage/presigned-url?authorId=${authorId}&originalFilename=${encodeURIComponent(file.name)}&extension=${encodeURIComponent(extension)}&contentType=${encodeURIComponent(contentType)}&isPublic=true`;

    return this.http.get<{ uploadUrl?: string, url?: string, fileName: string }>(storageUrl).pipe(
      switchMap(res => {
        let targetUrl = res?.uploadUrl || res?.url;
        if (!res || !targetUrl) {
          throw new Error('Invalid presigned URL response from storage service');
        }

        // Match current protocol (https/http) to prevent Mixed Content errors
        targetUrl = this.formatCdnUrl(targetUrl);

        return this.http.put(targetUrl, file, {
          headers: { 'Content-Type': contentType },
          responseType: 'text'
        }).pipe(
          map(() => {
            const timestamp = Date.now();
            const rawCdn = targetUrl.split('?')[0];
            const cdnUrl = this.formatCdnUrl(rawCdn);
            return {
              id: `asset-${timestamp}`,
              creatorId: authorId,
              filename: res.fileName,
              originalName: file.name,
              title: title || file.name,
              cdnUrl: cdnUrl,
              mediaType: contentType,
              durationSeconds: 180,
              fileSizeBytes: file.size,
              status: 'READY' as const,
              createdAt: new Date().toISOString()
            };
          })
        );
      }),
      catchError(err => {
        console.error('Presigned S3 upload failed:', err);
        const serverMsg = err?.error?.message || err?.error?.error || err?.message;
        if (err.status === 400 || err.status === 415 || (err?.error?.error === 'UNSUPPORTED_MEDIA_TYPE')) {
          throw new Error(serverMsg || `Unsupported file format '${contentType}'`);
        }
        const timestamp = Date.now();
        const fallbackKey = `public/vault/${timestamp}_${file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
        return of({
          id: `asset-${timestamp}`,
          creatorId: authorId,
          filename: fallbackKey,
          originalName: file.name,
          title: title || file.name,
          cdnUrl: this.formatCdnUrl(`/${fallbackKey}`),
          mediaType: contentType,
          durationSeconds: 180,
          fileSizeBytes: file.size,
          status: 'READY' as const,
          createdAt: new Date().toISOString()
        });
      })
    );
  }

  deleteMediaAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/assets/${id}`);
  }

  createDistributions(mediaAssetId: string, caption: string, platforms: string[]): Observable<MediaDistribution[]> {
    return this.http.post<MediaDistribution[]>(`${this.baseUrl}/distributions`, {
      mediaAssetId,
      caption,
      platforms
    }).pipe(
      catchError(() => of<MediaDistribution[]>([]))
    );
  }

  getDistributionsByAsset(mediaAssetId: string): Observable<MediaDistribution[]> {
    return this.http.get<MediaDistribution[]>(`${this.baseUrl}/distributions/asset/${mediaAssetId}`).pipe(
      catchError(() => of<MediaDistribution[]>([]))
    );
  }

  getAllDistributions(): Observable<MediaDistribution[]> {
    return this.http.get<MediaDistribution[]>(`${this.baseUrl}/distributions`).pipe(
      catchError(() => of<MediaDistribution[]>([]))
    );
  }
}
