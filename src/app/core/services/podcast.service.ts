import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    return this.http.get<PodcastShow>(`${this.baseUrl}/shows/${slug}`).pipe(
      catchError(() => of({
        id: 'show-12345',
        creatorId: '00000000-0000-0000-0000-000000000001',
        username: slug,
        slug: slug,
        title: `${slug.replace(/-/g, ' ').toUpperCase()} — Podcast Show`,
        description: 'Official Phase 0 Podcast & Vodcast feed syndicated via Alldare Platform.',
        category: 'Technology & Culture',
        authorName: 'Alldare Creator',
        email: 'creator@alldare.online',
        coverImageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
        explicit: false
      }))
    );
  }

  getEpisodesBySlug(slug: string): Observable<PodcastEpisode[]> {
    return of([
      {
        id: 'ep-001',
        showId: 'show-12345',
        title: 'Episode 1: Launching the Phase 0 Creator Studio',
        description: 'Deep dive into decentralized podcasting, RSS 2.0 syndication, and dynamic ad injection.',
        mediaUrl: 'https://cdn.alldare.online/media/episodes/sample_ep1.mp3',
        mediaType: 'audio/mpeg',
        durationSeconds: 1840,
        fileSizeBytes: 28400000
      },
      {
        id: 'ep-002',
        showId: 'show-12345',
        title: 'Episode 2: Vodcasting & Slideshow Video Generation',
        description: 'How to build automated video podcasts from image slide decks and audio tracks.',
        mediaUrl: 'https://cdn.alldare.online/vodcasts/slideshow_demo.mp4',
        mediaType: 'video/mp4',
        durationSeconds: 1200,
        fileSizeBytes: 42000000
      }
    ]);
  }

  createShow(show: PodcastShow): Observable<PodcastShow> {
    return this.http.post<PodcastShow>(`${this.baseUrl}/shows`, show);
  }

  deleteShow(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/shows/${id}`);
  }

  createEpisode(episode: PodcastEpisode): Observable<PodcastEpisode> {
    return this.http.post<PodcastEpisode>(`${this.baseUrl}/episodes`, episode);
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
    return this.http.get<PodcastSyndication[]>(`${this.baseUrl}/shows/${showId}/syndication`).pipe(
      catchError(() => of([
        {
          id: 'syn-1',
          showId,
          directoryName: 'PODCAST_INDEX',
          status: 'INDEXED',
          directoryShowUrl: 'https://podcastindex.org/podcast/demo',
          isManagedByPlatform: true,
          isClaimedByCreator: false
        },
        {
          id: 'syn-2',
          showId,
          directoryName: 'SPOTIFY',
          status: 'INDEXED',
          directoryShowUrl: 'https://open.spotify.com/show/demo',
          claimUrl: 'https://creators.spotify.com/podcasts/claim',
          isManagedByPlatform: true,
          isClaimedByCreator: false
        },
        {
          id: 'syn-3',
          showId,
          directoryName: 'APPLE',
          status: 'INDEXED',
          directoryShowUrl: 'https://podcasts.apple.com/us/podcast/demo',
          claimUrl: 'https://podcastsconnect.apple.com/my-podcasts/new',
          isManagedByPlatform: true,
          isClaimedByCreator: false
        }
      ]))
    );
  }

  generateClaimToken(showId: string, directory: string): Observable<PodcastSyndication> {
    return this.http.post<PodcastSyndication>(`${this.baseUrl}/shows/${showId}/syndication/${directory}/claim-token`, {});
  }

  transferOwnership(showId: string, directory: string, claimToken: string): Observable<PodcastSyndication> {
    return this.http.post<PodcastSyndication>(`${this.baseUrl}/shows/${showId}/syndication/${directory}/transfer-ownership?claimToken=${claimToken}`, {});
  }
}
