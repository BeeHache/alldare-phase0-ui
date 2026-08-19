import { Injectable, signal, computed } from '@angular/core';
import { DEFAULT_CREATOR_ID, DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_AVATAR } from '../constants/app.constants';

export interface CreatorUser {
  id: string;
  username: string;
  email: string;
  authorName: string;
  avatarUrl?: string;
  provider: 'github' | 'google' | 'local';
}

export interface UserSocialAccount {
  id: string;
  accountId: string;
  platform: string;
  externalAccountId: string;
  externalUsername: string;
  isConnected: boolean;
  expiresAt?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenSignal = signal<string | null>(localStorage.getItem('alldare_token'));
  
  currentUser = signal<CreatorUser | null>(this.getStoredUser());
  isAuthenticated = computed(() => !!this.tokenSignal());

  constructor() {
    this.checkUrlForToken();
  }

  get token(): string | null {
    return this.tokenSignal();
  }

  private checkUrlForToken(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username') || DEFAULT_USERNAME;
    const email = urlParams.get('email') || `${username}@alldare.online`;
    const provider = (urlParams.get('provider') as 'github' | 'google') || 'github';
    const avatarFromParam = urlParams.get('avatarUrl');

    const avatarUrl = (avatarFromParam && avatarFromParam !== 'null' && avatarFromParam !== 'undefined')
      ? avatarFromParam
      : (provider === 'github' ? `https://github.com/${username}.png` : DEFAULT_AVATAR);

    if (token) {
      this.setSession(token, {
        id: urlParams.get('userId') || DEFAULT_CREATOR_ID,
        username: username,
        email: email,
        authorName: username,
        avatarUrl: avatarUrl,
        provider: provider
      });

      // Clean token query parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  private getStoredUser(): CreatorUser | null {
    const raw = localStorage.getItem('alldare_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  setSession(token: string, user: CreatorUser): void {
    localStorage.setItem('alldare_token', token);
    localStorage.setItem('alldare_user', JSON.stringify(user));
    this.tokenSignal.set(token);
    this.currentUser.set(user);
  }

  loginWithGitHub(): void {
    window.location.href = '/oauth2/authorization/github';
  }

  loginWithGoogle(): void {
    window.location.href = '/oauth2/authorization/google';
  }

  logout(): void {
    localStorage.removeItem('alldare_token');
    localStorage.removeItem('alldare_user');
    this.tokenSignal.set(null);
    this.currentUser.set(null);
  }
}
