# Alldare Phase 0 Podcast Creator Studio UI (`alldare-phase0-ui`)

Dedicated **Phase 0 Podcast & Vodcast Creator Publishing Studio** web application for the Alldare Platform.

---

## 🌟 Key Features & URL Specifications

- **Podcast RSS 2.0 Syndication Feed URL:** `https://podcasts.alldare.online/podcast/{slug}/rss.xml`
- **Podcast Web Landing Page URL:** `https://alldare.online/podcast/{slug}/index.html`
- **Audio & Video Podcast Importer:** Drag-and-drop file uploader for `.mp3` and `.mp4` enclosures.
- **Automated Slideshow Vodcast Builder:** Assembles video podcasts from image galleries + audio tracks.
- **Creator Pro & Monetization Hub:** Dynamic Audio/Video Injection (DAI) ad controls and `Alldare Creator Pro` ($14.99/mo) subscription gateway.
- **Multi-Platform Cross-Posting:** Instant distribution toggles for Instagram Reels, Facebook, Threads, and TikTok.

---

## 📁 Repository Structure
- `src/app/core/services/podcast.service.ts`: Podcast API integration & feed URL generators.
- `src/app/features/studio/`: Creator Publishing Studio view.
- `src/app/features/podcast-public/`: Public Podcast Show Landing Page (`/podcast/{slug}/index.html`).
- `Dockerfile`: Multi-stage Docker build serving static SPA assets on port 4200 via Nginx.

---

## 🛠️ Local Execution

```bash
npm install
npm run start
```
Navigates to `http://localhost:4200`.
