import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaAsset, MediaService } from '../../../core/services/media.service';

export type SortField = 'title' | 'mediaType' | 'createdAt' | 'fileSizeBytes' | 'status';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-media-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Top Section: Drag & Drop File Upload Dropzone (Entire Card Clickable) -->
      <div 
        (click)="fileInput.click()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        [class]="isDragging() ? 'border-purple-500 bg-purple-950/40 scale-[1.005]' : 'border-slate-800 bg-slate-900/60 hover:border-purple-500/50 hover:bg-slate-900/90'"
        class="border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all duration-200 backdrop-blur-sm relative shadow-xl cursor-pointer group select-none">
        
        <input 
          type="file" 
          #fileInput 
          (change)="onFileSelected($event)" 
          accept="audio/*,video/*,image/*,application/pdf"
          style="display: none !important;" />

        <div class="max-w-xl mx-auto space-y-3 pointer-events-none">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-600/30 transition-all duration-200 shadow-inner">
            <svg *ngIf="!isUploading" class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            <svg *ngIf="isUploading" class="w-7 h-7 animate-spin text-purple-300" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <div>
            <h3 class="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition">
              {{ isUploading ? 'Uploading Media File...' : 'Drag & drop media files here or click anywhere to browse' }}
            </h3>
            <p class="text-xs text-slate-400 mt-1">Supports MP3, WAV, AAC, FLAC, MP4, JPEG, PNG, WebP, and PDF assets</p>
          </div>
        </div>

        <!-- Pre-flight Validation Error Alert -->
        <div *ngIf="unsupportedError()" class="mt-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3 animate-fadeIn max-w-xl mx-auto">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-rose-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>{{ unsupportedError() }}</span>
          </div>
          <button (click)="unsupportedError.set(null)" class="text-rose-400 hover:text-white font-bold text-xs">✕</button>
        </div>
      </div>

      <!-- Controls & Search Bar (High-Contrast Cyber Card Container) -->
      <div class="ml-toolbar-card">
        <div class="relative w-full sm:w-96">
          <input 
            type="text" 
            [ngModel]="searchQuery()" 
            (ngModelChange)="searchQuery.set($event)" 
            placeholder="Search by file name or title..." 
            class="ml-search-input" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
        </div>

        <div class="flex items-center gap-2 self-start sm:self-auto">
          <div class="ml-filter-group">
            <button type="button" (click)="typeFilter.set('all')" [class.ml-filter-btn-active]="typeFilter() === 'all'" class="ml-filter-btn">
              All ({{ assets.length }})
            </button>
            <button type="button" (click)="typeFilter.set('audio')" [class.ml-filter-btn-active]="typeFilter() === 'audio'" class="ml-filter-btn">
              Audio
            </button>
            <button type="button" (click)="typeFilter.set('video')" [class.ml-filter-btn-active]="typeFilter() === 'video'" class="ml-filter-btn">
              Video
            </button>
            <button type="button" (click)="typeFilter.set('image')" [class.ml-filter-btn-active]="typeFilter() === 'image'" class="ml-filter-btn">
              Image
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content Area: Sortable Data Table & Detail Drawer -->
      <div class="relative min-h-[400px]">
        <!-- Table View -->
        <div class="ml-table-container">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm md:text-base">
              <thead class="ml-table-header select-none">
                <tr>
                  <th (click)="toggleSort('title')" class="py-4.5 px-5 cursor-pointer hover:text-white transition">
                    <div class="flex items-center gap-2">
                      <span>File Name</span>
                      <span *ngIf="sortColumn() === 'title'">{{ sortDirection() === 'asc' ? '▲' : '▼' }}</span>
                    </div>
                  </th>
                  <th (click)="toggleSort('mediaType')" class="py-4.5 px-5 cursor-pointer hover:text-white transition hidden md:table-cell">
                    <div class="flex items-center gap-2">
                      <span>Type</span>
                      <span *ngIf="sortColumn() === 'mediaType'">{{ sortDirection() === 'asc' ? '▲' : '▼' }}</span>
                    </div>
                  </th>
                  <th (click)="toggleSort('createdAt')" class="py-4.5 px-5 cursor-pointer hover:text-white transition hidden sm:table-cell">
                    <div class="flex items-center gap-2">
                      <span>Upload Date</span>
                      <span *ngIf="sortColumn() === 'createdAt'">{{ sortDirection() === 'asc' ? '▲' : '▼' }}</span>
                    </div>
                  </th>
                  <th (click)="toggleSort('fileSizeBytes')" class="py-4.5 px-5 cursor-pointer hover:text-white transition hidden lg:table-cell">
                    <div class="flex items-center gap-2">
                      <span>Size & Duration</span>
                      <span *ngIf="sortColumn() === 'fileSizeBytes'">{{ sortDirection() === 'asc' ? '▲' : '▼' }}</span>
                    </div>
                  </th>
                  <th (click)="toggleSort('status')" class="py-4.5 px-5 cursor-pointer hover:text-white transition">
                    <div class="flex items-center gap-2">
                      <span>Status</span>
                      <span *ngIf="sortColumn() === 'status'">{{ sortDirection() === 'asc' ? '▲' : '▼' }}</span>
                    </div>
                  </th>
                  <th class="py-4.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/80">
                <tr *ngFor="let asset of processedAssets()" 
                    (click)="selectAsset(asset)"
                    [class]="selectedAsset()?.id === asset.id ? 'bg-purple-950/50 border-purple-500/50' : ''"
                    class="ml-table-row cursor-pointer group">
                  
                  <!-- File Name (Original Filename Only - 50% Larger Text) -->
                  <td class="py-4.5 px-5">
                    <div class="flex items-center gap-3.5 min-w-0">
                      <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-purple-400 flex-shrink-0 shadow-inner">
                        <svg *ngIf="asset.mediaType.startsWith('video')" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        <svg *ngIf="asset.mediaType.startsWith('image')" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <svg *ngIf="!asset.mediaType.startsWith('video') && !asset.mediaType.startsWith('image')" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                        </svg>
                      </div>
                      <div class="min-w-0">
                        <div class="font-bold text-white text-base md:text-lg group-hover:text-purple-300 transition truncate max-w-xs lg:max-w-md" [title]="asset.originalName || asset.title">
                          {{ asset.originalName || asset.title }}
                        </div>
                      </div>
                    </div>
                  </td>

                  <!-- Type Column (Pill Badge) -->
                  <td class="py-4.5 px-5 hidden md:table-cell">
                    <span class="ml-type-badge">
                      {{ asset.mediaType }}
                    </span>
                  </td>

                  <!-- Upload Date -->
                  <td class="py-4.5 px-5 hidden sm:table-cell font-mono text-slate-200 text-xs md:text-sm font-semibold">
                    {{ asset.createdAt | date:'medium' }}
                  </td>

                  <!-- Size & Duration -->
                  <td class="py-4.5 px-5 hidden lg:table-cell font-mono text-slate-200 text-xs md:text-sm font-semibold">
                    <div>{{ formatFileSize(asset.fileSizeBytes) }}</div>
                    <div *ngIf="asset.durationSeconds > 0" class="text-xs text-slate-400">
                      {{ formatDuration(asset.durationSeconds) }}
                    </div>
                  </td>

                  <!-- Processing Status Badge -->
                  <td class="py-4.5 px-5 whitespace-nowrap">
                    <span *ngIf="asset.status === 'READY'" class="ml-status-ready">
                      <span>✓ READY</span>
                    </span>
                    <span *ngIf="asset.status === 'PROCESSING'" class="ml-status-processing">
                      <span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>PROCESSING</span>
                    </span>
                    <span *ngIf="asset.status === 'FAILED'" class="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs md:text-sm font-mono font-bold px-3.5 py-1.5 rounded-full shadow-sm">
                      FAILED
                    </span>
                  </td>

                  <!-- Actions Column -->
                  <td class="py-4.5 px-5 text-right whitespace-nowrap">
                    <button 
                      (click)="selectAsset(asset); $event.stopPropagation()" 
                      class="ml-action-btn">
                      View Details ↗
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div *ngIf="processedAssets().length === 0" class="p-12 text-center space-y-3">
            <div class="w-12 h-12 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <p class="text-sm text-slate-400 font-medium">No media assets found matching your search criteria.</p>
          </div>
        </div>

        <!-- Draggable Asset Detail Pane -->
        <div *ngIf="selectedAsset()" 
             [style.left.px]="panePosition()?.x"
             [style.top.px]="panePosition()?.y"
             class="fixed z-50 w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-y-auto max-h-[85vh] backdrop-blur-xl animate-fadeIn">
          
          <div class="space-y-6">
            <!-- Draggable Pane Header -->
            <div (mousedown)="startPaneDrag($event)" 
                 class="flex items-center justify-between pb-4 border-b border-slate-800 cursor-grab active:cursor-grabbing select-none group/header">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <span>Asset Details</span>
                <span class="px-2.5 py-0.5 rounded text-xs font-mono bg-purple-950 text-purple-300 border border-purple-800">
                  {{ selectedAsset()?.mediaType }}
                </span>
              </h3>
              <button (click)="selectedAsset.set(null); $event.stopPropagation()" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-xs transition border border-slate-700">✕</button>
            </div>

            <!-- Media Preview Box -->
            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <h4 class="text-xs font-bold text-slate-300">Preview</h4>
              
              <!-- Video Preview -->
              <div *ngIf="selectedAsset()?.mediaType?.startsWith('video')" class="aspect-video bg-black rounded-xl overflow-hidden">
                <video [src]="selectedAsset()?.cdnUrl" controls class="w-full h-full object-contain"></video>
              </div>

              <!-- Audio Preview -->
              <div *ngIf="!selectedAsset()?.mediaType?.startsWith('video') && !selectedAsset()?.mediaType?.startsWith('image')" class="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <audio [src]="selectedAsset()?.cdnUrl" controls class="w-full h-8"></audio>
              </div>

              <!-- Image Preview -->
              <div *ngIf="selectedAsset()?.mediaType?.startsWith('image')" class="max-h-48 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <img [src]="selectedAsset()?.cdnUrl" [alt]="selectedAsset()?.originalName" class="max-h-48 object-contain" />
              </div>
            </div>

            <!-- File Attributes List -->
            <div class="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs font-mono">
              <div class="flex justify-between border-b border-slate-800/80 pb-2">
                <span class="text-slate-400">Original File Name</span>
                <span class="text-white font-bold truncate max-w-[200px]" [title]="selectedAsset()?.originalName || selectedAsset()?.title">
                  {{ selectedAsset()?.originalName || selectedAsset()?.title }}
                </span>
              </div>

              <div class="flex justify-between border-b border-slate-800/80 pb-2">
                <span class="text-slate-400">Processing Status</span>
                <span [class]="selectedAsset()?.status === 'READY' ? 'text-emerald-400' : 'text-amber-400'" class="font-bold">
                  {{ selectedAsset()?.status }}
                </span>
              </div>

              <div class="flex justify-between border-b border-slate-800/80 pb-2">
                <span class="text-slate-400">File Size</span>
                <span class="text-slate-200">{{ formatFileSize(selectedAsset()?.fileSizeBytes || 0) }}</span>
              </div>

              <div class="flex justify-between border-b border-slate-800/80 pb-2">
                <span class="text-slate-400">Playback Duration</span>
                <span class="text-slate-200">{{ formatDuration(selectedAsset()?.durationSeconds || 0) }}</span>
              </div>

              <div class="flex justify-between border-b border-slate-800/80 pb-2">
                <span class="text-slate-400">Upload Date</span>
                <span class="text-slate-200">{{ selectedAsset()?.createdAt | date:'medium' }}</span>
              </div>

              <div class="flex justify-between border-b border-slate-800/80 pb-2">
                <span class="text-slate-400">Storage Key</span>
                <span class="text-slate-400 truncate max-w-[180px]" [title]="selectedAsset()?.filename">
                  {{ selectedAsset()?.filename }}
                </span>
              </div>

              <div class="flex justify-between">
                <span class="text-slate-400">Asset UUID</span>
                <span class="text-purple-300 font-bold truncate max-w-[180px]" [title]="selectedAsset()?.id">
                  {{ selectedAsset()?.id }}
                </span>
              </div>
            </div>

            <!-- CDN URL Link Box -->
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span class="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-400 block">CDN Streaming URL</span>
              <div class="flex items-center gap-2">
                <input 
                  type="text" 
                  [value]="selectedAsset()?.cdnUrl || ''" 
                  readonly 
                  class="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 font-mono text-xs text-purple-200 focus:outline-none" />
                <button 
                  (click)="copyCdnUrl(selectedAsset()?.cdnUrl || '')" 
                  class="flex-shrink-0 px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-xs font-bold transition">
                  {{ copiedCdn() ? '✓ Copied!' : 'Copy' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Action Controls -->
          <div class="pt-6 border-t border-slate-800 flex items-center justify-between gap-3 mt-6">
            <a 
              [href]="selectedAsset()?.cdnUrl" 
              target="_blank" 
              download
              class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-2">
              <span>⬇️ Download</span>
            </a>
            
            <button 
              (click)="deleteAsset(selectedAsset()!)" 
              class="px-4 py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center gap-2">
              <span>🗑️ Delete Asset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MediaLibraryComponent {
  @Input() assets: MediaAsset[] = [];
  @Input() isUploading: boolean = false;
  @Output() uploadFile = new EventEmitter<{ file: File; title: string }>();
  @Output() deleteMedia = new EventEmitter<MediaAsset>();

  searchQuery = signal<string>('');
  typeFilter = signal<'all' | 'audio' | 'video' | 'image'>('all');
  sortColumn = signal<SortField>('createdAt');
  sortDirection = signal<SortDirection>('desc');
  selectedAsset = signal<MediaAsset | null>(null);
  isDragging = signal<boolean>(false);
  unsupportedError = signal<string | null>(null);
  copiedCdn = signal<boolean>(false);
  isPaneDragging = signal<boolean>(false);
  panePosition = signal<{ x: number; y: number } | null>(null);
  private dragOffset = { x: 0, y: 0 };

  private mediaService = inject(MediaService);

  processedAssets = computed(() => {
    const query = (this.searchQuery() || '').toLowerCase().trim();
    const filter = this.typeFilter();
    const col = this.sortColumn();
    const dir = this.sortDirection();

    let list = (this.assets || []).filter(a => {
      const name = (a.originalName || a.title || '').toLowerCase();
      const matchesQuery = !query || name.includes(query);
      const matchesType = filter === 'all' ||
        (filter === 'video' && a.mediaType.startsWith('video')) ||
        (filter === 'image' && a.mediaType.startsWith('image')) ||
        (filter === 'audio' && !a.mediaType.startsWith('video') && !a.mediaType.startsWith('image'));
      return matchesQuery && matchesType;
    });

    return list.sort((a, b) => {
      let valA: any = a[col] || '';
      let valB: any = b[col] || '';
      if (col === 'title') {
        valA = (a.originalName || a.title || '').toLowerCase();
        valB = (b.originalName || b.title || '').toLowerCase();
      }
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  toggleSort(column: SortField) {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
  }

  selectAsset(asset: MediaAsset) {
    this.selectedAsset.set(asset);
    if (!this.panePosition()) {
      const defaultX = Math.max(10, window.innerWidth - 470);
      const defaultY = 90;
      this.panePosition.set({ x: defaultX, y: defaultY });
    }
  }

  startPaneDrag(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button') || target.tagName === 'INPUT') {
      return;
    }
    
    event.preventDefault();
    this.isPaneDragging.set(true);
    
    const pos = this.panePosition() || { x: Math.max(10, window.innerWidth - 470), y: 90 };
    this.dragOffset = {
      x: event.clientX - pos.x,
      y: event.clientY - pos.y
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.isPaneDragging()) return;
      const newX = Math.max(10, Math.min(window.innerWidth - 420, moveEvent.clientX - this.dragOffset.x));
      const newY = Math.max(10, Math.min(window.innerHeight - 150, moveEvent.clientY - this.dragOffset.y));
      this.panePosition.set({ x: newX, y: newY });
    };

    const onMouseUp = () => {
      this.isPaneDragging.set(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      this.processSelectedFile(file);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.processSelectedFile(file);
      input.value = '';
    }
  }

  private processSelectedFile(file: File) {
    const mimeType = file.type || 'application/octet-stream';
    if (!this.mediaService.isSupportedContentType(mimeType)) {
      this.unsupportedError.set(`File format '${mimeType}' is not supported. Supported formats: MP3, WAV, AAC, FLAC, MP4, JPEG, PNG, WebP, PDF.`);
      return;
    }
    this.unsupportedError.set(null);
    this.uploadFile.emit({ file, title: file.name });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '--';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
    if (!seconds || seconds === 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  copyCdnUrl(url: string) {
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedCdn.set(true);
      setTimeout(() => this.copiedCdn.set(false), 2000);
    });
  }

  deleteAsset(asset: MediaAsset) {
    if (confirm(`Are you sure you want to delete media asset '${asset.originalName || asset.title}'?`)) {
      this.deleteMedia.emit(asset);
      if (this.selectedAsset()?.id === asset.id) {
        this.selectedAsset.set(null);
      }
    }
  }
}
