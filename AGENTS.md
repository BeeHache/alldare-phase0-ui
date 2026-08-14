# Guidelines for AI Agents (AGENTS.md) — alldare-phase0-ui

> [!IMPORTANT]
> This repository contains the Phase 0 Creator Content Publisher UI for the Alldare Platform. Do not execute major UI refactors or routing updates without proposing a step-by-step plan and receiving user alignment first.

## 1. Project Purpose & Architecture
`alldare-phase0-ui` is the dedicated web application for Phase 0 pre-launch content seeding and podcast syndication.
- **Frontend Framework:** Angular v21+ Single Page Application (SPA).
- **Core URL Specification:**
  - RSS 2.0 Feed: `/podcast/{slug}/rss.xml`
  - Show Web Landing Page: `/podcast/{slug}/index.html`
- **Routing:** Public requests route through `alldare-gateway` (ports 80/443).

---

## 2. Core Execution Commands
- Install Dependencies: `npm install`
- Run Dev Server: `npm run start` (Runs on port 4200)
- Build Production Assets: `npm run build`
- Build Container: `docker build -t alldare-phase0-ui .`

---

## 3. Web UI & Responsive Layout Standards
- **Mandatory Responsive Layout Design:** All user interfaces (`alldare-phase0-ui`) **must** be fully responsive across mobile, tablet, and desktop viewports (360px+ to ultra-wide displays) using fluid containers, responsive flex/grid layouts, and breakpoint utility classes without layout overflow or horizontal clipping.
- **Prohibition of Hardcoded Literals:** Avoid inline hardcoded string literals, raw route paths, or magic numbers across UI components, ViewModels, backend services, or repositories. User-facing strings must be localized via `strings.xml` / `Localizable.strings`, and route keys must use centralized constants (e.g. `StreamKeys`, `SecurityConstants`, or `BuildKonfig`).
