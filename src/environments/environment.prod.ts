export const environment = {
  production: true,
  podcastUrl: (typeof window !== 'undefined' && (window as any).__env?.PODCAST_URL) || 'https://podcasts.alldare.online'
};
