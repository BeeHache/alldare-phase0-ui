# UI & Design System Specification: `alldare-phase0-ui`

This document defines the responsive layout rules, design tokens, visual aesthetics, and component guidelines for **`alldare-phase0-ui`**.

---

## 1. Design Aesthetics & Visual Tokens

* **Theme**: Deep space dark mode (`bg-slate-950`, `text-slate-100`).
* **Accent Colors**: Royal Purple (`from-purple-600 to-pink-600`, `text-purple-400`).
* **Typography**: Google Font `Inter` (`font-sans antialiased`).
* **Forbidden Tropes Enforcement**: No colored border glow accents, no dashboard overuse, no non-functional decorative fluff.

---

## 2. Component Guidelines

* **Fluid Containers**: All pages (`/podcasts`, `/studio/{slug}`) utilize fluid flex/grid layouts with responsive breakpoints (`sm:`, `md:`, `lg:`, `xl:`).
* **Modal Dialogs**: Backdrop overlays (`bg-slate-950/80 backdrop-blur-sm`) with responsive card bounds.
* **RSS Feed URL Badges**: Monospace code blocks (`font-mono text-purple-300`) with dynamic environment URL generation (`{{ getRssUrl(slug) }}`).
