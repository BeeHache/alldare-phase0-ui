import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  youtubeUrl?: string;
  provider: 'github' | 'google' | 'local';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/profiles';

  getProfile(userId: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/${userId}`).pipe(
      catchError(() => of({
        id: userId,
        username: 'creator',
        displayName: 'Alldare Creator',
        email: 'creator@alldare.online',
        bio: 'Podcast host, video creator, and decentralized publishing pioneer on Alldare.',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=creator',
        websiteUrl: 'https://alldare.online',
        twitterHandle: '@alldare_creator',
        youtubeUrl: 'https://youtube.com/@alldare',
        provider: 'github' as const,
        createdAt: new Date().toISOString()
      }))
    );
  }

  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/${profile.id}`, profile).pipe(
      catchError(() => of(profile))
    );
  }
}
