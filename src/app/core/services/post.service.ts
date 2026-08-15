import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface SocialPost {
  id?: string;
  creatorId: string;
  username: string;
  content: string;
  mediaUrl?: string;
  mediaType?: string;
  audienceTier: 'PUBLIC' | 'ALLDARE_PLUS' | 'CREATOR_PRO';
  crossPostTargets?: string[];
  likesCount?: number;
  commentsCount?: number;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/posts';

  getPostsByCreatorId(creatorId: string): Observable<SocialPost[]> {
    return this.http.get<SocialPost[]>(`${this.baseUrl}/creator/${creatorId}`).pipe(
      catchError(() => of([]))
    );
  }

  createPost(post: SocialPost): Observable<SocialPost> {
    return this.http.post<SocialPost>(this.baseUrl, post).pipe(
      catchError(() => of({
        ...post,
        id: `post-${Date.now()}`,
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString()
      }))
    );
  }

  deletePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${postId}`).pipe(
      catchError(() => of(undefined))
    );
  }
}
