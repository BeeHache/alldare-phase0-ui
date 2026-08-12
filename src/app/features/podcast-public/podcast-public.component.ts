import { Component, OnInit, inject, signal } from '@angular/core';
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

  slug = signal<string>('mychannel');
  show = signal<PodcastShow | null>(null);
  episodes = signal<PodcastEpisode[]>([]);
  copiedRss = signal<boolean>(false);

  ngOnInit(): void {
    const slugParam = this.route.snapshot.paramMap.get('slug') || 'mychannel';
    this.slug.set(slugParam);

    this.podcastService.getShowBySlug(slugParam).subscribe(data => this.show.set(data));
    this.podcastService.getEpisodesBySlug(slugParam).subscribe(data => this.episodes.set(data));
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
}
