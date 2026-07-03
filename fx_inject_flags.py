#!/usr/bin/env python3
"""FX MAP — Inject flag override at end of script (guaranteed to work)"""
import sys, os

src = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
with open(src, encoding='utf-8') as f:
    html = f.read()

# Remove previous injections to avoid duplicates
html = html.replace('/* FX_FLAGS_OVERRIDE */', '')

INJECT = """
/* FX_FLAGS_OVERRIDE */
const FLAG_ORDER = ['save','party','favorite','risk','caution'];

Object.assign(CLASS_META, {
  save:     { e: '🔵', l: 'Guardado',  t: 'safe',    c: '#4a7fa5' },
  party:    { e: '🔴', l: 'Social',    t: 'party',   c: '#e0304a' },
  favorite: { e: '⭐', l: 'Favorito',  t: 'favorite',c: '#d4a017' },
  risk:     { e: '🟠', l: 'Riesgo',    t: 'risk',    c: '#e06820' },
  caution:  { e: '🔒', l: 'Privado',   t: 'caution', c: '#7040c8' },
});

function renderPickFlags() {
  const el = document.getElementById('pick-flags');
  if (!el) return;
  el.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:14px 0 8px';
  el.innerHTML = FLAG_ORDER.map(k => {
    const m = CLASS_META[k]; if (!m) return '';
    return `<button type="button" class="pick-flag" data-cls="${k}">
      <span class="flagico" style="background:${m.c};width:26px;height:32px;display:block;clip-path:polygon(0 0,100% 0,100% 100%,50% 76%,0 100%);filter:drop-shadow(0 4px 8px rgba(0,0,0,.6))"></span>
      <span class="flaglbl" style="font-size:7px;font-weight:800;color:var(--text-muted);letter-spacing:.04em;text-transform:uppercase;text-align:center">${m.l}</span>
    </button>`;
  }).join('') +
  `<button type="button" class="pick-flag" id="pick-flag-vip">
    <span style="font-size:22px;height:32px;display:flex;align-items:center;justify-content:center;color:#ffc800">𖣿</span>
    <span class="flaglbl" style="font-size:7px;font-weight:800;color:#ffc800;text-transform:uppercase">VIP</span>
  </button>`;
  el.querySelectorAll('.pick-flag[data-cls]').forEach(b =>
    b.addEventListener('click', () => pickToSave(b.dataset.cls)));
  const vb = document.getElementById('pick-flag-vip');
  if (vb) vb.addEventListener('click', () => {
    if (!pickPoint) return;
    closePickModal();
    openPhotoModal(pickPoint.lng, pickPoint.lat, pickAddress);
  });
}

function renderPhotoFlags(existing) {
  const el = document.getElementById('photo-flags');
  if (!el) return;
  el.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:5px;padding:14px 0 8px';
  const cur = existing?.classification || null;
  el.innerHTML = FLAG_ORDER.map(k => {
    const m = CLASS_META[k]; if (!m) return '';
    const sel = cur === k ? 'outline:2px solid var(--neon-green);outline-offset:2px;' : '';
    return `<button type="button" class="pick-flag" data-cls="${k}">
      <span class="flagico" style="background:${m.c};width:26px;height:32px;display:block;clip-path:polygon(0 0,100% 0,100% 100%,50% 76%,0 100%);filter:drop-shadow(0 4px 8px rgba(0,0,0,.6));${sel}"></span>
      <span class="flaglbl" style="font-size:7px;font-weight:800;color:${cur===k?'var(--neon-green)':'var(--text-muted)'};letter-spacing:.04em;text-transform:uppercase;text-align:center">${m.l}</span>
    </button>`;
  }).join('') +
  `<button type="button" class="pick-flag" id="photo-flag-vip">
    <span style="font-size:22px;height:32px;display:flex;align-items:center;justify-content:center;color:#ffc800">𖣿</span>
    <span class="flaglbl" style="font-size:7px;font-weight:800;color:#ffc800;text-transform:uppercase">VIP</span>
  </button>`;
  el.querySelectorAll('.pick-flag[data-cls]').forEach(b =>
    b.addEventListener('click', () => photoSetFlag(b.dataset.cls)));
  document.getElementById('photo-flag-vip')?.addEventListener('click', photoToggleVip);
}
"""

# Inject before closing </script> of the main script
html = html.replace(
    "console.log('FX MAP X11 — CYBERPUNK NEON — Cargado correctamente 🚀');",
    INJECT + "\nconsole.log('FX MAP X11 — FLAGS OVERRIDE ACTIVE 🚀');"
)

with open(src, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'✓ {src} ({len(html):,} chars)')
