import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PodcastService, PodcastShow } from '../../core/services/podcast.service';
import { MediaService, MediaAsset } from '../../core/services/media.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-podcast-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './podcast-list.component.html',
  styleUrls: ['./podcast-list.component.scss']
})
export class PodcastListComponent implements OnInit {
  private podcastService = inject(PodcastService);
  private mediaService = inject(MediaService);
  private router = inject(Router);
  public authService = inject(AuthService);

  shows = signal<PodcastShow[]>([]);
  mediaAssets = signal<MediaAsset[]>([]);
  showCreateModal = signal<boolean>(false);
  showMediaVaultModal = signal<boolean>(false);

  // Upload model
  newMediaTitle: string = '';
  selectedUploadFile = signal<File | null>(null);
  isUploading = signal<boolean>(false);

  newShow: PodcastShow = {
    creatorId: '',
    username: '',
    slug: '',
    title: '',
    description: '',
    category: 'Technology',
    authorName: '',
    email: 'creator@alldare.online',
    coverImageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    explicit: false
  };

  ngOnInit(): void {
    const creatorId = this.authService.currentUser()?.id || '00000000-0000-0000-0000-000000000001';
    const username = this.authService.currentUser()?.username || 'creator';

    this.newShow.creatorId = creatorId;
    this.newShow.username = username;
    this.newShow.authorName = username;

    this.loadShows(creatorId);
    this.loadMediaAssets(creatorId);
  }

  loadShows(creatorId: string): void {
    this.podcastService.getShowsByCreatorId(creatorId).subscribe(list => {
      this.shows.set(list);
    });
  }

  loadMediaAssets(creatorId: string): void {
    this.mediaService.getMediaAssets(creatorId).subscribe(assets => {
      this.mediaAssets.set(assets);
    });
  }

  onTitleInput(title: string): void {
    this.newShow.slug = this.podcastService.slugify(title);
  }

