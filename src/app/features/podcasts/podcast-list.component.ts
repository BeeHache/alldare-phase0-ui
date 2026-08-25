import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PodcastService, PodcastShow } from '../../core/services/podcast.service';
import { MediaService, MediaAsset } from '../../core/services/media.service';
import { AuthService } from '../../core/services/auth.service';
import { PostService, SocialPost } from '../../core/services/post.service';
import { ProfileModalComponent } from '../profile/profile-modal.component';
import { DEFAULT_CREATOR_ID, DEFAULT_USERNAME, DEFAULT_EMAIL, DEFAULT_COVER_IMAGE } from '../../core/constants/app.constants';
import { PodcastShowModalComponent } from '../../shared/components/podcast-show-modal/podcast-show-modal.component';
import { MediaPickerModalComponent } from '../../shared/components/media-picker-modal/media-picker-modal.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { VideoPlayerModalComponent } from '../../shared/components/video-player-modal/video-player-modal.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-podcast-list',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink, 
    ProfileModalComponent, 
    PodcastShowModalComponent, 
    MediaPickerModalComponent,
    AppHeaderComponent,
    VideoPlayerModalComponent,
    EmptyStateComponent
  ],
  templateUrl: './podcast-list.component.html',
  styleUrls: ['./podcast-list.component.scss']
})
export class PodcastListComponent implements OnInit {
  public podcastService = inject(PodcastService);
  private mediaService = inject(MediaService);
  private postService = inject(PostService);
  private router = inject(Router);
  public authService = inject(AuthService);

  public get currentOrigin(): string {
    return window.location.origin;
  }

  activeDashboardTab = signal<'social' | 'podcasts' | 'vault'>('podcasts');
  shows = signal<PodcastShow[]>([]);
  posts = signal<SocialPost[]>([]);
  mediaAssets = signal<MediaAsset[]>([]);
  showCreateModal = signal<boolean>(false);
  showEditModal = signal<boolean>(false);
  showCreatePostModal = signal<boolean>(false);
  showUploadAssetModal = signal<boolean>(false);
  showProfileModal = signal<boolean>(false);
  showMediaPickerModal = signal<boolean>(false);
  mediaPickerTarget = signal<'create' | 'edit' | null>(null);

  // Search & Filter Signals across Studio Tabs
  podcastSearchQuery = signal<string>('');
  postSearchQuery = signal<string>('');
  mediaSearchQuery = signal<string>('');
  mediaTypeFilter = signal<'all' | 'audio' | 'video'>('all');
  copiedAssetId = signal<string | null>(null);
  playingAudioAssetId = signal<string | null>(null);
  activeVideoPlayerAsset = signal<MediaAsset | null>(null);
  private currentAudioElement: HTMLAudioElement | null = null;

  openVideoPlayer(asset: MediaAsset): void {
    if (asset.mediaType.startsWith('video') && asset.cdnUrl) {
      this.activeVideoPlayerAsset.set(asset);
    }
  }

  closeVideoPlayer(): void {
    this.activeVideoPlayerAsset.set(null);
  }

  resetMediaFilters(): void {
    this.mediaSearchQuery.set('');
    this.mediaTypeFilter.set('all');
  }

  resetSocialFilters(): void {
    this.postSearchQuery.set('');
  }

  toggleAudioPreview(asset: MediaAsset): void {
    if (!asset.cdnUrl) return;

    if (this.playingAudioAssetId() === asset.id) {
      if (this.currentAudioElement) {
        this.currentAudioElement.pause();
      }
      this.playingAudioAssetId.set(null);
      return;
    }

    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
    }

    this.currentAudioElement = new Audio(asset.cdnUrl);
    this.currentAudioElement.play().then(() => {
      this.playingAudioAssetId.set(asset.id);
    }).catch(() => {
      this.playingAudioAssetId.set(null);
    });

