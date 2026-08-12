import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/media';

  getMediaAssets(creatorId: string): Observable<MediaAsset[]> {
    return this.http.get<MediaAsset[]>(`${this.baseUrl}/assets/creator/${creatorId}`).pipe(
      catchError(() => of<MediaAsset[]>([]))
    );
  }

  uploadMediaAsset(file: File, title?: string, extractAudio: boolean = false): Observable<MediaAsset> {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    formData.append('extractAudio', String(extractAudio));

    return this.http.post<MediaAsset>(`${this.baseUrl}/upload`, formData);
  }

  deleteMediaAsset(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/assets/${id}`);
  }
}
