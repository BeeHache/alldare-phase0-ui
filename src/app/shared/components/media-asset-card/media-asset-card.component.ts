import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaAsset } from '../../../core/services/media.service';

@Component({
  selector: 'app-media-asset-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div (click)="select.emit(asset)" 
         [class]="isSelected ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/40' : 'bg-slate-950/90 border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/60'" 
         class="p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3 min-w-0 overflow-hidden group">
      
      <div class="mt-0.5 p-2 rounded-xl bg-slate-900 border border-slate-800 group-hover:border-purple-500/30 flex-shrink-0 text-purple-400">
        <svg *ngIf="asset.mediaType.startsWith('video')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
        </svg>
        <svg *ngIf="!asset.mediaType.startsWith('video')" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
        </svg>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-xs font-bold text-white truncate min-w-0" [title]="asset.title || asset.originalName">
            {{ asset.title || asset.originalName }}
          </h4>
          <span [class]="isSelected ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 border border-slate-700'" class="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-md flex-shrink-0 whitespace-nowrap transition">
            {{ isSelected ? '✓ SELECTED' : 'SELECT' }}
          </span>
        </div>

        <div class="flex items-center gap-2 mt-1.5 text-[10px] font-mono">
          <span class="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-purple-300 font-semibold flex-shrink-0">
            {{ asset.mediaType.startsWith('video') ? 'VIDEO' : 'AUDIO' }}
          </span>
          <span class="text-slate-400 font-medium truncate">{{ asset.mediaType }}</span>
          <span class="text-slate-600">•</span>
          <span class="text-slate-400 font-semibold flex-shrink-0">{{ asset.durationSeconds / 60 | number:'1.0-0' }} mins</span>
        </div>
      </div>
    </div>
  `
})
export class MediaAssetCardComponent {
  @Input() asset!: MediaAsset;
  @Input() isSelected: boolean = false;
  @Output() select = new EventEmitter<MediaAsset>();
}
