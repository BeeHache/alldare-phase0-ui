import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center space-y-3 max-w-lg mx-auto my-6">
      <div class="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <h4 class="text-lg font-bold text-white">{{ title }}</h4>
      <p class="text-xs text-slate-400 leading-relaxed">{{ description }}</p>
      <button *ngIf="actionLabel" (click)="action.emit()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-slate-700 rounded-xl text-xs font-semibold transition">
        {{ actionLabel }}
      </button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() title: string = 'No Results Found';
  @Input() description: string = 'No items match your criteria.';
  @Input() actionLabel?: string;

  @Output() action = new EventEmitter<void>();
}
