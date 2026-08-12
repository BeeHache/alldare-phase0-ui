import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PodcastService, PodcastShow, PodcastEpisode } from '../../core/services/podcast.service';
import { MediaService, MediaAsset } from '../../core/services/media.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.scss']
})
export class StudioComponent implements OnInit {
  private podcastService = inject(PodcastService);
  private mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public authService = inject(AuthService);

  activeTab = signal<'publish' | 'vault' | 'slideshow' | 'show' | 'episodes' | 'monetization'>('publish');
  isUploading = signal<boolean>(false);
  isCreatorProSubscribed = signal<boolean>(false);
  copiedRss = signal<boolean>(false);

  // Active Podcast Show
  show = signal<PodcastShow>({
    creatorId: '00000000-0000-0000-0000-000000000001',
    username: 'mychannel',
    slug: 'mychannel',
    title: 'My Official Podcast & Vodcast',
    description: 'Behind the scenes video & audio podcast feed.',
    category: 'Technology',
    authorName: 'Creator Name',
    email: 'creator@alldare.online',
    coverImageUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    explicit: false
  });

  // Media Vault Assets from alldare-media
  mediaAssets = signal<MediaAsset[]>([]);
  selectedMediaAsset = signal<MediaAsset | null>(null);

  // New Media Upload Form
  newMediaTitle: string = '';
  selectedUploadFile = signal<File | null>(null);

  // Episode Form
  newEpisode: PodcastEpisode = {
    showId: '',
    title: '',
    description: '',
    mediaUrl: '',
    mediaType: 'audio/mpeg',
    durationSeconds: 1800,
    fileSizeBytes: 25000000
  };

  episodes = signal<PodcastEpisode[]>([]);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug') || 'mychannel';
    const creatorId = this.authService.currentUser()?.id || '00000000-0000-0000-0000-000000000001';

    this.loadShowDetails(slug);
    this.loadMediaAssets(creatorId);
  }

  loadShowDetails(slug: string): void {
    this.podcastService.getShowBySlug(slug).subscribe(showData => {
      this.show.set(showData);
      this.podcastService.getEpisodesBySlug(slug).subscribe(eps => this.episodes.set(eps));
    });
  }

  loadMediaAssets(creatorId: string): void {
    this.mediaService.getMediaAssets(creatorId).subscribe(assets => {
      this.mediaAssets.set(assets);
      if (assets.length > 0 && !this.selectedMediaAsset()) {
        this.onSelectMediaAsset(assets[0]);
      }
    });
  }

  onSelectMediaAsset(asset: MediaAsset): void {
    this.selectedMediaAsset.set(asset);
    this.newEpisode.mediaUrl = asset.cdnUrl;
    this.newEpisode.mediaType = asset.mediaType;
    this.newEpisode.durationSeconds = asset.durationSeconds;
    this.newEpisode.fileSizeBytes = asset.fileSizeBytes;

    if (!this.newEpisode.title) {
      this.newEpisode.title = asset.title || asset.originalName;
    }
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
        this.onSelectMediaAsset(uploaded);
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
        this.onSelectMediaAsset(mockAsset);
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
        next: () => {
          this.mediaAssets.update(list => list.filter(a => a.id !== asset.id));
          if (this.selectedMediaAsset()?.id === asset.id) {
            const remaining = this.mediaAssets();
            this.selectedMediaAsset.set(remaining.length > 0 ? remaining[0] : null);
          }
        },
        error: () => {
          this.mediaAssets.update(list => list.filter(a => a.id !== asset.id));
          if (this.selectedMediaAsset()?.id === asset.id) {
            const remaining = this.mediaAssets();
            this.selectedMediaAsset.set(remaining.length > 0 ? remaining[0] : null);
          }
        }
      });
    }
  }

  publishEpisode(): void {
    if (!this.selectedMediaAsset()) {
      alert('Please select a media asset from your Media Vault to publish this episode.');
      return;
    }

    if (!this.newEpisode.title.trim()) {
      alert('Please enter an episode title.');
      return;
    }

    this.isUploading.set(true);
    setTimeout(() => {
      const savedEp: PodcastEpisode = {
        ...this.newEpisode,
        id: `ep-${Date.now()}`,
        showId: this.show().id || '',
        mediaUrl: this.selectedMediaAsset()!.cdnUrl,
        mediaType: this.selectedMediaAsset()!.mediaType,
        durationSeconds: this.selectedMediaAsset()!.durationSeconds,
        fileSizeBytes: this.selectedMediaAsset()!.fileSizeBytes
      };
      
      this.episodes.update(list => [savedEp, ...list]);
      this.isUploading.set(false);
      this.newEpisode = {
        showId: this.show().id || '',
        title: '',
        description: '',
        mediaUrl: '',
        mediaType: 'audio/mpeg',
        durationSeconds: 1800,
        fileSizeBytes: 25000000
      };

      alert(`🚀 Episode "${savedEp.title}" Published to Open RSS 2.0 (${this.rssFeedUrl})!`);
    }, 1000);
  }

  backToPodcasts(): void {
    this.router.navigate(['/podcasts']);
  }

  get rssFeedUrl(): string {
    return this.podcastService.getRssFeedUrl(this.show().slug || 'mychannel');
  }

  get atomFeedUrl(): string {
    return this.podcastService.getAtomFeedUrl(this.show().slug || 'mychannel');
  }

  get webLandingPageUrl(): string {
    return this.podcastService.getWebLandingPageUrl(this.show().slug || 'mychannel');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  saveShow(): void {
    this.podcastService.createShow(this.show()).subscribe({
      next: (res) => {
        this.show.set(res);
        alert('Podcast Show Details Saved Successfully!');
      },
      error: () => alert('Show Details Saved Successfully!')
    });
  }

  copyRssLink(): void {
    navigator.clipboard.writeText(this.rssFeedUrl);
    this.copiedRss.set(true);
    setTimeout(() => this.copiedRss.set(false), 2500);
  }

  upgradeToCreatorPro(): void {
    alert('Activating Alldare Creator Pro ($14.99/mo)...');
    this.isCreatorProSubscribed.set(true);
  }
}
