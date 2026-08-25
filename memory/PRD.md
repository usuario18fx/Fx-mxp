# FX-MXP — PRD

## Problem statement
Upgrade the FX-MXP experience to feel like a coherent premium product:
1) Full-screen premium Photo Modal on the existing `#lightbox` (no duplicate modal).
2) Cross-cutting design-system refinement pass over buttons, panels, modals, controls and micro-interactions — without breaking existing functionality, routes, data, gallery, auth, API calls or backend logic.

## Architecture
- Static single-page HTML at `/app/public/index.html` (deployed via Vercel; `outputDirectory: public`).
- Design system layered as an overlay CSS block at the end of `<style>` (tokens + refinement rules using existing class selectors). No HTML/JS restructuring; only additive CSS.

## Implemented (Jan 2026)

### Photo Modal (upgraded #lightbox)
- Full-viewport dark/glass overlay, `object-fit: contain`, aspect ratio preserved.
- Desktop 92vw × 88vh · Mobile 96vw × 82vh.
- Circular close btn top-right, pill counter `NN / NN` top-center, circular prev/next side buttons.
- Click photo→open, click outside, ESC, ←/→ arrows, mobile swipe L/R.
- `body.lb-locked` background scroll lock (restored on close).
- Smooth open (scale 0.96→1 + fade ~240ms) + subtle switch fade.
- Loading spinner + minimal error state.
- Accessibility: role dialog, aria-modal, aria-labels, focus move + restore, focus ring.
- Single-image mode auto-hides nav + counter.
- Self-bootstrapping `initLightbox` runs independently of main app bootstrap.
- Opening-click guard (300ms) so the click that opens can't close the modal by bubbling.
- 3 trigger sites wired to `openLightbox(images, index)`:
  1. `renderMediaGrid` (`.mthumb`)
  2. `renderDmImages` (`.dm-image-item`)
  3. `renderSaveMedia` (`.mitem`)

### Design system refinement layer
Tokens: radius (`--fx-r-sm/md/lg/pill`), button heights, spacing, ease `(.22,1,.36,1)`, durations (120/200/280ms), focus ring, surface & line colors.

Applied consistency for:
- **Buttons**: unified press feedback (scale .965), focus-visible ring, disabled/loading (`.is-loading` spinner), primary `.btn-p` at 46px h · 12px r · .14em letter-spacing.
- **Close buttons**: unified `.pclose/.drawer-close/.pick-close/.pm-close-btn/.dm-close-btn` → 36×36 pill, neutral base, neon-green hover, press scale .92.
- **Panel headers**: unified padding, uppercase title `.22em` tracking, neon-green.
- **Dividers**: `rgba(255,255,255,.07)` consistent.
- **Cards** (`bcard/rcard/conn-item/qi/pli/ni`): softer borders, no hover-jumps; `mthumb` scales gently.
- **Chips/tags**: 8px radius, `.11em` tracking, 800 weight.
- **Inputs**: 12px radius, neon-green focus (2px border + 3px halo).
- **Search box**: focus-within tightens border, deepens background.
- **Toast**: 12px r, 800 weight, 42px min-h.
- **Panel entry animation**: subtle `translateY(8px)→0` fade for `menu/notif/settings/media`.
- **Selection color**, **scrollbars** on-brand.
- **Mobile ≤640px**: taller touch targets (46-48px), 40px min for loc-act/mini-btn/pli-del, larger close buttons.
- **prefers-reduced-motion**: all transitions/animations dampened to .08ms.

## Files touched
- `/app/public/index.html`
  - CSS: new `#lightbox` premium styles (replaced old lightbox rules).
  - CSS: new design-system refinement layer at end of `<style>`.
  - HTML: replaced `#lightbox` markup with full premium viewer structure.
  - JS: added `openLightbox / closeLightbox / lbNext / lbPrev / lbGo / lbRenderCurrent / initLightbox` + self-boot IIFE.
  - JS: wired 3 gallery triggers to pass image collections.
  - JS: ESC handler now calls `closeLightbox()` (restores scroll).

## Backlog / Next
- P1 Pinch-zoom and double-tap zoom in photo modal (mobile).
- P2 Preload adjacent images for zero-flash navigation.
- P2 Optional photo caption line under the image.
- P2 One-tap download from viewer.
- P2 Consolidate `mthumb-actions` (vip/flag/hide/del) into a single overflow menu to reduce visual noise per thumbnail.
