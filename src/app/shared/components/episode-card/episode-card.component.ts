import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PodcastEpisode } from '../../../core/services/podcast.service';

@Component({
  selector: 'app-episode-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
      <div class="space-y-1">
        <div class="flex items-center gap-2">
          <span [class]="episode.isDraft ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'" class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border flex items-center gap-1">
            <span [class]="episode.isDraft ? 'bg-amber-400' : 'bg-emerald-400'" class="w-1.5 h-1.5 rounded-full"></span>
            <span>{{ episode.isDraft ? 'DRAFT' : 'LIVE' }}</span>
          </span>
          <span class="text-xs text-purple-400 font-mono uppercase">{{ episode.mediaType }}</span>
        </div>
        <h3 class="text-base font-bold text-white mt-1">{{ episode.title }}</h3>
        <p class="text-xs font-mono text-slate-400 mt-0.5 truncate max-w-xl" [title]="episode.mediaUrl">{{ episode.mediaUrl }}</p>
        <p class="text-xs text-slate-400 mt-1 line-clamp-3">{{ episode.description }}</p>
      </div>

      <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <span class="text-xs text-slate-400 font-mono flex-shrink-0 mr-1">{{ episode.durationSeconds / 60 | number:'1.0-0' }} mins</span>
        
        <button *ngIf="showControls" (click)="edit.emit(episode)" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
          <span>Edit</span>
        </button>

        <button *ngIf="showControls" (click)="toggleStatus.emit(episode)" [class]="episode.isDraft ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5">
          <svg *ngIf="episode.isDraft" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          <svg *ngIf="!episode.isDraft" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
          <span>{{ episode.isDraft ? 'Publish Live' : 'Revert to Draft' }}</span>
        </button>

        <button *ngIf="showControls" (click)="delete.emit(episode)" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700/60 transition" title="Delete Episode">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
          </svg>
        </button>
      </div>
    </div>
  `
})
export class EpisodeCardComponent {
  @Input() episode!: PodcastEpisode;
  @Input() showControls: boolean = true;
  @Output() edit = new EventEmitter<PodcastEpisode>();
  @Output() toggleStatus = new EventEmitter<PodcastEpisode>();
  @Output() delete = new EventEmitter<PodcastEpisode>();
}
