import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div class="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] p-6 shadow-2xl relative flex flex-col mx-auto overflow-hidden">
        <button (click)="close()" class="absolute top-5 right-5 text-slate-400 hover:text-white font-bold text-xl z-10 transition">✕</button>

        <!-- Fixed Header -->
        <div class="flex items-center gap-4 flex-shrink-0 pb-3">
          <img [src]="profile()?.avatarUrl" width="56" height="56" style="width: 56px; height: 56px; min-width: 56px; min-height: 56px;" class="w-14 h-14 rounded-2xl bg-slate-800 border-2 border-purple-500/60 shadow-lg object-cover flex-shrink-0" alt="Avatar" />
          <div class="min-w-0 flex-1">
            <h3 class="text-2xl font-black text-white leading-tight truncate">{{ profile()?.displayName || profile()?.username }}</h3>
            <p class="text-sm font-mono text-purple-400 mt-0.5 truncate">&#64;{{ profile()?.username }}</p>
            <span class="inline-block mt-1 px-2 py-0.5 rounded-md text-xs uppercase font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
              {{ profile()?.provider }} OAuth Authenticated
            </span>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div class="space-y-4 pt-3 border-t border-slate-800 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Display / Author Name <span class="text-rose-400">*</span></label>
            <input type="text" [(ngModel)]="editableProfile.displayName" [class.input-invalid]="isDisplayNameInvalid()" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 transition" />
          </div>

          <div>
            <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">Creator Bio</label>
            <textarea [(ngModel)]="editableProfile.bio" rows="2" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-purple-500 transition"></textarea>
          </div>

          <!-- Linked Social Accounts (OAuth 2.0 PKCE Vault) -->
          <div class="pt-3 border-t border-slate-800 space-y-2.5">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black text-slate-100 uppercase tracking-wider">🔗 Linked Social Accounts (OAuth 2.0 Vault)</h4>
              <span class="text-xs text-purple-400 font-mono font-bold">AES-256 Encrypted</span>
            </div>

            <!-- Scrollable Single Column Social Target Viewport (Locked to 180px Height - Displays Top 3 Items) -->
            <div style="height: 180px; max-height: 180px; overflow-y: auto;" class="pr-4 pl-2.5 py-2.5 space-y-2 bg-slate-950/60 rounded-2xl border border-slate-800/80 shadow-inner">
              <div *ngFor="let target of socialTargets()" class="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 rounded-2xl p-3 flex items-center justify-between transition shadow-md mr-1">
                <div class="flex items-center gap-3 min-w-0">
                  <!-- Twitter / X -->
                  <div *ngIf="target.key === 'TWITTER'" class="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 bg-sky-500/20 border-sky-500/40 shadow-inner">
                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24"><path fill="#38bdf8" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <!-- YouTube -->
                  <div *ngIf="target.key === 'YOUTUBE'" class="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 bg-red-500/20 border-red-500/40 shadow-inner">
                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24"><path fill="#ef4444" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </div>
                  <!-- Instagram -->
                  <div *ngIf="target.key === 'INSTAGRAM'" class="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 bg-pink-500/20 border-pink-500/40 shadow-inner">
                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24"><path fill="#f472b6" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </div>
                  <!-- Facebook -->
                  <div *ngIf="target.key === 'FACEBOOK'" class="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 bg-blue-500/20 border-blue-500/40 shadow-inner">
                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24"><path fill="#60a5fa" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <!-- Threads -->
                  <div *ngIf="target.key === 'THREADS'" class="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 bg-purple-500/20 border-purple-500/40 shadow-inner">
                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24"><path fill="#c084fc" d="M12.186 2.002c5.21 0 9.814 3.92 9.814 9.998 0 6.643-5.26 10.002-10.363 10.002-5.485 0-9.637-4.14-9.637-9.82 0-5.748 4.37-10.18 10.186-10.18zm0 2.1c-4.48 0-7.986 3.46-7.986 8.08 0 4.5 3.326 7.72 7.537 7.72 4.09 0 8.163-2.61 8.163-7.902 0-4.88-3.69-7.898-7.714-7.898z"/></svg>
                  </div>
                  <!-- TikTok -->
                  <div *ngIf="target.key === 'TIKTOK'" class="w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 bg-teal-500/20 border-teal-500/40 shadow-inner">
                    <svg class="w-5 h-5" width="20" height="20" viewBox="0 0 24 24"><path fill="#2dd4bf" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.55-1.3 2.56.01.91.44 1.81 1.15 2.37.89.71 2.13.88 3.19.46 1.05-.41 1.82-1.42 1.96-2.54.05-1.74.03-3.48.04-5.22 0-3.77-.01-7.54.01-11.31z"/></svg>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-black text-white leading-none truncate">{{ target.name }}</p>
                    <p class="text-xs mt-1 font-extrabold truncate" [class.text-emerald-400]="target.connected" [class.text-slate-400]="!target.connected">
                      {{ target.connected ? (target.handle || '✓ Connected') : 'Not Connected' }}
                    </p>
                  </div>
                </div>
                <button (click)="toggleConnect(target)" class="px-3.5 py-1.5 rounded-xl text-xs font-black transition border flex-shrink-0 ml-2 shadow-sm" [class.bg-emerald-950]="target.connected" [class.text-emerald-300]="target.connected" [class.border-emerald-700]="target.connected" [class.bg-gradient-to-r]="!target.connected" [class.from-purple-600]="!target.connected" [class.to-pink-600]="!target.connected" [class.text-white]="!target.connected" [class.border-purple-400]="!target.connected">
                  {{ target.connected ? '✓ Linked' : '+ Connect' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Fixed Footer Action Buttons -->
        <div class="flex items-center justify-end gap-3 pt-4 mt-3 border-t border-slate-800 flex-shrink-0 bg-slate-900 z-20">
          <button (click)="close()" class="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition">
            Cancel
          </button>
          <button (click)="saveProfile()" [disabled]="!isFormValid()" [class.btn-disabled]="!isFormValid()" class="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-purple-500/25 transition">
            Save Profile Changes
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProfileModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeEvent = new EventEmitter<void>();

  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  profile = signal<UserProfile | null>(null);

  editableProfile: UserProfile = {
    id: '',
    username: '',
    displayName: '',
    email: '',
    provider: 'local'
  };

  isDisplayNameInvalid(): boolean {
    return !(this.editableProfile.displayName || '').trim();
  }

  isFormValid(): boolean {
    return !this.isDisplayNameInvalid();
  }

  socialTargets = signal<Array<{ key: string; name: string; colorClass: string; path: string; connected: boolean; handle?: string }>>([
    { key: 'TWITTER', name: 'Twitter / X', colorClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z', connected: true, handle: '@BeeHache' },
    { key: 'YOUTUBE', name: 'YouTube', colorClass: 'bg-red-500/15 text-red-400 border-red-500/30', path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z', connected: true, handle: '@AlldareChannel' },
    { key: 'INSTAGRAM', name: 'Instagram', colorClass: 'bg-pink-500/15 text-pink-400 border-pink-500/30', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z', connected: false },
    { key: 'FACEBOOK', name: 'Facebook', colorClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30', path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z', connected: false },
    { key: 'THREADS', name: 'Threads', colorClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30', path: 'M12.186 2.002c5.21 0 9.814 3.92 9.814 9.998 0 6.643-5.26 10.002-10.363 10.002-5.485 0-9.637-4.14-9.637-9.82 0-5.748 4.37-10.18 10.186-10.18zm0 2.1c-4.48 0-7.986 3.46-7.986 8.08 0 4.5 3.326 7.72 7.537 7.72 4.09 0 8.163-2.61 8.163-7.902 0-4.88-3.69-7.898-7.714-7.898z', connected: false },
    { key: 'TIKTOK', name: 'TikTok', colorClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30', path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.31 1.55-1.3 2.56.01.91.44 1.81 1.15 2.37.89.71 2.13.88 3.19.46 1.05-.41 1.82-1.42 1.96-2.54.05-1.74.03-3.48.04-5.22 0-3.77-.01-7.54.01-11.31z', connected: false }
  ]);

  toggleConnect(target: any): void {
    target.connected = !target.connected;
    if (target.connected) {
      alert(`🔗 Simulating OAuth 2.0 PKCE connection to ${target.name}... Connection successful!`);
    } else {
      alert(`🔌 Disconnected ${target.name} account.`);
    }
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    this.profileService.getProfile(user.id).subscribe(p => {
      p.username = user.username;
      p.email = user.email;
      p.avatarUrl = user.avatarUrl || p.avatarUrl;
      this.profile.set(p);
      this.editableProfile = { ...p };
    });
  }

  saveProfile(): void {
    if (!this.isFormValid()) return;
    this.profileService.updateProfile(this.editableProfile).subscribe(updated => {
      this.profile.set(updated);
      alert('👤 User profile updated successfully!');
      this.close();
    });
  }

  close(): void {
    this.closeEvent.emit();
  }
}