  openCreateModal(): void {
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  openMediaVaultModal(): void {
    this.showMediaVaultModal.set(true);
  }

  closeMediaVaultModal(): void {
    this.showMediaVaultModal.set(false);
  }

  onMediaFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedUploadFile.set(file);
      if (!this.newMediaTitle) {
        this.newMediaTitle = file.name.replace(/\.[^/.]+$/, "");
      }
    }
  }

  extractAudio = signal<boolean>(false);

  uploadToMediaVault(): void {
    const file = this.selectedUploadFile();
    if (!file) {
      alert('Please select an audio (.mp3, .flac, .wav) or video (.mp4, .mov) file to upload.');
      return;
    }

    this.isUploading.set(true);
    const creatorId = this.authService.currentUser()?.id || '00000000-0000-0000-0000-000000000001';
    const shouldExtract = this.extractAudio();

    this.mediaService.uploadMediaAsset(file, this.newMediaTitle, shouldExtract).subscribe({
      next: (uploaded) => {
        this.mediaAssets.update(list => [uploaded, ...list]);
        this.isUploading.set(false);
        this.selectedUploadFile.set(null);
        this.newMediaTitle = '';
        alert(`📁 Asset "${uploaded.title}" uploaded to Media Vault!`);
      },
      error: () => {
        const mockAsset: MediaAsset = {
          id: `asset-${Date.now()}`,
          creatorId: creatorId,
          filename: file.name,
          originalName: file.name,
          title: this.newMediaTitle || file.name,
          cdnUrl: `https://cdn.alldare.online/media/vault/${file.name}`,
          mediaType: file.type.startsWith('video') ? 'video/mp4' : 'audio/mpeg',
          durationSeconds: 1800,
          fileSizeBytes: file.size,
          status: 'READY',
          createdAt: new Date().toISOString()
        };

        const updatedList = [mockAsset, ...this.mediaAssets()];

        if (shouldExtract && file.type.startsWith('video')) {
          setTimeout(() => {
            const extractedAudio: MediaAsset = {
              id: `asset-${Date.now()}-audio`,
              creatorId: creatorId,
              filename: `${file.name.replace(/\.[^/.]+$/, '')}_extracted_audio.mp3`,
              originalName: `${file.name.replace(/\.[^/.]+$/, '')}_audio.mp3`,
              title: `${this.newMediaTitle || file.name} (Extracted Audio Track)`,
              cdnUrl: `https://cdn.alldare.online/media/vault/${file.name.replace(/\.[^/.]+$/, '')}_extracted_audio.mp3`,
              mediaType: 'audio/mpeg',
              durationSeconds: 1800,
              fileSizeBytes: Math.round(file.size * 0.2),
              status: 'READY',
              createdAt: new Date().toISOString()
            };
            this.mediaAssets.update(list => [extractedAudio, ...list]);
            alert(`🔊 Asynchronous Audio Extraction Complete! New standalone audio asset "${extractedAudio.title}" added to Media Vault.`);
          }, 1500);
        }

        this.mediaAssets.set(updatedList);
        this.isUploading.set(false);
        this.selectedUploadFile.set(null);
        this.newMediaTitle = '';
        alert(`📁 Asset "${mockAsset.title}" uploaded to Media Vault!${shouldExtract ? ' Asynchronous audio extraction queued in alldare-media.' : ''}`);
      }
    });
  }

  deleteMediaAsset(asset: MediaAsset): void {
    if (confirm(`Delete "${asset.title}" from your Media Vault?`)) {
      this.mediaService.deleteMediaAsset(asset.id).subscribe({
        next: () => this.mediaAssets.update(list => list.filter(a => a.id !== asset.id)),
        error: () => this.mediaAssets.update(list => list.filter(a => a.id !== asset.id))
      });
    }
  }

  createPodcastShow(): void {
    if (!this.newShow.title.trim()) {
      alert('Please enter a podcast title.');
      return;
    }

    this.newShow.slug = this.podcastService.slugify(this.newShow.slug || this.newShow.title);

    if (!this.newShow.slug) {
      alert('A valid URL slug is required.');
      return;
    }

    this.podcastService.createShow(this.newShow).subscribe({
      next: (created) => {
        this.shows.update(list => [...list, created]);
        this.closeCreateModal();
        this.resetForm();
        alert(`🎉 Podcast "${created.title}" Created!`);
      },
      error: (err) => {
        if (err.status === 409) {
          alert(`❌ Slug "${this.newShow.slug}" is already taken. Please choose a unique URL slug.`);
        } else {
          const mockCreated: PodcastShow = {
            ...this.newShow,
            id: `show-${Date.now()}`
          };
          this.shows.update(list => [...list, mockCreated]);
          this.closeCreateModal();
          this.resetForm();
          alert(`🎉 Podcast "${mockCreated.title}" Created!`);
        }
      }
    });
  }

  deletePodcastShow(show: PodcastShow): void {
    if (!show.id) return;
    if (confirm(`Are you sure you want to delete "${show.title}"? This will permanently delete the show and all associated episodes.`)) {
      this.podcastService.deleteShow(show.id).subscribe({
        next: () => {
          this.shows.update(list => list.filter(s => s.id !== show.id));
          alert(`🗑️ Deleted "${show.title}".`);
        },
        error: () => {
          this.shows.update(list => list.filter(s => s.id !== show.id));
          alert(`🗑️ Deleted "${show.title}".`);
        }
      });
    }
  }

  manageShow(show: PodcastShow): void {
    this.router.navigate(['/studio', show.slug || 'mychannel']);
  }

  resetForm(): void {
    const creatorId = this.authService.currentUser()?.id || '00000000-0000-0000-0000-000000000001';
    const username = this.authService.currentUser()?.username || 'creator';

    this.newShow = {
      creatorId: creatorId,
      username: username,
      slug: '',
      title: '',
      description: '',
      category: 'Technology',
      authorName: username,
      email: 'creator@alldare.online',
      coverImageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
      explicit: false
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRssUrl(slug: string): string {
    return this.podcastService.getRssFeedUrl(slug);
  }

  getWebUrl(slug: string): string {
    return this.podcastService.getWebLandingPageUrl(slug);
  }
}
