import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 text-center">
      <div class="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-2xl font-bold animate-pulse mb-4">
        ✨
      </div>
      <h2 class="text-xl font-bold text-white mb-1">Completing Single Sign-On...</h2>
      <p class="text-xs text-slate-400">Syncing creator credentials & initializing your studio.</p>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const username = urlParams.get('username') || 'creator';
    const email = urlParams.get('email') || 'creator@alldare.online';
    const provider = (urlParams.get('provider') as 'github' | 'google') || 'github';

    if (token) {
      this.authService.setSession(token, {
        id: urlParams.get('userId') || '00000000-0000-0000-0000-000000000001',
        username: username,
        email: email,
        authorName: username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        provider: provider
      });

      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/login']);
    }
  }
}
