import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PodcastShow } from '../../../core/services/podcast.service';
import { DEFAULT_COVER_IMAGE } from '../../../core/constants/app.constants';
import { RssFeedBoxComponent } from '../rss-feed-box/rss-feed-box.component';

@Component({
  selector: 'app-podcast-show-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, RssFeedBoxComponent],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div class="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col overflow-hidden">
        <button (click)="close.emit()" aria-label="Close modal" class="absolute top-5 right-5 w-8 h-8 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm z-10 transition border border-slate-700/60">✕</button>

        <div class="flex-shrink-0 mb-4">
          <h3 class="text-2xl font-extrabold text-white mb-1">
            {{ isEditMode ? 'Edit Podcast Show' : 'Create New Podcast Show' }}
          </h3>
          <p class="text-xs text-slate-400">
            {{ isEditMode ? 'Update show details. The URL slug is immutable to preserve existing feed subscribers.' : 'Configure show branding, iTunes RSS syndication metadata, and distribution settings.' }}
          </p>
        </div>

        <div class="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          <div>
            <label class="form-label-prominent flex items-center justify-between">
              <span>Podcast Show Title <span class="text-rose-400">*</span></span>
            </label>
            <input type="text" [(ngModel)]="showForm.title" (ngModelChange)="onTitleInput($event)" [class.input-invalid]="isTitleInvalid()" placeholder="Enter title (e.g. Deep Tech Talk)" class="form-input-prominent" />
          </div>

          <div>
            <label class="form-label-prominent">
              {{ isEditMode ? 'URL Slug (Immutable)' : 'Unique URL Slug *' }}
            </label>
            <input type="text" [(ngModel)]="showForm.slug" [disabled]="isEditMode" [class.cursor-not-allowed]="isEditMode" [class.select-none]="isEditMode" [class.bg-slate-950]="isEditMode" [class.border-slate-800]="isEditMode" [class.text-slate-500]="isEditMode" [class.input-invalid]="isSlugInvalid()" placeholder="e.g. deep-tech-talk" class="form-input-prominent font-mono text-purple-300" />
            
            <p *ngIf="isEditMode" class="text-[11px] text-amber-400/90 mt-1.5 flex items-center gap-1.5 font-medium">
              <svg class="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span>URL Slug cannot be changed after podcast creation.</span>
            </p>

            <app-rss-feed-box *ngIf="!isEditMode" [url]="getRssUrl(showForm.slug || 'your-slug')" [isValid]="!!showForm.slug"></app-rss-feed-box>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="form-label-prominent mb-0">Show Description</label>
              <span class="text-[10px] font-mono text-slate-400 font-semibold whitespace-nowrap">{{ 500 - ((showForm.description || '').length) }} remaining</span>
            </div>
            <textarea [(ngModel)]="showForm.description" rows="3" maxlength="500" placeholder="Write a show summary and host details..." class="form-input-prominent resize-none"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label-prominent">Category <span class="text-rose-400">*</span></label>
              <div class="relative">
                <select [(ngModel)]="showForm.category" [class.input-invalid]="isCategoryInvalid()" class="form-input-prominent appearance-none pr-10">
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Arts">Arts</option>
                  <option value="Society & Culture">Society & Culture</option>
                  <option value="News">News</option>
                  <option value="Comedy">Comedy</option>
                  <option value="Health & Fitness">Health & Fitness</option>
                  <option value="Science">Science</option>
                </select>
                <svg class="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </div>
            </div>
            <div>
              <label class="form-label-prominent">Author Name <span class="text-rose-400">*</span></label>
              <input type="text" [(ngModel)]="showForm.authorName" [class.input-invalid]="isAuthorInvalid()" placeholder="Author / Publisher Name" class="form-input-prominent" />
            </div>
          </div>

          <div>
            <label class="form-label-prominent">Cover Image URL</label>
            <div class="flex items-center gap-2">
              <input type="text" [(ngModel)]="showForm.coverImageUrl" placeholder="https://domain.com/cover.jpg or select media..." class="form-input-prominent flex-1" />
              <button type="button" (click)="openPicker.emit()" class="py-3 px-4 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shadow-sm">
                <svg class="w-4 h-4 flex-shrink-0 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>Pick Media</span>
              </button>
            </div>
            
            <!-- Cleaned Live Preview with Hover Popover -->
            <div class="mt-2.5 inline-flex items-center p-1 bg-slate-950/60 border border-slate-800 rounded-xl relative">
              <div class="relative flex-shrink-0 cursor-pointer popover-thumb-wrapper">
                <img [src]="showForm.coverImageUrl || DEFAULT_COVER_IMAGE" (error)="$any($event.target).src=DEFAULT_COVER_IMAGE" style="width: 44px; height: 44px; min-width: 44px; max-width: 44px; max-height: 44px; object-fit: cover;" class="w-11 h-11 rounded-lg object-cover border border-slate-700 shadow-sm flex-shrink-0 transition-transform duration-200 hover:scale-105" alt="Preview" />
                <div class="absolute bottom-full left-0 mb-3 popover-preview z-50 transition-all duration-200 ease-out">
                  <div class="bg-slate-900 border-2 border-purple-500/60 p-2 rounded-2xl shadow-2xl backdrop-blur-xl">
                    <img [src]="showForm.coverImageUrl || DEFAULT_COVER_IMAGE" (error)="$any($event.target).src=DEFAULT_COVER_IMAGE" style="width: 220px; height: 220px; min-width: 220px; max-width: 220px; max-height: 220px; object-fit: cover;" class="rounded-xl object-cover shadow-inner" alt="Enlarged Hover Preview" />
                    <span class="block text-[10px] font-mono text-purple-300 text-center mt-1.5 font-bold">🔍 Live Cover Art Preview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-4 mt-3 border-t border-slate-800 flex-shrink-0 flex items-center justify-end gap-3 bg-slate-900 z-10">
          <button (click)="close.emit()" class="py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs transition border border-slate-700">
            Cancel
          </button>
          <button (click)="submitForm()" [disabled]="!isFormValid()" [class.btn-disabled]="!isFormValid()" class="btn-gradient-primary py-2.5 px-6 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20">
            <svg *ngIf="!isEditMode" class="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <svg *ngIf="isEditMode" class="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>{{ isEditMode ? 'Save Changes' : 'Create & Publish Show' }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class PodcastShowModalComponent implements OnChanges {
  @Input() isOpen: boolean = false;
  @Input() isEditMode: boolean = false;
  @Input() initialShowData?: PodcastShow;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<PodcastShow>();
  @Output() openPicker = new EventEmitter<void>();

  DEFAULT_COVER_IMAGE = DEFAULT_COVER_IMAGE;

  showForm: PodcastShow = {
    creatorId: '',
    username: '',
    slug: '',
    title: '',
    description: '',
    category: 'Technology',
    authorName: '',
    email: '',
    coverImageUrl: '',
    explicit: false
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialShowData'] && this.initialShowData) {
      this.showForm = { ...this.initialShowData };
    }
  }

  isTitleInvalid(): boolean {
    return !(this.showForm.title || '').trim();
  }

  isSlugInvalid(): boolean {
    return !(this.showForm.slug || '').trim();
  }

  isCategoryInvalid(): boolean {
    return !(this.showForm.category || '').trim();
  }

  isAuthorInvalid(): boolean {
    return !(this.showForm.authorName || '').trim();
  }

  isFormValid(): boolean {
    return !this.isTitleInvalid() && !this.isSlugInvalid() && !this.isCategoryInvalid() && !this.isAuthorInvalid();
  }

  onTitleInput(title: string): void {
    if (!this.isEditMode) {
      this.showForm.slug = (title || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
  }

  getRssUrl(slug: string): string {
    return `https://podcasts.alldare.online/${slug}/rss.xml`;
  }

  submitForm(): void {
    if (!this.isFormValid()) {
      return;
    }
    const title = (this.showForm.title || '').trim();
    const slug = (this.showForm.slug || '').trim();

    this.save.emit({
      ...this.showForm,
      title: title,
      slug: slug,
      description: this.showForm.description || ''
    });
  }
}
