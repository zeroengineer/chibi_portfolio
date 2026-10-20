# Devang C V — Portfolio

A scroll-driven portfolio: scroll (or swipe) and a chibi version of me walks through my story, growing up as they go. They start out as a student, pick up an IEEE lanyard, put on the IEEE LINK shirt, and end as a professional. Scrolling back rewinds them.

Built with **Astro** (static HTML for every chapter), one **React** island for the scroll engine, **Tailwind CSS v4** and **Lenis** smooth scrolling.

## Getting started

Requires Node `>=22.22` (see `.nvmrc`).

```sh
nvm use
npm install
npm run dev        # http://localhost:4321
```

## Scripts

| Script             | What it does                                                     |
| ------------------ | ---------------------------------------------------------------- |
| `npm run dev`      | Start the dev server                                             |
| `npm run build`    | Build the static site into `dist/`                               |
| `npm run preview`  | Serve the built site                                             |
| `npm run check`    | Type-check `.astro`/`.ts`/`.tsx` files                           |
| `npm run lint`     | ESLint                                                           |
| `npm run format`   | Prettier (write); `format:check` to verify                       |
| `npm test`         | Unit tests (Vitest)                                              |
| `npm run test:e2e` | End-to-end tests (Playwright: desktop, phone, phone landscape)   |
| `npm run frames`   | Regenerate `public/frames/*.webp` from `raw-assets/frames/*.png` |

First time running e2e tests: `npx playwright install chromium`.

## Project structure

```
raw-assets/frames/        Original 1280×720 PNG frames (source of truth, never deployed)
scripts/optimize-frames.mjs  PNG → cropped 411×640 WebP (~3 MB total instead of 20 MB)
public/frames/            Generated WebP frames served to the browser
src/
  pages/index.astro       Composes the chapters inside the <Journey> island
  layouts/BaseLayout.astro  <head>, SEO, fonts, global styles
  styles/global.css       Tailwind theme tokens, comic utilities, stage geometry
  data/                   All copy: profile, chapters (order + phase), leadership, …
  components/
    sections/             One static .astro file per chapter
    ui/                   Section, ComicCard, ChapterTag, Heading, Prose, Pill
    journey/              The React island: scroll engine, walker canvas, header, progress
  lib/                    Framework-free logic (unit tested)
    phases.ts             Which frames belong to which age phase
    timeline.ts           Scroll progress → frame mapping
    scrollMath.ts         Pinning / progress / chapter maths
    frameLoader.ts        Loads frames nearest-first
tests/
  unit/                   Vitest
  e2e/                    Playwright
```

## How the walk works

1. **Pinned horizontal world.** The page scrolls vertically as normal. A tall spacer keeps a `position: sticky` stage pinned, and the chapters' track slides left by exactly the distance scrolled. Trackpads, mouse wheels, touch swipes, keyboard and deep links (`/#experience`) all work, and without JavaScript the stage falls back to a plain horizontal scroller.
2. **Phases.** The 99 frames are one continuous take of the character walking _and_ aging. `src/lib/phases.ts` lists the stable frame range of each look (`student` 0–13, `member` 19–31, `leader` 35–49, `professional` 53–98). The frames in between are the outfit morphs.
3. **Timeline.** Every element with `data-phase` (chapters, plus the individual IEEE organisations) is an anchor. While an anchor scrolls through, the walker plays that phase's frames. As a chapter with a new look slides in, the morph frames play, and the walker has fully changed by the time the chapter settles into view (its left edge at the viewport's left edge). So landing on a chapter, from the nav or a deep link, always shows its look. Progress `0` is always frame `0`, and the last scroll position is always the last frame.
4. **Rewind.** The frame is a pure function of scroll position, so scrolling back plays the exact same frames in reverse.

To move a chapter to a different age, change its `phase` in `src/data/chapters.ts` (or `src/data/leadership.ts`). To retune where a look starts and ends, edit `src/lib/phases.ts`.

## Editing content

All text lives in `src/data/`. The chapter order (which is also the story order) is defined in `src/data/chapters.ts`, and the page in `src/pages/index.astro` renders the chapters in that order.

## Deploying

`npm run build` produces a fully static `dist/` that can be hosted anywhere (Vercel, Netlify, Cloudflare Pages, GitHub Pages). Set `SITE_URL` (for example `https://devangcv.com`) at build time to emit canonical and Open Graph URLs.
