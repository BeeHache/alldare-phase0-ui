# Architecture Specification: `alldare-phase0-ui`

This document defines the Angular Single Page Application (SPA) architecture, component layout, and runtime environment variable injection for **`alldare-phase0-ui`**.

---

## 1. Domain & UI Responsibilities

`alldare-phase0-ui` is the Phase 0 Creator Content Publisher UI for the Alldare Platform.

* **Angular Framework**: Built with Angular v21+ SPA.
* **Podcast Studio & Syndication Suite**: Manages podcast show channels, RSS 2.0 / Atom 1.0 feed indexing status, audio episode publishing, and social media cross-posting.
* **Runtime Container Environment Injection**: Loads `<script src="assets/env.js"></script>` in `<head>` to read container `PODCAST_URL` dynamically in the browser window without re-compiling Angular.

---

## 2. Component Routing Structure

```text
app-root
├── /login ──────────────► LoginComponent (Auth token storage)
├── /podcasts ───────────► PodcastListComponent (Show list & Create Show Modal)
├── /studio/{slug} ──────► StudioComponent (Episode publishing & RSS settings)
└── /podcast/{slug} ─────► PodcastPublicComponent (Public web landing page & RSS link copier)
```
