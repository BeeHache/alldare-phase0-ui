import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rss-feed-box',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-2.5 p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center gap-2">
      <span class="text-[10px] font-mono font-extrabold text-slate-400 tracking-wider flex-shrink-0">RSS FEED:</span>
      <span class="text-[11px] font-mono text-purple-300 font-semibold truncate flex-1" [title]="url">
        {{ url }}
      </span>
      <button *ngIf="allowCopy" type="button" (click)="copyUrl()" class="text-[10px] font-mono font-bold text-purple-300 hover:text-white bg-purple-600/20 hover:bg-purple-600/40 px-2 py-0.5 rounded border border-purple-500/30 transition flex-shrink-0">
        {{ copied() ? '✓ Copied' : 'Copy' }}
      </button>
      <span *ngIf="isValid && !allowCopy" class="ml-auto text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
        ✓ Valid
      </span>
    </div>
  `
})
export class RssFeedBoxComponent {
  @Input() url: string = '';
  @Input() isValid: boolean = true;
  @Input() allowCopy: boolean = false;

  copied = signal<boolean>(false);

  copyUrl(): void {
    if (this.url) {
      navigator.clipboard.writeText(this.url);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }
}
