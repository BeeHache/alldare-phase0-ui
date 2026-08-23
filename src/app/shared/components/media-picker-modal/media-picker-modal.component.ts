import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaAsset } from '../../../core/services/media.service';
import { MediaAssetCardComponent } from '../media-asset-card/media-asset-card.component';

@Component({
  selector: 'app-media-picker-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaAssetCardComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div class="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button (click)="close.emit()" class="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition border border-slate-700/60">✕</button>

        <div class="mb-5 flex-shrink-0">
          <h3 class="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
            <svg class="w-6 h-6 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>Select Media Asset from Library</span>
          </h3>
          <p class="text-xs text-slate-400">Choose a pre-uploaded asset from your creator media repository.</p>
        </div>

        <!-- Search & Filter Controls Bar -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 flex-shrink-0">
          <div class="relative w-full sm:w-72">
            <input type="text" 
                   [ngModel]="searchQuery()" 
                   (ngModelChange)="searchQuery.set($event)" 
                   placeholder="Search assets by title..." 
                   class="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition" />
            <svg class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          
          <div class="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button type="button" (click)="typeFilter.set('all')" [class]="typeFilter() === 'all' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'" class="px-3 py-1 rounded-lg text-[11px] font-mono transition">
              All ({{ (assets || []).length }})
            </button>
            <button type="button" (click)="typeFilter.set('audio')" [class]="typeFilter() === 'audio' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'" class="px-3 py-1 rounded-lg text-[11px] font-mono transition">
              Audio
            </button>
            <button type="button" (click)="typeFilter.set('video')" [class]="typeFilter() === 'video' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white'" class="px-3 py-1 rounded-lg text-[11px] font-mono transition">
              Video
            </button>
          </div>
        </div>

        <!-- Scrollable Asset Grid -->
        <div class="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
          <div *ngIf="filteredAssets().length > 0" class="flex flex-col gap-3">
            <app-media-asset-card *ngFor="let asset of filteredAssets()"
                                  [asset]="asset"
                                  [isSelected]="selectedAssetId === asset.id || selectedAssetId === asset.cdnUrl"
                                  (select)="assetSelected.emit($event)">
            </app-media-asset-card>
          </div>

          <div *ngIf="filteredAssets().length === 0" class="py-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800">
            <p class="text-xs text-slate-400 font-medium">No media assets match your search term.</p>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-slate-800 flex justify-end flex-shrink-0">
          <button (click)="close.emit()" class="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700 transition">
            Close Picker
          </button>
        </div>
      </div>
    </div>
  `
})
export class MediaPickerModalComponent {
  @Input() isOpen: boolean = false;
  @Input() assets: MediaAsset[] = [];
  @Input() selectedAssetId?: string;
  @Output() close = new EventEmitter<void>();
  @Output() assetSelected = new EventEmitter<MediaAsset>();

  searchQuery = signal<string>('');
  typeFilter = signal<'all' | 'audio' | 'video'>('all');

  filteredAssets(): MediaAsset[] {
    const q = (this.searchQuery() || '').toLowerCase().trim();
    const f = this.typeFilter();
    return (this.assets || []).filter(a => {
      const matchesQ = !q || (a.title || '').toLowerCase().includes(q) || (a.originalName || '').toLowerCase().includes(q);
      const matchesF = f === 'all' || 
        (f === 'video' && a.mediaType.startsWith('video')) || 
        (f === 'audio' && !a.mediaType.startsWith('video'));
      return matchesQ && matchesF;
    });
  }
}