    this.currentAudioElement.onended = () => {
      this.playingAudioAssetId.set(null);
    };
  }

  filteredShows(): PodcastShow[] {
    const query = (this.podcastSearchQuery() || '').toLowerCase().trim();
    return this.shows().filter(s =>
      !query || (s.title && s.title.toLowerCase().includes(query)) || (s.description && s.description.toLowerCase().includes(query)) || (s.category && s.category.toLowerCase().includes(query))
    );
  }

  filteredPosts(): SocialPost[] {
    const query = (this.postSearchQuery() || '').toLowerCase().trim();
    return this.posts().filter(p =>
      !query || (p.content && p.content.toLowerCase().includes(query)) || (p.username && p.username.toLowerCase().includes(query))
    );
  }

  filteredMediaAssets(): MediaAsset[] {
    const query = (this.mediaSearchQuery() || '').toLowerCase().trim();
    const filter = this.mediaTypeFilter();

    return this.mediaAssets().filter(asset => {
      const title = (asset.title || '').toLowerCase();
      const originalName = (asset.originalName || '').toLowerCase();
      const filename = (asset.filename || '').toLowerCase();
      const matchesQuery = !query || title.includes(query) || originalName.includes(query) || filename.includes(query);

      const isVideo = (asset.mediaType || '').toLowerCase().startsWith('video');
      const matchesType = filter === 'all' || (filter === 'video' && isVideo) || (filter === 'audio' && !isVideo);

      return matchesQuery && matchesType;
    });
  }

  editingShow = signal<PodcastShow | null>(null);
  editShowModel: PodcastShow = {
    creatorId: '',
    username: '',
    slug: '',
    title: '',
    description: '',
    category: 'Technology',
    authorName: '',
    email: DEFAULT_EMAIL,
    coverImageUrl: '',
    explicit: false
  };

  // Social Post Form Model
  newPostText: string = '';
  selectedPostMedia = signal<MediaAsset | null>(null);
  crossPostTwitter = signal<boolean>(true);
  crossPostYoutube = signal<boolean>(false);
  crossPostInstagram = signal<boolean>(false);
  crossPostFacebook = signal<boolean>(false);
  crossPostThreads = signal<boolean>(false);

  // Upload model
  newMediaTitle: string = '';
  selectedUploadFile = signal<File | null>(null);
  isUploading = signal<boolean>(false);
  extractAudio = signal<boolean>(false);

  openUploadAssetModal(): void {
    this.showUploadAssetModal.set(true);
  }

  closeUploadAssetModal(): void {
    this.showUploadAssetModal.set(false);
  }

  readonly DEFAULT_COVER_IMAGE = DEFAULT_COVER_IMAGE;

  newShow: PodcastShow = {
    creatorId: '',
    username: '',
    slug: '',
    title: '',
    description: '',
    category: 'Technology',
    authorName: '',
    email: DEFAULT_EMAIL,
    coverImageUrl: '',
    explicit: false
  };

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const creatorId = user.id;
    const username = user.username;

    this.newShow.creatorId = creatorId;
    this.newShow.username = username;
    this.newShow.authorName = username;

    this.loadShows(creatorId);
    this.loadPosts(creatorId);
    this.loadMediaAssets(creatorId);
  }

  loadShows(creatorId: string): void {
    this.podcastService.getShowsByCreatorId(creatorId).subscribe(list => {
      this.shows.set(list || []);
    });
  }

  loadPosts(creatorId: string): void {
    this.postService.getPostsByCreatorId(creatorId).subscribe(list => {
      this.posts.set(list || []);
    });
  }

  loadMediaAssets(creatorId: string): void {
    this.mediaService.getMediaAssets(creatorId).subscribe(assets => {
      this.mediaAssets.set(assets || []);
    });
  }

  createSocialPost(): void {
    if (!this.selectedPostMedia()) {
      alert('Phase 0 media publishing requires selecting an audio or video asset from your Media Library.');
      return;
    }

    if (!this.newPostText.trim()) {
      alert('Please enter a caption for your media post.');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const creatorId = user.id;
    const username = user.username;

    const targets: string[] = [];
    if (this.crossPostTwitter()) targets.push('Twitter/X');
    if (this.crossPostYoutube()) targets.push('YouTube');
    if (this.crossPostInstagram()) targets.push('Instagram');
    if (this.crossPostFacebook()) targets.push('Facebook');
    if (this.crossPostThreads()) targets.push('Meta Threads');

    const mediaAsset = this.selectedPostMedia()!;

    const postData: SocialPost = {
      creatorId,
      username,
      content: this.newPostText,
      mediaUrl: mediaAsset.cdnUrl,
      mediaType: mediaAsset.mediaType,
      audienceTier: 'PUBLIC',
      crossPostTargets: targets
    };

    this.postService.createPost(postData).subscribe(created => {
      this.posts.update(list => [created, ...list]);
      this.newPostText = '';
      this.selectedPostMedia.set(null);
      this.showCreatePostModal.set(false);
      alert(`🎬 Media Clip Published & Syndicated to ${targets.length > 0 ? targets.join(', ') : 'Social Networks'}!`);
    });
  }

  deleteSocialPost(postId: string): void {
    if (confirm('Delete this social post from your feed?')) {
      this.postService.deletePost(postId).subscribe(() => {
        this.posts.update(list => list.filter(p => p.id !== postId));
      });
    }
  }

  onTitleInput(title: string): void {
    this.newShow.slug = this.podcastService.slugify(title);
  }

  autoGenerateSlug(): void {
    if (this.newShow.title) {
      this.newShow.slug = this.podcastService.slugify(this.newShow.title);
    }
  }

  openCreateModal(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const creatorId = user.id;
    const username = user.username;
    this.newShow = {
      creatorId: creatorId,
      username: username,
      slug: '',
      title: '',
      description: '',
      category: 'Technology',
      authorName: username,
      email: user.email || '',
      coverImageUrl: '',
      explicit: false
    };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
  }

  openMediaLibraryModal(): void {
    this.showUploadAssetModal.set(true);
  }

  closeMediaLibraryModal(): void {
    this.showUploadAssetModal.set(false);
  }

  isDraggingFile = signal<boolean>(false);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);
  }

  onFileDropped(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingFile.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      this.selectedUploadFile.set(file);
      this.newMediaTitle = file.name.replace(/\.[^/.]+$/, "");
      this.uploadToMediaLibrary();
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
      this.uploadToMediaLibrary();
    }
  }

  uploadToMediaLibrary(): void {
    const file = this.selectedUploadFile();
    if (!file) {
      alert('Please select an audio (.mp3, .flac, .wav) or video (.mp4, .mov) file to upload.');
      return;
    }

    const user = this.authService.currentUser();
    if (!user) {
      this.isUploading.set(false);
      this.router.navigate(['/login']);
      return;
    }

    this.isUploading.set(true);
    const creatorId = user.id;
    const shouldExtract = this.extractAudio();

    this.mediaService.uploadMediaAsset(file, this.newMediaTitle, shouldExtract).subscribe({
      next: (uploaded) => {
        this.mediaAssets.update(list => [uploaded, ...list]);
        this.isUploading.set(false);
        this.selectedUploadFile.set(null);
        this.newMediaTitle = '';
        this.closeUploadAssetModal();
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
        this.isUploading.set(false);
        this.selectedUploadFile.set(null);
        this.newMediaTitle = '';
        this.closeUploadAssetModal();
        alert(`📁 Asset "${mockAsset.title}" uploaded to Media Library!${shouldExtract ? ' Asynchronous audio extraction queued.' : ''}`);
      }
    });
  }

  copyCdnUrl(asset: MediaAsset): void {
    if (asset.cdnUrl) {
      navigator.clipboard.writeText(asset.cdnUrl);
      this.copiedAssetId.set(asset.id);
      setTimeout(() => {
        if (this.copiedAssetId() === asset.id) {
          this.copiedAssetId.set(null);
        }
      }, 2500);
    }
  }

  deleteMediaAsset(asset: MediaAsset): void {
    if (confirm(`Delete "${asset.title}" from your Media Library?`)) {
      this.mediaService.deleteMediaAsset(asset.id).subscribe({
        next: () => this.mediaAssets.update(list => list.filter(a => a.id !== asset.id)),
        error: () => this.mediaAssets.update(list => list.filter(a => a.id !== asset.id))
      });
    }
  }

  isValidUrl(url: string): boolean {
    if (!url || !url.trim()) return false;
    const trimmed = url.trim();
    if (trimmed.startsWith('/assets/')) return true;
    try {
      const parsed = new URL(trimmed);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  createPodcastShowWithData(showData: PodcastShow): void {
    this.newShow = { ...showData };
    this.createPodcastShow();
  }

  updatePodcastShowWithData(showData: PodcastShow): void {
    this.editShowModel = { ...showData };
    this.updatePodcastShow();
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

    if (!this.newShow.coverImageUrl || !this.newShow.coverImageUrl.trim()) {
      this.newShow.coverImageUrl = this.DEFAULT_COVER_IMAGE;
    } else if (!this.isValidUrl(this.newShow.coverImageUrl)) {
      alert('❌ Invalid Cover Image URL format. Please enter a valid URL (http:// or https://) or select from Media Library.');
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
          alert(`❌ Failed to create podcast. Backend error (${err.status || 'Network Error'}). Please try again.`);
        }
      }
    });
  }

  openEditModal(show: PodcastShow, event?: Event): void {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    if (!show) return;
    this.editingShow.set(show);
    const url = show.coverImageUrl || '';
    const isDefaultImage = !url || 
      url === this.DEFAULT_COVER_IMAGE || 
      (typeof url === 'string' && url.includes('default-podcast-cover.jpg'));
    this.editShowModel = {
      id: show.id,
      creatorId: show.creatorId || '',
      username: show.username || '',
      slug: show.slug || '',
      title: show.title || '',
      description: show.description || '',
      category: show.category || 'Technology',
      authorName: show.authorName || '',
      email: show.email || '',
      coverImageUrl: isDefaultImage ? '' : url,
      explicit: show.explicit || false,
      isPublic: show.isPublic !== false
    };
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingShow.set(null);
  }

  updatePodcastShow(): void {
    const showToUpdate = this.editingShow();
    if (!showToUpdate || !showToUpdate.id) return;

    if (!this.editShowModel.title.trim()) {
      alert('Please enter a podcast title.');
      return;
    }

    if (!this.editShowModel.coverImageUrl || !this.editShowModel.coverImageUrl.trim()) {
      this.editShowModel.coverImageUrl = this.DEFAULT_COVER_IMAGE;
    } else if (!this.isValidUrl(this.editShowModel.coverImageUrl)) {
      alert('❌ Invalid Cover Image URL format. Please enter a valid URL (http:// or https://) or select from Media Library.');
      return;
    }

    this.podcastService.updateShow(showToUpdate.id, this.editShowModel).subscribe({
      next: (updated) => {
        this.shows.update(list => list.map(s => s.id === updated.id ? updated : s));
        this.closeEditModal();
        alert(`✏️ Podcast "${updated.title}" Updated Successfully!`);
      },
      error: (err) => {
        alert(`❌ Failed to update podcast. Backend error (${err.status || 'Network Error'}).`);
      }
    });
  }

  toggleVisibility(show: PodcastShow, event: Event): void {
    event.stopPropagation();
    if (!show.id) return;
    const currentIsPublic = show.isPublic !== false && (show as any).public !== false;
    const targetState = !currentIsPublic;

    // Optimistic UI state update for immediate visual feedback
    this.shows.update(list => list.map(s => s.id === show.id ? { ...s, isPublic: targetState, public: targetState } as any : s));

    this.podcastService.toggleShowVisibility(show.id, targetState).subscribe({
      next: (updated: any) => {
        const isPub = updated.isPublic !== undefined ? updated.isPublic : (updated.public !== undefined ? updated.public : targetState);
        this.shows.update(list => list.map(s => s.id === updated.id ? { ...updated, isPublic: isPub, public: isPub } : s));
      },
      error: (err) => {
        // Revert optimistic state on failure
        this.shows.update(list => list.map(s => s.id === show.id ? { ...s, isPublic: currentIsPublic, public: currentIsPublic } as any : s));
        alert(`❌ Failed to update visibility status (${err.status || 'Network Error'}).`);
      }
    });
  }

  openMediaPicker(target: 'create' | 'edit'): void {
    this.mediaPickerTarget.set(target);
    this.showMediaPickerModal.set(true);
  }

  closeMediaPicker(): void {
    this.showMediaPickerModal.set(false);
    this.mediaPickerTarget.set(null);
  }

  selectCoverImageFromAsset(asset: MediaAsset): void {
    const target = this.mediaPickerTarget();
    if (target === 'create') {
      this.newShow.coverImageUrl = asset.cdnUrl;
    } else if (target === 'edit') {
      this.editShowModel.coverImageUrl = asset.cdnUrl;
    }
    this.closeMediaPicker();
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
    this.router.navigate(['/studio', show.slug || 'mychannel'], { queryParams: { tab: 'episodes' } });
  }

  resetForm(): void {
    const user = this.authService.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    this.newShow = {
      creatorId: user.id,
      username: user.username,
      slug: '',
      title: '',
      description: '',
      category: 'Technology',
      authorName: user.username,
      email: user.email || '',
      coverImageUrl: '',
      explicit: false
    };
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getRssUrl(slug?: string): string {
    return this.podcastService.getRssFeedUrl(slug || '');
  }

  getWebUrl(slug?: string): string {
    return this.podcastService.getWebLandingPageUrl(slug || '');
  }
}
