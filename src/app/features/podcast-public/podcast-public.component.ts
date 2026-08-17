import { Component, OnInit, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PodcastService, PodcastShow, PodcastEpisode } from '../../core/services/podcast.service';

@Component({
  selector: 'app-podcast-public',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './podcast-public.component.html',
  styleUrls: ['./podcast-public.component.scss']
})
export class PodcastPublicComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private podcastService = inject(PodcastService);

  @ViewChild('audioPlayer') audioPlayerRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('videoPlayer') videoPlayerRef?: ElementRef<HTMLVideoElement>;

  slug = signal<string>('mychannel');
  show = signal<PodcastShow | null>(null);
  episodes = signal<PodcastEpisode[]>([]);
  copiedRss = signal<boolean>(false);

  // Player Signals
  activeEpisode = signal<PodcastEpisode | null>(null);
  isPlaying = signal<boolean>(false);
  currentTime = signal<number>(0);
  duration = signal<number>(0);
  playbackSpeed = signal<number>(1.0);

  ngOnInit(): void {
    const slugParam = this.route.snapshot.paramMap.get('slug') || 'mychannel';
    this.slug.set(slugParam);

    this.podcastService.getShowBySlug(slugParam).subscribe(data => this.show.set(data));
    this.podcastService.getEpisodesBySlug(slugParam).subscribe(data => {
      // Reverse chronological order (Newest episode first)
      const sorted = (data || []).sort((a, b) => {
        const timeA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const timeB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return timeB - timeA;
      });
      this.episodes.set(sorted);
    });
  }

  get rssUrl(): string {
    return this.podcastService.getRssFeedUrl(this.slug());
  }

  get atomUrl(): string {
    return this.podcastService.getAtomFeedUrl(this.slug());
  }

  get webPageUrl(): string {
    return this.podcastService.getWebLandingPageUrl(this.slug());
  }

  copyRss(): void {
    navigator.clipboard.writeText(this.rssUrl);
    this.copiedRss.set(true);
    setTimeout(() => this.copiedRss.set(false), 2500);
  }

  // --- Player Methods ---
  playEpisode(ep: PodcastEpisode): void {
    if (this.activeEpisode()?.id === ep.id && this.activeEpisode()?.id) {
      this.togglePlay();
    } else {
      this.activeEpisode.set(ep);
      this.isPlaying.set(true);
      setTimeout(() => {
        const player = this.getActivePlayer();
        if (player) {
          player.playbackRate = this.playbackSpeed();
          player.play().catch(() => this.isPlaying.set(false));
        }
      }, 0);
    }
  }

  togglePlay(): void {
    const player = this.getActivePlayer();
    if (!player) return;

    if (this.isPlaying()) {
      player.pause();
      this.isPlaying.set(false);
    } else {
      player.play().then(() => this.isPlaying.set(true)).catch(() => this.isPlaying.set(false));
    }
  }

  onTimeUpdate(): void {
    const player = this.getActivePlayer();
    if (player) {
      this.currentTime.set(player.currentTime);
      this.duration.set(player.duration || 0);
    }
  }

  onLoadedMetadata(): void {
    const player = this.getActivePlayer();
    if (player) {
      this.duration.set(player.duration || 0);
      player.playbackRate = this.playbackSpeed();
    }
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this.currentTime.set(0);
  }

  seek(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = parseFloat(target.value);
    const player = this.getActivePlayer();
    if (player) {
      player.currentTime = value;
      this.currentTime.set(value);
    }
  }

  setSpeed(speed: number): void {
    this.playbackSpeed.set(speed);
    const player = this.getActivePlayer();
    if (player) {
      player.playbackRate = speed;
    }
  }

  closePlayer(): void {
    const player = this.getActivePlayer();
    if (player) {
      player.pause();
    }
    this.isPlaying.set(false);
    this.activeEpisode.set(null);
  }

  private getActivePlayer(): HTMLAudioElement | HTMLVideoElement | null {
    if (this.activeEpisode()?.mediaType?.startsWith('video')) {
      return this.videoPlayerRef?.nativeElement || null;
    }
    return this.audioPlayerRef?.nativeElement || null;
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      const formattedMins = remMins < 10 ? `0${remMins}` : `${remMins}`;
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${mins}:${formattedSecs}`;
  }
}
