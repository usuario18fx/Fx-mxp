# FX-MXP — PRD

## Problem statement
Upgrade the existing `#lightbox` inside `public/index.html` into a premium full-screen Photo Modal (single photo-viewing system) with prev/next, counter, close, keyboard nav, mobile swipe, backdrop close, background scroll lock, aspect-ratio preservation and smooth animations — without redesigning the rest of the app.

## Architecture
- Static single-page HTML at `/app/public/index.html` (deployed via Vercel; `outputDirectory: public`).
- The upgraded viewer reuses the existing `#lightbox` element (no duplicated modal).
- Trigger sites updated to pass an image collection + start index:
  1. `renderMediaGrid` (media panel grid `.mthumb`)
  2. `renderDmImages` (detail-modal `.dm-image-item`)
  3. `renderSaveMedia` (save-modal `.mitem` previews)
- Public API: `openLightbox(images, index)`, `closeLightbox()`, `lbNext()`, `lbPrev()`.

## Implemented (Jan 2026)
- Full-viewport dark/glass overlay, image object-fit contain, aspect ratio preserved.
- Desktop caps 92vw × 88vh · Mobile caps 96vw × 82vh.
- Circular close btn (top-right), pill counter `NN / NN` (top-center), circular prev/next side buttons.
- Interactions: click photo→open, click close, click outside image, ESC, ←/→ arrows, mobile swipe L/R.
- Body scroll lock via `body.lb-locked` (restored on close).
- Smooth open/close (scale 0.96→1 + fade, ~240ms) and subtle switch fade between images.
- Loading spinner + minimal error state on failed image load.
- Accessibility: `role="dialog"`, `aria-modal`, aria-labels on all controls, focus moved to close button on open, focus restored on close, visible focus rings (neon-green).
- Single-image mode hides nav automatically; counter hidden when only one image.
- Hover/focus accent uses brand neon-green `#d4ff00`, base controls are neutral white.
- `prefers-reduced-motion` respected.

## Files touched
- `/app/public/index.html` (CSS block for `#lightbox`, modal markup, 3 trigger sites, ESC handler, added `initLightbox`/`openLightbox`/`closeLightbox`/`lbGo` block).

## Backlog / Next
- P2 Pinch-zoom on mobile.
- P2 Preload adjacent images for smoother transitions.
- P2 Optional caption/name overlay under image.
