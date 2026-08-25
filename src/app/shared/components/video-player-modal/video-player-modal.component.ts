import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaAsset } from '../../../core/services/media.service';

@Component({
  selector: 'app-video-player-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="asset" (click)="close.emit()" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 sm:p-6 cursor-pointer">
      <div (click)="$event.stopPropagation()" class="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative cursor-default" style="max-width: 860px; max-height: 90vh;">
        
        <button (click)="close.emit(); $event.stopPropagation()" title="Close Video Player" class="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-slate-950/90 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-white flex items-center justify-center font-bold text-lg transition shadow-xl cursor-pointer">
          ✕
        </button>

        <div class="w-full bg-black relative aspect-video flex items-center justify-center overflow-hidden" style="min-height: 380px; max-height: 520px;">
          <video [src]="asset.cdnUrl" controls autoplay class="w-full h-full object-contain"></video>
        </div>

        <div class="p-5 sm:p-6 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div class="min-w-0 flex-1 pr-4">
            <span class="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-md inline-block mb-1">
              {{ asset.mediaType }}
            </span>
            <h3 class="text-lg font-black text-white truncate max-w-full block" [title]="asset.title || asset.originalName">{{ asset.title || asset.originalName }}</h3>
            <p class="text-xs text-slate-400 font-mono mt-0.5 truncate" [title]="asset.originalName">Filename: {{ asset.originalName }}</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class VideoPlayerModalComponent {
  @Input() asset: MediaAsset | null = null;
  @Output() close = new EventEmitter<void>();
}
