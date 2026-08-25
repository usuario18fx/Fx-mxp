# FX Map — Product brief

## Purpose
FX Map is a private, offline-first map for recording meaningful or frequently visited places with context and evidence. A place can contain notes, hashtags, images, video, audio, documents, a frequency level, one of five colors, and one of two clear classifications: **Guardado** or **Etiqueta**.

## Architecture
- Static single-page application in `public/index.html` (Vercel `outputDirectory: public`).
- Mapbox GL map, local-first persistence, optional Supabase account sync, optional full-state AES encryption.
- No build step. `scripts/validate-map.mjs` checks JavaScript syntax, duplicate IDs, missing DOM references, duplicate functions, and inline handlers.

## Atlas redesign (August 2026)

### Navigation and visual system
- Replaced the mixed cyberpunk/HUD language with the cohesive **Atlas** system: quiet dark surfaces, mint primary accent, consistent spacing/radii, readable typography, and accessible focus states.
- Added a persistent five-destination dock: **Mapa, Lugares, Rutas, UserFx, Emergencia**.
- Reworked search, utility controls, drawers, menus, sheets, cards, empty states, buttons, forms, notifications, and all primary modals.
- Desktop uses side panels; mobile uses touch-friendly bottom sheets.

### Places and discovery
- Place composer supports title, note, multiple normalized `#hashtags`, optional label, frequency, evidence, two classifications, and exactly five map colors.
- Evidence accepts images, video, audio, PDF/text/JSON/Word documents, plus in-browser audio recording.
- Place detail shows all evidence types and finds hashtag/proximity coincidences locally.
- Hashtag index groups matching places and opens a local search for a selected hashtag.

### Routes
- Replaced browser prompts with a dedicated route editor.
- Routes can be created, edited, reordered, have stops added/substituted/removed, displayed on the map, hidden, or deleted with a custom confirmation dialog.

### UserFx
- UserFx is a code-gated local warehouse for multimedia and private notes.
- Supports file upload, audio recording, filtering by media type, previews/playback, favorites, and explicit locking.
- Every stored asset can be linked to an existing place or note; composers can also select evidence from UserFx.
- UserFx automatically relocks after inactivity or when its panel is closed.

### Emergency flow
- Emergency is protected by a separate 4–8 digit code.
- Configuration stores a trusted contact's name, iMessage/phone number, and email.
- After code verification, FX Map collects current GPS (or a clearly identified map fallback), prepares all locations, notes, hashtags, routes, follow-up comments, and evidence inventory, then opens iMessage or email with the report ready for review.
- A complete JSON emergency archive—including locally stored evidence—is available through the native share sheet or download fallback.
- The web app never claims to send silently: the user confirms the final send in iMessage, Mail, or the system share sheet.

## Validation
Run:

```bash
node scripts/validate-map.mjs
python3 -m py_compile src/*.py
git diff --check
```
