import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PodcastEpisode } from '../../../core/services/podcast.service';

@Component({
  selector: 'app-episode-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col overflow-hidden">
        <button (click)="close.emit()" aria-label="Close modal" class="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm z-10 transition border border-slate-700/60">✕</button>

        <div class="flex-shrink-0 mb-4">
          <h3 class="text-2xl font-extrabold text-white mb-1">
            {{ isEditMode ? 'Edit Episode' : 'Create & Publish Episode' }}
          </h3>
          <p class="text-xs text-slate-400">
            {{ isEditMode ? 'Update episode title, description, attached media URL, and publish status.' : 'Attach a media asset from your library, add show notes, and publish to your RSS feed.' }}
          </p>
        </div>

        <div class="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          <div>
            <label class="form-label-prominent">Episode Title <span class="text-rose-400">*</span></label>
            <input type="text" [(ngModel)]="episodeForm.title" placeholder="Enter episode title (e.g. Ep 101: The Future of AI)" class="form-input-prominent" />
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="form-label-prominent mb-0">Episode Description & Show Notes</label>
              <span class="text-[10px] font-mono text-slate-400 font-semibold whitespace-nowrap">{{ 500 - ((episodeForm.description || '').length) }} remaining</span>
            </div>
            <textarea [(ngModel)]="episodeForm.description" rows="4" maxlength="500" placeholder="Add timestamps, guest links, and notes..." class="form-input-prominent resize-none"></textarea>
          </div>

          <div>
            <label class="form-label-prominent">Attached Media Asset <span class="text-rose-400">*</span></label>
            <div class="flex items-center gap-2">
              <input type="text" 
                     [ngModel]="episodeForm.mediaUrl" 
                     readonly 
                     placeholder="Click 'Pick Media' button to select asset from library..." 
                     class="form-input-prominent font-mono text-purple-300 flex-1 text-xs cursor-not-allowed bg-slate-950/80" />
              <button type="button" (click)="openPicker.emit()" class="py-3 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shadow-sm">
                <svg class="w-4 h-4 text-purple-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>Pick Media</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label-prominent">Media Type</label>
              <input type="text" [(ngModel)]="episodeForm.mediaType" placeholder="audio/mpeg or video/mp4" class="form-input-prominent font-mono text-xs" />
            </div>
            <div>
              <label class="form-label-prominent">Duration (seconds)</label>
              <input type="number" [(ngModel)]="episodeForm.durationSeconds" class="form-input-prominent font-mono text-xs" />
            </div>
          </div>

          <!-- Draft Mode Toggle -->
          <div class="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
            <div>
              <h5 class="text-xs font-bold text-white flex items-center gap-2">
                <span>Publish Immediately</span>
                <span [class]="episodeForm.isDraft ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'" class="px-2 py-0.5 rounded text-[10px] font-mono font-bold border">
                  {{ episodeForm.isDraft ? 'SAVING AS DRAFT' : 'LIVE ON RSS' }}
                </span>
              </h5>
              <p class="text-[10px] text-slate-400 mt-0.5">Toggle off to save as a private draft before pushing live to Spotify/Apple RSS feeds.</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input type="checkbox" [checked]="!episodeForm.isDraft" (change)="episodeForm.isDraft = !$any($event.target).checked" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        <div class="pt-4 mt-3 border-t border-slate-800 flex-shrink-0 flex items-center justify-end gap-3 bg-slate-900 z-10">
          <button (click)="close.emit()" class="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition border border-slate-700">
            Cancel
          </button>
          <button (click)="submitForm()" 
                  [disabled]="!isFormValid()" 
                  class="btn-gradient-primary py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed">
            <svg class="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{{ isEditMode ? 'Save Changes' : (episodeForm.isDraft ? 'Save Draft Episode' : 'Publish Episode Live') }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class EpisodeModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() initialEpisodeData?: PodcastEpisode | null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PodcastEpisode>();
  @Output() openPicker = new EventEmitter<void>();

  episodeForm: PodcastEpisode = {
    showId: '',
    title: '',
    description: '',
    mediaUrl: '',
    mediaType: 'audio/mpeg',
    durationSeconds: 1800,
    fileSizeBytes: 25000000,
    isDraft: true
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialEpisodeData'] && this.initialEpisodeData) {
      this.episodeForm = { ...this.initialEpisodeData };
    } else if (!this.isEditMode && changes['isOpen'] && this.isOpen) {
      this.resetForm();
    }
  }

  resetForm(): void {
    this.episodeForm = {
      showId: '',
      title: '',
      description: '',
      mediaUrl: '',
      mediaType: 'audio/mpeg',
      durationSeconds: 1800,
      fileSizeBytes: 25000000,
      isDraft: true
    };
  }

  isFormValid(): boolean {
    const title = (this.episodeForm.title || '').trim();
    const mediaUrl = (this.episodeForm.mediaUrl || '').trim();
    return title.length > 0 && mediaUrl.length > 0;
  }

  submitForm(): void {
    const title = (this.episodeForm.title || '').trim();
    const mediaUrl = (this.episodeForm.mediaUrl || '').trim();

    if (!title) {
      alert('Episode title is required.');
      return;
    }
    if (!mediaUrl) {
      alert('Media asset CDN URL is required. Click "Pick Media" to select an asset.');
      return;
    }
    this.save.emit({
      ...this.episodeForm,
      title: title,
      description: this.episodeForm.description || '',
      mediaUrl: mediaUrl
    });
  }
}
