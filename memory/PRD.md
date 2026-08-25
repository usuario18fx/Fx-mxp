# FX-MXP — PRD

## Problem statement
Iterative premium UI/UX upgrade of the existing FX-MXP experience while preserving all functionality (map, auth, encryption, gallery, save, notes, routes, API calls).

## Architecture
- Static single-page HTML at `/app/public/index.html` (Vercel `outputDirectory: public`).
- Design system layered as an overlay CSS block at the end of `<style>`; JS additions are targeted helpers, no restructuring.

## Implemented (Jan 2026)
### Photo Modal (upgraded #lightbox)
- Prev/next, `NN / NN` counter, close, ESC, click-outside, mobile swipe.
- Desktop 92vw × 88vh · Mobile 96vw × 82vh · `object-fit: contain`.
- Scroll lock, focus move+restore, focus ring, aria labels, single-image mode hides nav+counter.
- Self-bootstrapping (`initLightbox` in IIFE), 300ms open-guard to prevent self-close on bubbling click.
- 3 wired triggers: `renderMediaGrid`, `renderDmImages`, `renderSaveMedia`.

### Design system refinement layer
- Tokens (radius, heights, ease, durations, focus ring, surface/line colors).
- Unified close buttons (36×36 pill), press feedback (scale .965), primary btns 46px h/12r/.14em.
- Panel headers, dividers, cards, chips/tags, inputs, search box, tabs, toast normalized.
- Panel entry animation, brand selection, discrete scrollbars.
- Mobile ≤640px touch-target sizing + `prefers-reduced-motion` support.

### Thumbnail Overflow Menu (Jan 2026)
- 4 actions (VIP ★, Bandera ◆, Ocultar 👁, Eliminar 🗑) consolidated into a single `⋯` overflow button per thumbnail.
- Applies to media grid (`.mthumb`) and notes list (`.note-item`).
- Popover menu: 150px min-width, glass background, entry animation, keyboard/ESC/click-outside dismiss, active state indicators (VIP gold, others neon-green), danger styling for delete.
- VIP indicator dot on the card corner when active (replaces always-on button state).
- Reused existing `buildFlagPopover` / `wireFlagPopover` logic — no duplicate flag system.
- Helper: `openThumbMenu(anchor, actions, opts)` — reusable for future cards.

## Files touched
- `/app/public/index.html`
  - CSS: `#lightbox` premium block, design-system layer, `.mact-btn/.thumb-menu/.mthumb-vipdot/.note-vipdot` refinement.
  - HTML: `#lightbox` markup with viewer; `.mthumb-actions` and `.note-actions` reduced to single `⋯` button.
  - JS: `openLightbox/closeLightbox/lbNext/lbPrev/lbGo/lbRenderCurrent/initLightbox` + self-boot IIFE; `openThumbMenu`; rewired media/notes handlers to use the menu.

## Backlog / Next
- P1 Pinch-zoom and double-tap zoom in photo modal (mobile).
- P2 Preload adjacent images for zero-flash navigation.
- P2 Photo caption line under the image.
- P2 One-tap download from viewer.
- P2 Extend `openThumbMenu` to other cards (`.pli`, `.bcard`, `.ni`) once product decides which actions to consolidate there.
