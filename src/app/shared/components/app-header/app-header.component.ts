import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-slate-900/80 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      <div class="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 flex-shrink-0">
            <div class="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 016 0v6a3 3 0 01-3 3z"></path>
              </svg>
            </div>
          </div>
          <div>
            <h1 class="text-lg font-black text-white tracking-tight flex items-center gap-1.5 flex-wrap">
              <button *ngIf="parentLinkText" (click)="back.emit()" class="text-slate-400 hover:text-purple-300 transition font-medium text-sm flex items-center gap-1.5 group">
                <span class="group-hover:-translate-x-0.5 transition-transform">←</span>
                <span>{{ parentLinkText }}</span>
                <span class="text-slate-600 font-mono font-normal">/</span>
              </button>
              <span>{{ title }}</span>
              <span class="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">{{ badgeText }}</span>
            </h1>
            <p class="text-xs text-slate-400 font-medium">{{ subtitle }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <!-- Optional Action Slot Content -->
          <ng-content></ng-content>

          <!-- Authenticated Profile Badge & Logout -->
          <div (click)="openProfile.emit()" class="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 px-3.5 py-2.5 rounded-xl cursor-pointer transition">
            <img [src]="authService.currentUser()?.avatarUrl" width="22" height="22" class="avatar-badge bg-slate-700 rounded-full" alt="Avatar" />
            <span class="text-xs font-bold text-purple-300">&#64;{{ authService.currentUser()?.username }}</span>
          </div>

          <button (click)="logout.emit()" class="text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 transition">
            Log Out
          </button>
        </div>
      </div>
    </header>
  `
})
export class AppHeaderComponent {
  @Input() title: string = 'Alldare Platform';
  @Input() badgeText: string = 'Phase 0';
  @Input() subtitle: string = 'Decentralized Content Distribution & Podcast Syndication';
  @Input() parentLinkText: string = '';
  @Input() showBackButton: boolean = false;
  @Input() backText: string = 'Back';

  @Output() back = new EventEmitter<void>();
  @Output() openProfile = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  public authService = inject(AuthService);
}
