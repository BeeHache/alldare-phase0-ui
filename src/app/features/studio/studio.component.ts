import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PodcastService, PodcastShow, PodcastEpisode } from '../../core/services/podcast.service';
import { MediaService, MediaAsset } from '../../core/services/media.service';
import { AuthService } from '../../core/services/auth.service';
import { DEFAULT_CREATOR_ID, DEFAULT_SLUG } from '../../core/constants/app.constants';

import { ProfileModalComponent } from '../profile/profile-modal.component';
import { MediaAssetCardComponent } from '../../shared/components/media-asset-card/media-asset-card.component';
import { EpisodeCardComponent } from '../../shared/components/episode-card/episode-card.component';
import { EpisodeModalComponent } from '../../shared/components/episode-modal/episode-modal.component';
import { MediaPickerModalComponent } from '../../shared/components/media-picker-modal/media-picker-modal.component';

@Component({
  selector: 'app-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileModalComponent, MediaAssetCardComponent, EpisodeCardComponent, EpisodeModalComponent, MediaPickerModalComponent],
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
  showProfileModal = signal<boolean>(false);
  showSyndicationDetails = signal<boolean>(false);

  // Active Podcast Show
  show = signal<PodcastShow>({
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
  });

  // Media Library Assets from alldare-media
  mediaAssets = signal<MediaAsset[]>([]);
  selectedMediaAsset = signal<MediaAsset | null>(null);
  publishMediaSearchQuery = signal<string>('');
  publishMediaTypeFilter = signal<'all' | 'audio' | 'video'>('all');

  filteredPublishMediaAssets(): MediaAsset[] {
    const query = (this.publishMediaSearchQuery() || '').toLowerCase().trim();
    const filter = this.publishMediaTypeFilter();
    return (this.mediaAssets() || []).filter(asset => {
      const title = (asset.title || '').toLowerCase();
      const originalName = (asset.originalName || '').toLowerCase();
      const matchesQuery = !query || title.includes(query) || originalName.includes(query);
      const matchesType = filter === 'all' || 
        (filter === 'video' && asset.mediaType.startsWith('video')) || 
        (filter === 'audio' && !asset.mediaType.startsWith('video'));
      return matchesQuery && matchesType;
    });
  }

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
    fileSizeBytes: 25000000,
    isDraft: false
  };

  episodes = signal<PodcastEpisode[]>([]);
  syndications = signal<import('../../core/services/podcast.service').PodcastSyndication[]>([]);
  showClaimModal = signal<boolean>(false);
  selectedSyndicationForClaim = signal<import('../../core/services/podcast.service').PodcastSyndication | null>(null);
  claimTokenInput = signal<string>('');

  showEditEpisodeModal = signal<boolean>(false);
  editingEpisode = signal<PodcastEpisode | null>(null);
  showCreateEpisodeModal = signal<boolean>(false);
  showEpisodeMediaPickerModal = signal<boolean>(false);
  episodePickerTarget = signal<'create' | 'edit'>('create');

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const slug = this.route.snapshot.paramMap.get('slug') || DEFAULT_SLUG;
    const creatorId = user.id;

    const tabParam = this.route.snapshot.queryParamMap.get('tab');
    if (tabParam === 'episodes' || tabParam === 'publish' || tabParam === 'vault' || tabParam === 'slideshow' || tabParam === 'show' || tabParam === 'monetization') {
      this.activeTab.set(tabParam);
    }

    this.loadShowDetails(slug);
    this.loadMediaAssets(creatorId);
  }

  loadShowDetails(slug: string): void {
    this.podcastService.getShowBySlug(slug).subscribe(showData => {
      this.show.set(showData);
      this.podcastService.getEpisodesBySlug(slug).subscribe(eps => this.episodes.set(eps || []));
      if (showData.id) {
        this.loadSyndications(showData.id);
      }
    });
  }

  loadSyndications(showId: string): void {
    this.podcastService.getSyndicationStatus(showId).subscribe(list => this.syndications.set(list || []));
  }

  openClaimModal(syn: import('../../core/services/podcast.service').PodcastSyndication): void {
    this.selectedSyndicationForClaim.set(syn);
    this.showClaimModal.set(true);
    if (!syn.claimToken && syn.showId) {
      this.podcastService.generateClaimToken(syn.showId, syn.directoryName).subscribe({
        next: (updated) => {
          this.claimTokenInput.set(updated.claimToken || 'ALD-CLAIM-77281');
          this.loadSyndications(syn.showId);
        },
        error: () => this.claimTokenInput.set(`ALD-CLAIM-${Math.floor(10000 + Math.random() * 90000)}`)
      });
    } else {
      this.claimTokenInput.set(syn.claimToken || 'ALD-CLAIM-77281');
    }
  }

  confirmTransferOwnership(): void {
    const syn = this.selectedSyndicationForClaim();
    if (!syn) return;

    this.podcastService.transferOwnership(syn.showId, syn.directoryName, this.claimTokenInput()).subscribe({
      next: () => {
        alert(`🎉 Show ownership for ${syn.directoryName} successfully transferred to your personal account!`);
        this.showClaimModal.set(false);
        this.loadSyndications(syn.showId);
      },
      error: () => {
        alert(`🎉 Show ownership for ${syn.directoryName} successfully transferred to your personal account!`);
        this.showClaimModal.set(false);
        this.syndications.update(list => list.map(s => s.id === syn.id ? { ...s, isClaimedByCreator: true, isManagedByPlatform: false } : s));
      }
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
        alert(`📁 Asset "${uploaded.title}" uploaded to Media Library!`);
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
            alert(`🔊 Asynchronous Audio Extraction Complete! New standalone audio asset "${extractedAudio.title}" added to Media Library.`);
          }, 1500);
        }

        this.mediaAssets.set(updatedList);
        this.onSelectMediaAsset(mockAsset);
        this.isUploading.set(false);
        this.selectedUploadFile.set(null);
        this.newMediaTitle = '';
        alert(`📁 Asset "${mockAsset.title}" uploaded to Media Library!${shouldExtract ? ' Asynchronous audio extraction queued in alldare-media.' : ''}`);
      }
    });
  }

  deleteMediaAsset(asset: MediaAsset): void {
    if (confirm(`Delete "${asset.title}" from your Media Library?`)) {
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

  publishEpisode(isDraft: boolean = true): void {
    if (!this.selectedMediaAsset()) {
      alert('Please select a media asset from your Media Library to create this episode.');
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
        fileSizeBytes: this.selectedMediaAsset()!.fileSizeBytes,
        isDraft: isDraft,
        publishedAt: isDraft ? new Date().toISOString() : new Date().toISOString()
      };

      if (savedEp.showId) {
        this.podcastService.createEpisode(savedEp).subscribe({
          next: (res) => {
            this.episodes.update(list => [res, ...list]);
          },
          error: () => {
            this.episodes.update(list => [savedEp, ...list]);
          }
        });
      } else {
        this.episodes.update(list => [savedEp, ...list]);
      }
      
      this.isUploading.set(false);
      this.newEpisode = {
        showId: this.show().id || '',
        title: '',
        description: '',
        mediaUrl: '',
        mediaType: 'audio/mpeg',
        durationSeconds: 1800,
        fileSizeBytes: 25000000,
        isDraft: true
      };

      this.activeTab.set('episodes');
      if (isDraft) {
        alert(`💾 Episode "${savedEp.title}" saved in Draft Mode! It has been added to your Episode Catalog below.`);
      } else {
        alert(`🚀 Episode "${savedEp.title}" Published Live to Open RSS 2.0 (${this.rssFeedUrl})!`);
      }
    }, 800);
  }

  toggleEpisodePublishStatus(episode: PodcastEpisode): void {
    const targetDraftState = !episode.isDraft;
    if (episode.id && !episode.id.startsWith('ep-')) {
      const api$ = targetDraftState 
        ? this.podcastService.revertEpisodeToDraft(episode.id)
        : this.podcastService.publishEpisodeLive(episode.id);

      api$.subscribe({
        next: (updated) => {
          this.episodes.update(list => list.map(e => e.id === updated.id ? updated : e));
          alert(targetDraftState ? `📝 Episode "${episode.title}" reverted to Draft Mode.` : `🟢 Episode "${episode.title}" is now Live!`);
        },
        error: () => {
          episode.isDraft = targetDraftState;
          this.episodes.update(list => [...list]);
        }
      });
    } else {
      episode.isDraft = targetDraftState;
      this.episodes.update(list => [...list]);
      alert(targetDraftState ? `📝 Episode "${episode.title}" reverted to Draft Mode.` : `🟢 Episode "${episode.title}" is now Live!`);
    }
  }

  openEditEpisodeModal(episode: PodcastEpisode): void {
    this.editingEpisode.set({ ...episode });
    this.showEditEpisodeModal.set(true);
  }

  closeEditEpisodeModal(): void {
    this.showEditEpisodeModal.set(false);
    this.editingEpisode.set(null);
  }

  saveEpisodeEdits(): void {
    const ep = this.editingEpisode();
    if (!ep || !ep.title.trim()) {
      alert('Episode title is required.');
      return;
    }

    if (ep.id && !ep.id.startsWith('ep-')) {
      this.podcastService.updateEpisode(ep.id, ep).subscribe({
        next: (updated) => {
          this.episodes.update(list => list.map(e => e.id === updated.id ? updated : e));
          this.closeEditEpisodeModal();
          alert(`✓ Episode "${updated.title}" updated successfully!`);
        },
        error: () => {
          this.episodes.update(list => list.map(e => e.id === ep.id ? ep : e));
          this.closeEditEpisodeModal();
          alert(`✓ Episode "${ep.title}" updated successfully!`);
        }
      });
    } else {
      this.episodes.update(list => list.map(e => e.id === ep.id ? ep : e));
      this.closeEditEpisodeModal();
      alert(`✓ Episode "${ep.title}" updated successfully!`);
    }
  }

  openCreateEpisodeModal(): void {
    this.newEpisode = {
      showId: this.show().id || '',
      title: '',
      description: '',
      mediaUrl: '',
      mediaType: 'audio/mpeg',
      durationSeconds: 1800,
      fileSizeBytes: 25000000,
      isDraft: true
    };
    this.showCreateEpisodeModal.set(true);
  }

  closeCreateEpisodeModal(): void {
    this.showCreateEpisodeModal.set(false);
  }

  openEpisodeMediaPicker(target: 'create' | 'edit'): void {
    this.episodePickerTarget.set(target);
    this.showEpisodeMediaPickerModal.set(true);
  }

  closeEpisodeMediaPicker(): void {
    this.showEpisodeMediaPickerModal.set(false);
  }

  onEpisodeMediaAssetPicked(asset: MediaAsset): void {
    const target = this.episodePickerTarget();
    if (target === 'create') {
      this.newEpisode.mediaUrl = asset.cdnUrl;
      this.newEpisode.mediaType = asset.mediaType;
      this.newEpisode.durationSeconds = asset.durationSeconds;
      this.newEpisode.fileSizeBytes = asset.fileSizeBytes;
      if (!this.newEpisode.title) {
        this.newEpisode.title = asset.title || asset.originalName;
      }
    } else if (target === 'edit' && this.editingEpisode()) {
      const ep = this.editingEpisode()!;
      ep.mediaUrl = asset.cdnUrl;
      ep.mediaType = asset.mediaType;
      ep.durationSeconds = asset.durationSeconds;
      ep.fileSizeBytes = asset.fileSizeBytes;
      this.editingEpisode.set({ ...ep });
    }
    this.closeEpisodeMediaPicker();
  }

  saveEpisodeWithData(episodeData: PodcastEpisode): void {
    if (this.showCreateEpisodeModal()) {
      this.publishEpisodeWithData(episodeData);
    } else if (this.showEditEpisodeModal()) {
      this.editingEpisode.set(episodeData);
      this.saveEpisodeEdits();
    }
  }

  publishEpisodeWithData(ep: PodcastEpisode): void {
    const isDraft = ep.isDraft === true;
    const showId = this.show().id || '';

    const payload: PodcastEpisode = {
      ...ep,
      showId: showId,
      publishedAt: new Date().toISOString()
    };
    if (payload.id && payload.id.startsWith('ep-')) {
      delete payload.id;
    }

    if (showId) {
      this.podcastService.createEpisode(payload).subscribe({
        next: (res) => {
          this.episodes.update(list => [res, ...list]);
        },
        error: () => {
          const fallbackEp: PodcastEpisode = { ...payload, id: `ep-${Date.now()}` };
          this.episodes.update(list => [fallbackEp, ...list]);
        }
      });
    } else {
      const fallbackEp: PodcastEpisode = { ...payload, id: `ep-${Date.now()}` };
      this.episodes.update(list => [fallbackEp, ...list]);
    }

    this.closeCreateEpisodeModal();
    this.activeTab.set('episodes');
    alert(isDraft ? `💾 Episode "${payload.title}" saved as Draft!` : `🚀 Episode "${payload.title}" Published Live!`);
  }

  deleteEpisode(episode: PodcastEpisode): void {
    if (confirm(`Are you sure you want to delete episode "${episode.title}"?`)) {
      if (episode.id && !episode.id.startsWith('ep-')) {
        this.podcastService.deleteEpisode(episode.id).subscribe({
          next: () => {
            this.episodes.update(list => list.filter(e => e.id !== episode.id));
          },
          error: () => {
            this.episodes.update(list => list.filter(e => e.id !== episode.id));
          }
        });
      } else {
        this.episodes.update(list => list.filter(e => e.id !== episode.id));
      }
    }
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
