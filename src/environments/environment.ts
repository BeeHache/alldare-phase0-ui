export const environment = {
  production: false,
  podcastUrl: (typeof window !== 'undefined' && (window as any).__env?.PODCAST_URL) || 'https://podcasts.alldare.online'
};
