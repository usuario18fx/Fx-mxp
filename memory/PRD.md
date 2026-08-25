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

## Nova restyle (Agosto 2026)

### Scope
- New **Nova** design layer appended as the final CSS block in `public/index.html`. CSS only — no HTML markup or JavaScript is changed, so every flow, the offline-first persistence, the Supabase sync and the AES encryption keep working unchanged.
- Quiet **violet-on-void** palette replaces the Atlas mint: accent `#8b80f7`, info cyan `#5cc8ff`, coral danger `#ff6b81`, near-black canvas `#090a12`, violet-tinted hairlines and glass surfaces.
- Restyles every surface in scope: app header, search entry and results, the compact utility rail, the five-destination dock, the organizer menu (`#menu-panel`), the places drawer, the notifications panel, the UserFx warehouse, all composer/flow modals (save, encryption, SOS emergency, auth gate, note editor, pick, route editor, asset/link picker), the place detail panel, the thumbnail/note overflow menus, the toast and the mode popup. Primary buttons use a violet gradient; secondary buttons are quiet glass; modal cards gain a violet→cyan top accent line.

### Explicitly preserved
- **All existing logic** — no `<script>` edits.
- **The compact modal** — `#confirm-modal`. Its design tokens are re-pinned to the previous Atlas values inside its scope so it renders exactly as before.
- **The circular map joystick** — `#orbital` (`.dpad`, `.map-direction` arrows, `#dp-home`). Its tokens are re-pinned to the Atlas values inside `#orbital`, leaving its layout and appearance untouched.

## iOS / HIG restyle (Agosto 2026)

### Scope
- New **iOS / HIG** layer appended as the final CSS block in `public/index.html`, sitting on top of Nova. Again **CSS only** — no HTML markup or JavaScript changes — so all flows, persistence, sync and encryption are untouched.
- Moves the chrome from the Material/Android feel to a native **iOS (dark mode)** experience:
  - **Bottom tab bar** — `#main-dock` becomes an edge-to-edge frosted tab bar (system-blue tint when selected, gray when not, hairline on top).
  - **Segmented controls** — the menu/drawer/media tabs (`.ptab`, `.dtab`, `.msec`) render as iOS segmented controls; category filters become pill chips.
  - **Grouped inset lists** — places, connections, notifications, vault rows and pickers render as flat `#1c1c1e` rows separated by `.5px` hairlines (Ajustes-style).
  - **Sheets** — composer/flow modals become frosted cards with a centered grabber handle, rounded corners and no accent lines.
  - **iOS palette** — pure-black canvas, `#1c1c1e`/`#2c2c2e` surfaces, system-blue `#0a84ff` tint, system red/green/orange for status, `.5px` separators.
  - **Typography** — Inter (SF-equivalent) with `-apple-system` fallback for true native rendering on Apple devices.
  - **Buttons & fields** — filled tinted primary, gray secondary, red destructive, rounded-rect inputs.
- **Preserved**: the circular map joystick keeps its form/behaviour and adopts the system tint; the compact confirm modal stays compact and renders as an iOS alert. Validation counts (273 IDs / 469 refs / 202 functions) are identical to baseline, confirming no logic change.
