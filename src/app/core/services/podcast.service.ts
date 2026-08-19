import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';


export interface PodcastShow {
  id?: string;
  creatorId: string;
  username: string;
  slug?: string;
  title: string;
  description: string;
  category: string;
  authorName: string;
  email: string;
  coverImageUrl: string;
  explicit: boolean;
  isPublic?: boolean;
  public?: boolean;
}

export interface PodcastEpisode {
  id?: string;
  showId: string;
  title: string;
  description: string;
  mediaUrl: string;
  mediaType: string;
  durationSeconds: number;
  fileSizeBytes: number;
  episodeNumber?: number;
  seasonNumber?: number;
  publishedAt?: string;
  isDraft?: boolean;
}


export interface PodcastSyndication {
  id: string;
  showId: string;
  directoryName: string;
  status: string;
  directoryShowUrl?: string;
  claimUrl?: string;
  isManagedByPlatform: boolean;
  isClaimedByCreator: boolean;
  claimToken?: string;
  claimedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PodcastService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/podcasts';
  private podcastUrl = environment.podcastUrl;

  slugify(title: string): string {
    return (title || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  getShowsByCreatorId(creatorId: string): Observable<PodcastShow[]> {
    return this.http.get<PodcastShow[]>(`${this.baseUrl}/shows/creator/${creatorId}`).pipe(
      catchError(() => of([]))
    );
  }

  getShowBySlug(slug: string): Observable<PodcastShow> {
    return this.http.get<PodcastShow>(`${this.baseUrl}/shows/${slug}`);
  }

  getEpisodesBySlug(slug: string): Observable<PodcastEpisode[]> {
    return this.http.get<PodcastShow>(`${this.baseUrl}/shows/${slug}`).pipe(
      switchMap(show => this.getEpisodesByShowId(show.id || '')),
      catchError(() => of([]))
    );
  }

  getEpisodesByShowId(showId: string): Observable<PodcastEpisode[]> {
    if (!showId) return of([]);
    return this.http.get<PodcastEpisode[]>(`${this.baseUrl}/shows/${showId}/episodes`).pipe(
      catchError(() => of([]))
    );
  }

  createShow(show: PodcastShow): Observable<PodcastShow> {
    return this.http.post<PodcastShow>(`${this.baseUrl}/shows`, show);
  }

  updateShow(id: string, show: Partial<PodcastShow>): Observable<PodcastShow> {
    return this.http.put<PodcastShow>(`${this.baseUrl}/shows/${id}`, show);
  }

  toggleShowVisibility(id: string, isPublic: boolean): Observable<PodcastShow> {
    return this.http.put<PodcastShow>(`${this.baseUrl}/shows/${id}/visibility?isPublic=${isPublic}`, {});
  }

  deleteShow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/shows/${id}`);
  }

  createEpisode(episode: PodcastEpisode): Observable<PodcastEpisode> {
    return this.http.post<PodcastEpisode>(`${this.baseUrl}/episodes`, episode);
  }

  publishEpisodeLive(id: string): Observable<PodcastEpisode> {
    return this.http.put<PodcastEpisode>(`${this.baseUrl}/episodes/${id}/publish`, {});
  }

  revertEpisodeToDraft(id: string): Observable<PodcastEpisode> {
    return this.http.put<PodcastEpisode>(`${this.baseUrl}/episodes/${id}/draft`, {});
  }

  getRssFeedUrl(slug: string): string {
    return `${this.podcastUrl}/podcast/${slug}/rss.xml`;
  }

  getAtomFeedUrl(slug: string): string {
    return `${this.podcastUrl}/podcast/${slug}/atom.xml`;
  }

  getWebLandingPageUrl(slug: string): string {
    return `${this.podcastUrl}/podcast/${slug}/index.html`;
  }

  getSyndicationStatus(showId: string): Observable<PodcastSyndication[]> {
    if (!showId) return of([]);
    return this.http.get<PodcastSyndication[]>(`${this.baseUrl}/shows/${showId}/syndication`).pipe(
      catchError(() => of([]))
    );
  }

  generateClaimToken(showId: string, directory: string): Observable<PodcastSyndication> {
    return this.http.post<PodcastSyndication>(`${this.baseUrl}/shows/${showId}/syndication/${directory}/claim-token`, {});
  }

  transferOwnership(showId: string, directory: string, claimToken: string): Observable<PodcastSyndication> {
    return this.http.post<PodcastSyndication>(`${this.baseUrl}/shows/${showId}/syndication/${directory}/transfer-ownership?claimToken=${claimToken}`, {});
  }
}
