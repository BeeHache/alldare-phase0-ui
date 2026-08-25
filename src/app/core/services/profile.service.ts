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

  getProfile(idOrUsername: string): Observable<UserProfile> {
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(idOrUsername);
    const targetUrl = isUuid ? `${this.baseUrl}/id/${idOrUsername}` : `${this.baseUrl}/${idOrUsername}`;
    return this.http.get<UserProfile>(targetUrl);
  }

  updateProfile(profile: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/${profile.id}`, profile).pipe(
      catchError(() => of(profile))
    );
  }
}
