import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class PodcastService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/podcasts';

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
    return `https://podcasts.alldare.online/podcast/${slug}/rss.xml`;
  }

  getAtomFeedUrl(slug: string): string {
    return `https://podcasts.alldare.online/podcast/${slug}/atom.xml`;
  }

  getWebLandingPageUrl(slug: string): string {
    return `https://alldare.online/podcast/${slug}/index.html`;
  }
}
