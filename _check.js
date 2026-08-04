
// ════════════════════════════════════════════════════════════════
// FX MAP X11 — FULL LOGIC (optimized) — CYBERPUNK NEON VERSION
// ════════════════════════════════════════════════════════════════

mapboxgl.accessToken = 'pk.eyJ1IjoiLXVzZXIxOGZ4IiwiYSI6ImNtczg1dmhnbjBiOG4yenE1aWJsdTVsdDMifQ.DCpulj_HXHw2KBfQWIeUYw';

// ─── CONFIGURATION ──────────────────────────────────────────────
const BASE = {
  center: [-79.86125, 43.25295],
  zoom: 16.22,
  pitch: 61.5,
  bearing: 15,
  style: 'mapbox://styles/mapbox/standard'
};

const SK = {
  places: 'fxmap.v8.places',
  routes: 'fxmap.v8.routes',
  labels: 'fxmap.v8.labels',
  media: 'fxmap.v8.media',
  notes: 'fxmap.v8.notes',
  settings: 'fxmap.v8.settings',
  notifs: 'fxmap.v8.notifs',
  imported: 'fxmap.v8.imported'
};

const CLASS_META = {
  save: { e: '⚿', l: 'Guardado', t: 'safe', c: '#0088ff' },
  flag: { e: '⚑', l: 'Etiqueta', t: 'flag', c: '#ffe760' },
};

const COLORS = [
  { n: 'Morado', v: '#ee0df9' },
  { n: 'Rojo',   v: '#ff3b3b' },
  { n: 'Cyan',   v: '#18e0ff' },
  { n: 'Verde',  v: '#00ff73' },
];

const FLAG_ORDER = ['save', 'flag'];

// ─── MAP INIT ──────────────────────────────────────────────────
const map = new mapboxgl.Map({
  container: 'map',
  style: BASE.style,
  center: BASE.center,
  zoom: BASE.zoom,
  pitch: BASE.pitch,
  bearing: BASE.bearing,
  antialias: true,
  scrollZoom: false,
  doubleClickZoom: false,
  touchZoomRotate: false,
  boxZoom: false,
  keyboard: false,
  config: {
    basemap: {
      theme: 'monochrome',
      lightPreset: 'night',
      show3dObjects: true,
      showPlaceLabels: false,
      showPointOfInterestLabels: false,
      showRoadLabels: false,
      showTransitLabels: false
    }
  }
});

// Disable all zoom controls
map.scrollZoom.disable();
map.doubleClickZoom.disable();
map.touchZoomRotate.disable();
map.boxZoom.disable();
map.keyboard.disable();

// ─── VIEWPORT / RESIZE FIX (corrige corte de pantalla en iOS Safari) ──
function setAppHeight() {
  document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
  if (map) map.resize();
}
setAppHeight();
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 300));
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', setAppHeight);
  window.visualViewport.addEventListener('scroll', setAppHeight);
}

// ─── STATE ──────────────────────────────────────────────────────
let places = [],
    routes = [],
    labels = [],
    mediaStore = [],
    notesStore = [],
    notifications = [];

let noteEditingId = null;

let settings = {
  name: '',
  phone: '',
  telegram: '',
  apikey: '',
  privPass: '0000',
  radius: 500
};

let userLocation = [...BASE.center];
let ctrlMode = 'zoom',
    ctrlVisible = true,
    exploreMode = false;
let pendingPoint = null,
    pendingMedia = [],
    pendingColor = '',
    pendingClass = 'save',
    pendingVip = false,
    pendingTagColor = null;
let selectedId = null,
    pendingDelId = null,
    encKey = null,
    placesLocked = false,
    privUnlocked = false;
let pressTimer = null,
    locPopupCoords = null;
let buildingHighlightReady = false;
let searchConfirmMarker = null,
    searchConfirmPoint = null,
    searchConfirmAddress = '';
let searchMode = 'address',
    searchIdleTimer = null,
    searchAbort = null,
    st1 = null;
let pickPoint = null,
    pickAddress = '';
let photoPoint = null,
    photoAddress = '',
    photoExistingId = null;
let publishColor = '',
    publishType = '';

// ─── UTILITIES ──────────────────────────────────────────────────
const vibra = () => { try { navigator.vibrate([12]); } catch (e) {} };
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = id => document.getElementById(id);
const fmtDate = iso => new Date(iso).toLocaleString('es-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
const fmtDist = m => m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
let svlErrorShown = false;
const svl = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    if (!svlErrorShown) {
      svlErrorShown = true;
      const isQuota = e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014;
      toast(isQuota ? '⚠ Almacenamiento lleno — este cambio NO se guardó' : '⚠ Error al guardar — revisa el modo privado del navegador');
      setTimeout(() => { svlErrorShown = false; }, 4000);
    }
    return false;
  }
};
const ldl = (k, fb) => { try { return JSON.parse(localStorage.getItem(k) || 'null') ?? fb; } catch { return fb; } };

function distM(a, b) {
  const R = 6371000,
        dLat = (b[1] - a[1]) * Math.PI / 180,
        dLng = (b[0] - a[0]) * Math.PI / 180,
        la1 = a[1] * Math.PI / 180,
        la2 = b[1] * Math.PI / 180,
        h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toast(msg, dur = 2000) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), dur);
}

// Click feedback
document.addEventListener('click', e => { if (e.target.closest('button')) vibra(); }, { capture: true, passive: true });

// ─── ENCRYPTION ─────────────────────────────────────────────────
function encD(d, k) {
  try { return CryptoJS.AES.encrypt(JSON.stringify(d), k).toString(); } catch { return null; }
}
function decD(s, k) {
  try { const b = CryptoJS.AES.decrypt(s, k); return JSON.parse(b.toString(CryptoJS.enc.Utf8)); } catch { return null; }
}

// ─── LOAD / SAVE ──────────────────────────────────────────────
function loadAll() {
  settings = ldl(SK.settings, settings);
  syncCfgUI();
  const encBlob = localStorage.getItem('fxmap.enc');
  if (encBlob) {
    // Hay datos cifrados: no cargar nada en claro hasta que se ingrese la clave correcta
    places = [];
    placesLocked = true;
  } else {
    // Cargar datos — con fallback a claves de versiones anteriores
    places = ldl(SK.places, null) 
      || ldl('fxmap.v7.places', null)
      || ldl('fxmap.places', null)
      || ldl('fx-map.places', null)
      || [];
    placesLocked = false;
  }
  routes = ldl(SK.routes, null)
    || ldl('fxmap.v7.routes', null)
    || ldl('fxmap.routes', null)
    || [];
  labels = ldl(SK.labels, []);
  mediaStore = ldl(SK.media, []);
  notesStore = ldl(SK.notes, []);
  notifications = ldl(SK.notifs, []);
  // Migrar a claves nuevas si vinieron de claves viejas (solo si no está bloqueado)
  if (!placesLocked) {
    svl(SK.places, places);
    svl(SK.routes, routes);
    svl(SK.imported, true);
  }
}

function saveAll() {
  if (encKey) {
    const t = encD(places, encKey);
    if (t) svl('fxmap.enc', t);
    else toast('⚠ Error al re-cifrar, cambios no guardados con seguridad');
  } else {
    svl(SK.places, places);
  }
  svl(SK.routes, routes);
  svl(SK.labels, labels);
  svl(SK.media, mediaStore);
  svl(SK.notes, notesStore);
  svl(SK.notifs, notifications);
}

// ─── D-PAD CONTROLS ────────────────────────────────────────────
function dpadAction(dir) {
  vibra();
  const ease = opts => map.easeTo({ ...opts, duration: 220, essential: true });
  if (dir === 'up') {
    ctrlMode === 'zoom' ? ease({ zoom: Math.min(18, map.getZoom() + .35) }) : ease({ pitch: Math.min(80, map.getPitch() + 5) });
  } else if (dir === 'dn') {
    ctrlMode === 'zoom' ? ease({ zoom: Math.max(10, map.getZoom() - .35) }) : ease({ pitch: Math.max(0, map.getPitch() - 5) });
  } else if (dir === 'lt') {
    ease({ bearing: map.getBearing() - 12 });
  } else if (dir === 'rt') {
    ease({ bearing: map.getBearing() + 12 });
  }
}

function startHold(dir) {
  dpadAction(dir);
  const iv = setInterval(() => dpadAction(dir), 180);
  const stop = () => { clearInterval(iv); document.removeEventListener('mouseup', stop); document.removeEventListener('touchend', stop); };
  document.addEventListener('mouseup', stop);
  document.addEventListener('touchend', stop);
}

function setCtrlMode(mode) {
  ctrlMode = mode;
  $('ctrl-a').classList.toggle('on', mode === 'zoom');
  $('ctrl-b').classList.toggle('on', mode === 'tilt');
  toast(mode === 'tilt' ? 'Modo inclinación' : 'Modo zoom');
}

function toggleCtrlVisible() {
  ctrlVisible = !ctrlVisible;
  $('orbital').classList.toggle('hidden', !ctrlVisible);
  $('btn-toggle').classList.toggle('active', ctrlVisible);
  toast(ctrlVisible ? 'Controles visibles' : 'Controles ocultos');
}

function centerUser() {
  vibra();
  map.easeTo({ center: userLocation, zoom: BASE.zoom, pitch: BASE.pitch, bearing: BASE.bearing, duration: 400, essential: true });
  toast('📍 Centrando ubicación');
}

// ─── EXPLORE MODE ──────────────────────────────────────────────
let modePopupTimer = null;
function flashModePopup(text, explore) {
  const el = $('mode-badge');
  el.textContent = text;
  el.classList.toggle('explore', !!explore);
  el.classList.add('show');
  clearTimeout(modePopupTimer);
  modePopupTimer = setTimeout(() => el.classList.remove('show'), 1600);
}

function setExplore(on) {
  exploreMode = on;
  if (on) { map.touchZoomRotate.enable(); map.scrollZoom.enable(); } 
  else { map.touchZoomRotate.disable(); map.scrollZoom.disable(); }
  $('search-explore-btn').classList.toggle('active', on);
  $('srch-lbl').textContent = on ? 'Modo exploración activo' : 'Buscar dirección';
  flashModePopup(on ? '◎ MODO EXPLORACIÓN' : '● MODO VISTA', on);
  if (on) { $('orbital').classList.add('hidden'); $('search-wrap').classList.add('open'); armSearchIdle(); } 
  else { if (ctrlVisible) $('orbital').classList.remove('hidden'); $('search-wrap').classList.remove('open'); $('search-results').classList.remove('open'); clearLocPopup(); clearSearchIdle(); }
}

// ─── SEARCH IDLE ───────────────────────────────────────────────
function clearSearchIdle() { clearTimeout(searchIdleTimer); $('search-wrap')?.classList.remove('idle'); }
function armSearchIdle() {
  clearSearchIdle();
  $('search-wrap')?.classList.remove('idle');
  searchIdleTimer = setTimeout(() => { $('search-wrap')?.classList.add('idle'); }, 3000);
}

function setSearchMode(mode) {
  searchMode = mode;
  const icon = $('mode-toggle-icon');
  const input = $('si1');
  if (mode === 'saved') {
    icon.textContent = '🔑';
    icon.classList.add('saved-mode');
    input.placeholder = 'Buscar datos guardados...';
  } else {
    icon.textContent = '⚑';
    icon.classList.remove('saved-mode');
    input.placeholder = 'Buscar dirección...';
  }
  input.value = '';
  $('sb1')?.classList.remove('has-text');
  $('search-results').classList.remove('open');
  $('search-results').innerHTML = '';
}

// ─── LONG PRESS ────────────────────────────────────────────────
let pressStartXY = null;

function onPressStart(e) {
  if (!exploreMode) return;
  const pt = e.touches?.[0] || e;
  pressStartXY = { x: pt.clientX, y: pt.clientY };
  const ll = map.unproject([pt.clientX, pt.clientY]);
  pressTimer = setTimeout(() => {
    vibra(); vibra();
    locPopupCoords = [ll.lng, ll.lat];
    const ring = $('press-ring');
    ring.style.left = pt.clientX + 'px';
    ring.style.top = pt.clientY + 'px';
    ring.style.display = 'block';
    ring.style.animation = 'none';
    void ring.offsetWidth;
    ring.style.animation = 'ring-grow .3s ease forwards';
    const popup = $('loc-popup');
    popup.style.left = pt.clientX + 'px';
    popup.style.top = (pt.clientY - 20) + 'px';
    popup.style.display = 'flex';
    $('loc-card').style.display = 'none';
    $('loc-emoji').onclick = () => {
      $('loc-card').style.display = 'block';
      $('loc-coords2').textContent = `${ll.lat.toFixed(6)}, ${ll.lng.toFixed(6)}`;
      $('loc-addr').textContent = 'Cargando dirección...';
      reverseGeocode(ll.lng, ll.lat).then(a => $('loc-addr').textContent = a || `${ll.lat.toFixed(5)}, ${ll.lng.toFixed(5)}`);
    };
  }, 3000);
}

function onPressMove(e) {
  if (!pressTimer || !pressStartXY) return;
  const pt = e.touches?.[0] || e;
  const dx = pt.clientX - pressStartXY.x;
  const dy = pt.clientY - pressStartXY.y;
  if (Math.hypot(dx, dy) > 10) onPressEnd();
}

function onPressEnd() {
  clearTimeout(pressTimer);
  pressTimer = null;
  pressStartXY = null;
  $('press-ring').style.display = 'none';
}

function clearLocPopup() {
  $('loc-popup').style.display = 'none';
  $('loc-card').style.display = 'none';
  locPopupCoords = null;
}

// ─── BUILDING HIGHLIGHTS ──────────────────────────────────────
function ensureBuildingHighlightLayers() {
  if (buildingHighlightReady) return;
  if (!map.getSource('fx-building-highlights')) {
    map.addSource('fx-building-highlights', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    });
  }
  if (!map.getLayer('fx-building-highlight-fill')) {
    map.addLayer({
      id: 'fx-building-highlight-fill',
      type: 'fill-extrusion',
      source: 'fx-building-highlights',
      paint: {
        'fill-extrusion-color': ['get', 'color'],
        'fill-extrusion-base': ['coalesce', ['get', 'base'], 0],
        'fill-extrusion-height': ['coalesce', ['get', 'height'], 28],
        'fill-extrusion-opacity': 0.96,
        'fill-extrusion-vertical-gradient': true
      }
    });
  }
  if (!map.getLayer('fx-building-highlight-outline')) {
    map.addLayer({
      id: 'fx-building-highlight-outline',
      type: 'line',
      source: 'fx-building-highlights',
      paint: {
        'line-color': ['get', 'lineColor'],
        'line-width': 2.2,
        'line-opacity': 0.95
      }
    });
  }
  buildingHighlightReady = true;
}

function squarePolygonAround(lng, lat, size = 0.000055) {
  return [[
    [lng - size, lat - size],
    [lng + size, lat - size],
    [lng + size, lat + size],
    [lng - size, lat + size],
    [lng - size, lat - size]
  ]];
}

function getBuildingFeatureForPoint(item) {
  const point = map.project([item.lng, item.lat]);
  let feats = [];
  if (map.getLayer('building')) {
    try {
      feats = map.queryRenderedFeatures([[point.x - 8, point.y - 8], [point.x + 8, point.y + 8]], { layers: ['building'] }) || [];
    } catch (e) {
      feats = [];
    }
  }
  const picked = feats.find(f => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
  if (picked) {
    const height = Number(picked.properties?.height || picked.properties?.render_height || 32);
    const base = Number(picked.properties?.min_height || picked.properties?.render_min_height || 0);
    return { geometry: picked.geometry, height: Math.max(height, 18), base: Math.max(base, 0) };
  }
  return { geometry: { type: 'Polygon', coordinates: squarePolygonAround(item.lng, item.lat) }, height: 26, base: 0 };
}

function renderMarkers() {
  ensureBuildingHighlightLayers();
  const fc = {
    type: 'FeatureCollection',
    features: places.map(item => {
      const cl = CLASS_META[item.classification || 'save'] || CLASS_META.save;
      const picked = getBuildingFeatureForPoint(item);
      return {
        type: 'Feature',
        geometry: picked.geometry,
        properties: {
          id: item.id,
          title: item.title,
          classification: item.classification || 'save',
          color: item.color || cl.c,
          lineColor: '#d4ff00',
          height: picked.height,
          base: picked.base
        }
      };
    })
  };
  const src = map.getSource('fx-building-highlights');
  if (src) src.setData(fc);
}

// ─── RENDER FUNCTIONS ──────────────────────────────────────────
function renderAll() {
  renderAddrs();
  renderLabels();
  renderRoutes();
  renderBoard();
  renderPrivate();
  renderMediaGrid();
  renderNotifBadge();
  renderMarkers();
  renderVipList();
}

function renderAddrs() {
  const el = $('addrs-list');
  if (!places.length) { el.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:10px 0">Sin lugares. Toca el mapa o usa 🔍.</div>`; return; }
  el.innerHTML = places.map(p => {
    const cl = CLASS_META[p.classification || 'save'];
    const imgs = (p.media || []).slice(0, 4);
    const ir = imgs.length ? `<div class="pli-imgs">${imgs.map(m => `<div class="pli-img"><img src="${esc(m.url)}" alt=""/></div>`).join('')}</div>` : '';
    return `<div class="pli" data-id="${p.id}" style="border-left:3px solid ${p.color||'#d4ff00'}">
      <div class="pli-top"><div class="pli-name">${esc(cl?.e||'')} ${esc(p.title)}</div><button class="pli-del" data-del="${p.id}">🗑</button></div>
      <div class="pli-sub">${esc(p.notes||'Sin comentario')}</div>
      <div class="pli-meta">${esc(p.createdAtLabel||'')}${p.source==='google'?' · Google Takeout':''}</div>
      ${ir}
    </div>`;
  }).join('');
  el.querySelectorAll('.pli[data-id]').forEach(r => r.addEventListener('click', e => { if (!e.target.closest('[data-del]')) flyTo(r.dataset.id); }));
  el.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); confirmDel(b.dataset.del); }));
}

function renderLabels() {
  const el = $('labels-list');
  const byC = {};
  places.forEach(p => { const k = p.classification || 'save'; (byC[k] = byC[k] || []).push(p); });
  let h = '';
  for (const [k, items] of Object.entries(byC)) {
    const m = CLASS_META[k] || CLASS_META.save;
    h += `<div class="lbl-group"><div class="lbl-group-hd">${m.e} ${m.l} (${items.length})</div><div style="display:flex;flex-wrap:wrap;gap:4px">`;
    items.forEach(p => h += `<div class="lchip" data-id="${p.id}" style="border-left:3px solid ${p.color||m.c}">${esc(p.title)}</div>`);
    h += `</div></div>`;
  }
  const order = ['save', 'flag'];
  order.filter(k => !byC[k]).forEach(k => { const m = CLASS_META[k]; h += `<div class="lbl-group"><div class="lbl-group-hd">${m.e} ${m.l} (0)</div><div style="color:var(--text-muted);font-size:11px;padding:6px 0">Sin lugares.</div></div>`; });
  el.innerHTML = h || `<div style="color:var(--text-muted);font-size:11px;padding:10px 0">Sin etiquetas.</div>`;
  el.querySelectorAll('.lchip[data-id]').forEach(c => c.addEventListener('click', () => flyTo(c.dataset.id)));
}

function renderRoutes() {
  const el = $('routes-list');
  if (!routes.length) { el.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:10px 0">Sin rutas guardadas.</div>`; return; }
  el.innerHTML = routes.map(r => `
    <div class="rcard"><div class="rcard-head"><div><div class="rcard-name">${esc(r.name)}</div><div class="rcard-meta">${fmtDate(r.createdAt)}</div></div><div class="rcard-badge">${r.stops.length} PARADAS</div></div>
    <div class="rcard-stops">${r.stops.map(s => `<div class="rstop"><div class="rstop-dot"></div><div class="rstop-name">${esc(s)}</div></div>`).join('')}</div></div>`).join('');
}

function renderBoard() {
  const el = $('board-grid');
  $('board-count').textContent = `${places.length} registros`;
  const counts = { save: 0, flag: 0 };
  places.forEach(p => { const k = p.classification || 'save'; if (counts[k] != null) counts[k]++; });
  el.innerHTML = `
    <div class="bcard bcard-kpi" style="grid-column:1/-1">
      <div class="bcard-body">
        <div class="bcard-title">Dashboard CYBER</div>
        <div class="bcard-sub">${places.length} ubicaciones · ${routes.length} rutas · ${labels.length} etiquetas</div>
        <div class="bcard-tags">
          <span class="ctag safe">⚿ ${counts.save}</span>
          <span class="ctag flag">⚑ ${counts.flag}</span>
        </div>
      </div>
    </div>` + places.map(p => {
    const cl = CLASS_META[p.classification || 'save'] || CLASS_META.save;
    const img = (p.media || [])[0];
    const ih = img ? `<img class="bcard-img" src="${esc(img.url)}" alt=""/>` : `<div class="bcard-img noimg">${cl.e}</div>`;
    return `<div class="bcard" data-id="${p.id}">${ih}<div class="bcard-body"><div class="bcard-title">${esc(p.title)}</div><div class="bcard-sub">${esc(p.notes||'Sin detalles')}</div><div class="bcard-tags"><span class="ctag ${cl.t}">${cl.l}</span>${p.source==='google'?'<span class="ctag watch">Google</span>':''}</div></div></div>`;
  }).join('') || '';
  if (!places.length) el.innerHTML += `<div style="color:var(--text-muted);font-size:11px;grid-column:1/-1">Sin ubicaciones guardadas.</div>`;
  el.querySelectorAll('.bcard[data-id]').forEach(c => c.addEventListener('click', () => { flyTo(c.dataset.id); $('settings-drawer').classList.remove('open'); $('overlay').classList.remove('show'); }));
  renderConnList();
}

function renderConnList() {
  const el = $('conn-list');
  if (!el) return;
  if (!places.length) { el.innerHTML = '<div style="color:var(--text-muted);font-size:10px;padding:8px 0">Sin ubicaciones.</div>'; return; }
  el.innerHTML = places.slice(0, 6).map(p => {
    const cl = CLASS_META[p.classification || 'save'] || CLASS_META.save;
    const d = distM(userLocation, [p.lng, p.lat]);
    return `<div class="conn-item" data-id="${p.id}"><div class="conn-dot" style="background:${p.color||cl.c}"></div><div style="flex:1;min-width:0"><div class="conn-name">${esc(p.title)}</div><div class="conn-dist">${fmtDist(d)} de tu posición</div></div><span class="ctag ${cl.t}">${cl.l}</span></div>`;
  }).join('');
  el.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', () => flyTo(c.dataset.id)));
}

function renderPrivate() {
  const el = $('priv-quick');
  el.innerHTML = places.slice(0, 10).map(p => `<div class="qi" data-id="${p.id}"><div class="qi-dot" style="background:${p.color||'#d4ff00'}"></div><div style="flex:1;min-width:0"><div class="qi-name">${esc(p.title)}</div><div class="qi-sub">${esc(p.notes||'Sin detalles')}</div></div><span>${(CLASS_META[p.classification||'save']||CLASS_META.save).e}</span></div>`).join('') || `<div style="color:var(--text-muted);font-size:11px">Sin lugares.</div>`;
  el.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', () => flyTo(c.dataset.id)));
  const lEl = $('priv-labels');
  lEl.innerHTML = places.filter(p => p.label).map(p => `<span class="lchip" data-id="${p.id}" style="font-size:10px;border-left:3px solid ${p.color||'#d4ff00'}">${esc(p.label)}</span>`).join('') || `<div style="color:var(--text-muted);font-size:10px">Sin etiquetas.</div>`;
  lEl.querySelectorAll('[data-id]').forEach(c => c.addEventListener('click', () => flyTo(c.dataset.id)));
}

const FLAG_COLORS = ['save', 'flag'];

function buildFlagPopover(currentCustomColor, currentCustomLabel) {
  const pop = document.createElement('div');
  pop.className = 'flag-pop';
  pop.innerHTML = FLAG_COLORS.map(k => `<span class="fdot" data-cls="${k}" style="background:${CLASS_META[k].c}" title="${CLASS_META[k].l}"></span>`).join('')
    + `<span class="fdot" data-cls="" style="background:transparent;border:1px dashed rgba(255,255,255,.3)" title="Quitar"></span>`
    + `<span class="fdot plus" data-act="plus" title="Color personalizado">+</span>`
    + `<div class="flag-custom" style="display:none">
         <input type="color" class="fcolor-input" value="${currentCustomColor || '#d4ff00'}"/>
         <input type="text" class="fcolor-label" placeholder="Nombre" maxlength="16" value="${esc(currentCustomLabel || '')}"/>
         <button type="button" class="fcolor-apply">✓</button>
       </div>`;
  pop.querySelector('[data-act="plus"]').addEventListener('click', (ev) => {
    ev.stopPropagation();
    const box = pop.querySelector('.flag-custom');
    box.style.display = box.style.display === 'flex' ? 'none' : 'flex';
  });
  return pop;
}

function wireFlagPopover(pop, onPreset, onCustom) {
  pop.querySelectorAll('.fdot[data-cls]').forEach(d => d.addEventListener('click', (ev) => {
    ev.stopPropagation();
    onPreset(d.dataset.cls || null);
  }));
  pop.querySelector('.fcolor-apply').addEventListener('click', (ev) => {
    ev.stopPropagation();
    const color = pop.querySelector('.fcolor-input').value;
    const label = pop.querySelector('.fcolor-label').value.trim().slice(0, 16) || 'Personalizado';
    onCustom(color, label);
  });
  setTimeout(() => document.addEventListener('click', function onc(ev) { if (!pop.contains(ev.target)) { pop.remove(); document.removeEventListener('click', onc); } }), 0);
}

let mediaFilter = 'all';

function renderMediaGrid() {
  const el = $('media-grid');
  const notHidden = mediaStore.filter(m => !m.hidden);
  const visible = notHidden.filter(m => {
    if (mediaFilter === 'all') return true;
    if (mediaFilter === 'img') return m.type?.startsWith('image/');
    if (mediaFilter === 'vid') return m.type?.startsWith('video/');
    if (mediaFilter === 'doc') return !m.type?.startsWith('image/') && !m.type?.startsWith('video/');
    return true;
  });
  if (!mediaStore.length) { el.innerHTML = `<div class="media-empty"><div class="media-empty-icon">🗂</div><div style="font-size:11px">Sin archivos cifrados.<br>Toca + para subir.</div></div>`; return; }
  if (!notHidden.length) { el.innerHTML = `<div class="media-empty"><div class="media-empty-icon">👁</div><div style="font-size:11px">Todos los archivos están ocultos.</div></div>`; return; }
  if (!visible.length) { el.innerHTML = `<div class="media-empty"><div class="media-empty-icon">🔍</div><div style="font-size:11px">Nada en esta categoría.</div></div>`; return; }
  const visibleIdx = mediaStore.map((m, i) => visible.includes(m) ? i : -1).filter(i => i !== -1);
  el.innerHTML = visibleIdx.map(i => {
    const m = mediaStore[i];
    const flagColor = m.customFlag ? m.customFlag.color : (m.classification ? (CLASS_META[m.classification]?.c || '#888') : '');
    const hasFlag = !!(m.customFlag || m.classification);
    return `<div class="mthumb" data-idx="${i}">
      <div class="mthumb-actions">
        <button class="mact-btn${m.vip ? ' on vip' : ''}" data-act="vip" title="Favorito">★</button>
        <button class="mact-btn${hasFlag ? ' on' : ''}" data-act="flag" title="${m.customFlag ? m.customFlag.label : 'Bandera'}">◆</button>
        <button class="mact-btn" data-act="hide" title="Ocultar">👁</button>
        <button class="mact-btn" data-act="del" title="Eliminar">🗑</button>
      </div>
      ${m.url ? `<img src="${esc(m.url)}" alt=""/>` : `<div class="mthumb-icon">📄</div>`}
      <div class="mthumb-lbl">${esc(m.name || 'archivo')}</div>
      <div class="mthumb-lock">🔒</div>
      ${flagColor ? `<div class="mthumb-flagdot" style="background:${flagColor}"></div>` : ''}
    </div>`;
  }).join('');

  el.querySelectorAll('.mthumb').forEach(t => {
    const idx = parseInt(t.dataset.idx);
    t.addEventListener('click', (e) => {
      if (e.target.closest('.mthumb-actions') || e.target.closest('.flag-pop')) return;
      const m = mediaStore[idx];
      if (m?.url) { $('lightbox-img').src = m.url; $('lightbox').classList.add('open'); }
    });
    t.querySelector('[data-act="vip"]').addEventListener('click', (e) => {
      e.stopPropagation();
      mediaStore[idx].vip = !mediaStore[idx].vip;
      saveAll(); renderMediaGrid();
    });
    t.querySelector('[data-act="hide"]').addEventListener('click', (e) => {
      e.stopPropagation();
      mediaStore[idx].hidden = true;
      saveAll(); renderMediaGrid();
      toast('👁 Archivo ocultado');
    });
    t.querySelector('[data-act="del"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('¿Eliminar este archivo cifrado? Esta acción no se puede deshacer.')) return;
      mediaStore.splice(idx, 1);
      saveAll(); renderMediaGrid();
      toast('🗑 Archivo eliminado');
    });
    t.querySelector('[data-act="flag"]').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.flag-pop').forEach(p => p.remove());
      const cf = mediaStore[idx].customFlag;
      const pop = buildFlagPopover(cf?.color, cf?.label);
      t.appendChild(pop);
      wireFlagPopover(pop,
        (cls) => { mediaStore[idx].classification = cls; mediaStore[idx].customFlag = null; saveAll(); renderMediaGrid(); },
        (color, label) => { mediaStore[idx].customFlag = { color, label }; mediaStore[idx].classification = null; saveAll(); renderMediaGrid(); }
      );
    });
  });
}

// ─── FX AUTH GATE ───────────────────────────────────────────────
let fxUnlocked = false;

function openFxMediaPanel() {
  mediaFilter = 'all';
  document.querySelectorAll('.mcat').forEach(x => x.classList.remove('active'));
  document.querySelector('.mcat[data-mc="all"]')?.classList.add('active');
  renderMediaGrid();
  $('notes-list-view').style.display = 'none';
  $('notes-folder-view').style.display = 'block';
  renderNotesFolder();
  document.querySelectorAll('.msec').forEach(x => x.classList.remove('active'));
  document.querySelector('.msec[data-sec="multimedia"]').classList.add('active');
  document.querySelectorAll('.media-section-pane').forEach(p => p.classList.remove('active'));
  $('sec-multimedia').classList.add('active');
  openPanel('media-panel');
}

async function requestFxAccess() {
  if (fxUnlocked) { openFxMediaPanel(); return; }
  $('fx-auth-pass').value = '';
  $('fx-auth-modal').style.display = 'flex';
  const bioAvailable = window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().catch(() => false);
  $('fx-auth-bio').style.display = bioAvailable ? 'block' : 'none';
  setTimeout(() => $('fx-auth-pass').focus(), 100);
}

function closeFxAuth() {
  $('fx-auth-modal').style.display = 'none';
}

function submitFxPassword() {
  const p = $('fx-auth-pass').value;
  if (p === settings.privPass) {
    fxUnlocked = true;
    closeFxAuth();
    openFxMediaPanel();
    toast('✓ Acceso concedido');
  } else {
    toast('❌ Contraseña incorrecta');
  }
}

async function attemptBiometricUnlock() {
  try {
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: 'FX MAP X11' },
        user: { id: crypto.getRandomValues(new Uint8Array(16)), name: 'fx-user', displayName: 'FX' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required' },
        timeout: 30000
      }
    });
    if (cred) {
      fxUnlocked = true;
      closeFxAuth();
      openFxMediaPanel();
      toast('✓ Identidad verificada');
    }
  } catch (e) {
    toast('❌ Verificación cancelada');
  }
}

// ─── NOTAS ──────────────────────────────────────────────────────
function renderNotesFolder() {
  const visible = notesStore.filter(n => !n.hidden);
  $('notes-count-lbl').textContent = `${visible.length} ${visible.length === 1 ? 'nota' : 'notas'}`;
}

function renderNotesList() {
  const el = $('notes-list');
  const visible = notesStore.filter(n => !n.hidden);
  if (!visible.length) { el.innerHTML = `<div class="notes-empty">Sin notas guardadas.<br>Toca "Nueva nota" para crear una.</div>`; return; }
  el.innerHTML = notesStore.map((n, i) => {
    if (n.hidden) return '';
    const flagColor = n.customFlag ? n.customFlag.color : (n.classification ? (CLASS_META[n.classification]?.c || '') : '');
    const hasFlag = !!(n.customFlag || n.classification);
    const d = n.createdAt ? new Date(n.createdAt).toLocaleDateString() : '';
    return `<div class="note-item" data-idx="${i}">
      ${flagColor ? `<div class="note-flagdot" style="background:${flagColor}"></div>` : ''}
      <div class="note-title" data-act="open">${esc(n.title || 'Sin título')}</div>
      <div class="note-body-preview">${esc((n.body || '').slice(0, 80))}</div>
      <div class="note-date">${d}${n.customFlag ? ' · ' + esc(n.customFlag.label) : ''}</div>
      <div class="note-actions">
        <button class="mact-btn${n.vip ? ' on vip' : ''}" data-act="vip" title="Favorito">★</button>
        <button class="mact-btn${hasFlag ? ' on' : ''}" data-act="flag" title="${n.customFlag ? n.customFlag.label : 'Bandera'}">◆</button>
        <button class="mact-btn" data-act="hide" title="Ocultar">👁</button>
        <button class="mact-btn" data-act="del" title="Eliminar">🗑</button>
      </div>
    </div>`;
  }).join('');

  el.querySelectorAll('.note-item').forEach(card => {
    const idx = parseInt(card.dataset.idx);
    card.querySelector('[data-act="open"]').addEventListener('click', () => openNoteEditor(idx));
    card.querySelector('[data-act="vip"]').addEventListener('click', (e) => {
      e.stopPropagation();
      notesStore[idx].vip = !notesStore[idx].vip;
      saveAll(); renderNotesList();
    });
    card.querySelector('[data-act="hide"]').addEventListener('click', (e) => {
      e.stopPropagation();
      notesStore[idx].hidden = true;
      saveAll(); renderNotesList(); renderNotesFolder();
      toast('👁 Nota ocultada');
    });
    card.querySelector('[data-act="del"]').addEventListener('click', (e) => {
      e.stopPropagation();
      if (!confirm('¿Eliminar esta nota? Esta acción no se puede deshacer.')) return;
      notesStore.splice(idx, 1);
      saveAll(); renderNotesList(); renderNotesFolder();
      toast('🗑 Nota eliminada');
    });
    card.querySelector('[data-act="flag"]').addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.flag-pop').forEach(p => p.remove());
      const cf = notesStore[idx].customFlag;
      const pop = buildFlagPopover(cf?.color, cf?.label);
      pop.style.top = 'auto';
      card.style.position = 'relative';
      card.appendChild(pop);
      wireFlagPopover(pop,
        (cls) => { notesStore[idx].classification = cls; notesStore[idx].customFlag = null; saveAll(); renderNotesList(); },
        (color, label) => { notesStore[idx].customFlag = { color, label }; notesStore[idx].classification = null; saveAll(); renderNotesList(); }
      );
    });
  });
}

function openNoteEditor(idx = null) {
  noteEditingId = idx;
  const n = idx !== null ? notesStore[idx] : null;
  $('note-edit-title').value = n?.title || '';
  $('note-edit-body').value = n?.body || '';
  $('note-editor-modal').style.display = 'flex';
}

function closeNoteEditor() {
  $('note-editor-modal').style.display = 'none';
  noteEditingId = null;
}

function saveNoteEditor() {
  const title = $('note-edit-title').value.trim();
  const body = $('note-edit-body').value.trim();
  if (!title && !body) { closeNoteEditor(); return; }
  if (noteEditingId !== null) {
    notesStore[noteEditingId].title = title || 'Sin título';
    notesStore[noteEditingId].body = body;
  } else {
    notesStore.unshift({ id: crypto.randomUUID(), title: title || 'Sin título', body, createdAt: new Date().toISOString(), vip: false, classification: null, hidden: false });
  }
  saveAll();
  renderNotesList();
  renderNotesFolder();
  closeNoteEditor();
  toast('✓ Nota guardada');
}

function renderNotifBadge() {
  const u = notifications.filter(n => !n.read).length;
  const b = $('notif-badge');
  if (u > 0) { b.textContent = u; b.style.display = 'flex'; } else b.style.display = 'none';
}

function renderVipList() {
  const el = $('vip-list');
  if (!el) return;
  const vips = places.filter(p => p.vip);
  if (!vips.length) { el.innerHTML = `<div style="color:var(--text-muted);font-size:11px;padding:10px 0">Sin lugares VIP todavía. Marca un lugar con 𖣿 desde el modal de foto.</div>`; return; }
  el.innerHTML = vips.map(p => {
    const cl = CLASS_META[p.classification || 'save'] || CLASS_META.save;
    const img = (p.media || [])[0];
    const ih = img ? `<img class="bcard-img" src="${esc(img.url)}" alt=""/>` : `<div class="bcard-img noimg">${cl.e}</div>`;
    return `<div class="bcard" data-id="${p.id}" style="margin-bottom:9px;border-color:rgba(255,200,0,0.15)">${ih}<div class="bcard-body"><div class="bcard-title" style="color:#ffd700">𖣿 ${esc(p.title)}</div><div class="bcard-sub">${esc(p.notes||'Sin detalles')}</div><div class="bcard-tags"><span class="ctag ${cl.t}">${cl.l}</span></div></div></div>`;
  }).join('');
  el.querySelectorAll('.bcard[data-id]').forEach(c => c.addEventListener('click', () => { flyTo(c.dataset.id); closeMenuModal(); }));
}

// ─── AI ────────────────────────────────────────────────────────
function runAI() {
  $('ai-spin').classList.add('show');
  $('ai-out').classList.remove('show');
  setTimeout(renderAI, 500);
}

function renderAI() {
  const out = $('ai-out');
  const prompt = $('ai-prompt').value.trim();
  const total = places.length;
  const favs = places.filter(p => p.classification === 'flag' || p.vip).length;
  const clusters = Math.max(1, Math.min(14, Math.ceil(total / 4)));
  const avgDist = places.length ? Math.round(places.reduce((a, p) => a + distM(userLocation, [p.lng, p.lat]), 0) / places.length) : 0;
  out.innerHTML = `<div class="ai-chip">${Math.max(0, 100 - Math.min(78, favs * 9))}% similitud</div> <div class="ai-chip">${Math.min(99, 24 + favs * 8)}% favoritos</div> <div class="ai-chip">A-${String(clusters).padStart(2, '0')} cluster</div> <div class="ai-chip">${fmtDist(avgDist)} distancia media</div> <div class="ai-chip">${total} ubicaciones</div><div style="margin-top:10px;line-height:1.7;color:var(--text-primary)">${esc(prompt || 'Análisis rápido: tu tablero combina marcadores guardados, favoritos y proximidad.')}</div>`;
  out.classList.add('show');
  $('ai-spin').classList.remove('show');
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
function renderNotifList() {
  const el = $('nlist');
  if (!notifications.length) { el.innerHTML = '<div class="notif-empty">Sin notificaciones. Usa  ↺ para actualizar.</div>'; return; }
  el.innerHTML = notifications.map((n, i) => `<div class="ni ${n.read?'':'unread'}" data-i="${i}"><div class="ni-icon">${n.icon||'🤖'}</div><div><div class="ni-text">${esc(n.text)}</div><div class="ni-time">${fmtDate(n.time)}</div></div></div>`).join('');
  el.querySelectorAll('.ni').forEach(item => item.addEventListener('click', () => { const i = parseInt(item.dataset.i); notifications[i].read = true; svl(SK.notifs, notifications); item.classList.remove('unread'); renderNotifBadge(); }));
}

function addNotif(text, icon = '🤖') {
  notifications.unshift({ id: crypto.randomUUID(), text, icon, time: new Date().toISOString(), read: false });
  if (notifications.length > 50) notifications = notifications.slice(0, 50);
  svl(SK.notifs, notifications);
  renderNotifBadge();
}

// ─── PLACE CRUD ───────────────────────────────────────────────
function flyTo(id) {
  const p = places.find(x => x.id === id);
  if (!p) return;
  selectedId = id;
  map.easeTo({ center: [p.lng, p.lat], zoom: 17.3, pitch: BASE.pitch, bearing: BASE.bearing, duration: 320, essential: true });
  vibra();
}

// ─── DETAIL MODAL ───────────────────────────────────────────────
let detailPlaceId = null;

function openDetailModal(id) {
  const p = places.find(x => x.id === id);
  if (!p) { toast('❌ Lugar no encontrado'); return; }
  detailPlaceId = id;
  $('dm-title').value = p.title || '';
  $('dm-addr').textContent = p.notes && p.hashtag ? p.hashtag : (p.label || 'Sin dirección registrada');
  $('dm-notes').value = p.notes || '';
  const media = $('dm-media');
  media.innerHTML = (p.media || []).map(m => `<img src="${esc(m.url)}" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex:0 0 auto;cursor:pointer" data-url="${esc(m.url)}"/>`).join('');
  media.querySelectorAll('img[data-url]').forEach(img => img.addEventListener('click', () => { $('lightbox-img').src = img.dataset.url; $('lightbox').classList.add('open'); }));
  $('dm-vip-btn').classList.toggle('active', !!p.vip);
  updateDetailFlagBtn(p);
  const d = distM(userLocation, [p.lng, p.lat]);
  $('dm-dist').textContent = fmtDist(d) + ' de tu posición';
  $('detail-modal').style.display = 'flex';
}

function closeDetailModal() {
  $('detail-modal').style.display = 'none';
  detailPlaceId = null;
  document.querySelectorAll('.flag-pop').forEach(p => p.remove());
}

function updateDetailFlagBtn(p) {
  const btn = $('dm-flag-btn');
  const type = p.classification;
  if (type && CLASS_META[type]) {
    const m = CLASS_META[type];
    const [r, g, b] = hexToRgb(m.c);
    btn.style.cssText = `width:32px;height:32px;border-radius:8px;background:rgba(${r},${g},${b},.1);border:1.5px solid ${m.c};color:${m.c};display:grid;place-items:center;cursor:pointer;position:relative`;
  } else {
    btn.style.cssText = 'width:32px;height:32px;border-radius:8px;background:transparent;border:1.5px solid rgba(255,255,255,.07);color:#555;display:grid;place-items:center;cursor:pointer;position:relative';
  }
}

function saveDetailModal() {
  const p = places.find(x => x.id === detailPlaceId);
  if (!p) return;
  p.title = $('dm-title').value.trim() || p.title;
  p.notes = $('dm-notes').value.trim();
  saveAll();
  renderAll();
  toast('✓ Cambios guardados');
  closeDetailModal();
}

function confirmDel(id) { pendingDelId = id; $('confirm-modal').classList.add('open'); }

function doDel() {
  if (!pendingDelId) return;
  places = places.filter(p => p.id !== pendingDelId);
  saveAll();
  renderAll();
  toast('✓ Lugar eliminado');
  pendingDelId = null;
  $('confirm-modal').classList.remove('open');
}

// ─── SAVE MODAL ───────────────────────────────────────────────
function openSaveModal(lng, lat, address = '') {
  pendingPoint = { lng, lat };
  searchConfirmAddress = address || '';
  $('q-title').value = address ? address.split(',')[0].trim() : '';
  $('save-addr-preview').textContent = address || 'Dirección seleccionada';
  $('save-hero-title').textContent = (settings.name ? `# ${settings.name}` : '# Usuario').slice(0, 42);
  $('save-hero-note').textContent = '"Algún comentario"';
  $('q-ccoords').style.display = 'flex';
  $('q-coords-chip').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  renderPalette();
  renderClassBtns();
  updatePublishState();
  $('save-modal').classList.add('open');
}

function closeSaveModal() { $('save-modal').classList.remove('open'); }

function resetSaveForm() {
  $('q-title').value = '';
  $('q-notes').value = '';
  $('q-label').value = '';
  $('q-hashtag').value = '';
  $('q-label').style.display = 'none';
  if ($('q-ccoords')) $('q-ccoords').style.display = 'none';
  $('save-mprev').innerHTML = '';
  $('save-hero-title').textContent = (settings.name ? `# ${settings.name}` : '# Usuario').slice(0, 42);
  $('save-hero-note').textContent = '"Algún comentario"';
  if ($('save-addr-preview')) $('save-addr-preview').textContent = 'Dirección seleccionada';
  pendingMedia = [];
  pendingColor = '';
  publishColor = '';
  pendingClass = 'save';
  publishType = '';
  pendingVip = false;
  pendingTagColor = null;
  renderPalette();
  renderClassBtns();
  updatePublishState();
}

function updatePublishState() {
  const okType = !!(pendingClass);
  const okColor = !!(pendingColor || publishColor);
  const ok = (okType && okColor) || pendingVip;
  const btn = $('q-save-act');
  if (btn) btn.classList.toggle('disabled', !ok);
  const st = $('publish-status');
  if (st) st.textContent = ok ? 'Listo para confirmar publicación' : 'Selecciona ⚿|⚑ + 🔳 o 𖣿 Favorito para habilitar 🆗';
}

function renderPalette() {
  $('palette').innerHTML = COLORS.map(c => `<button type="button" class="color-tile${pendingColor===c.v?' active':''}" data-c="${c.v}" title="${c.n}" style="--tile:${c.v};background:${c.v}"></button>`).join('');
  $('palette').querySelectorAll('.color-tile').forEach(b => b.addEventListener('click', () => { pendingColor = b.dataset.c; publishColor = b.dataset.c; renderPalette(); updatePublishState(); $('palette').classList.remove('open'); }));
}

function renderClassBtns() {
  const order = ['save', 'flag'];
  $('class-btns').innerHTML = order.map(k => { const m = CLASS_META[k]; return `<button type="button" class="csbtn${pendingClass===k?' sel':''}" data-cls="${k}" title="${m.l}"><span class="csflag" style="background:${m.c}"></span></button>`; }).join('');
  $('class-btns').style.display = 'flex';
  $('class-btns').querySelectorAll('.csbtn').forEach(b => b.addEventListener('click', () => { pendingClass = b.dataset.cls; publishType = b.dataset.cls; renderClassBtns(); renderPalette(); updatePublishState(); }));
}

function renderSaveMedia() {
  $('save-mprev').innerHTML = pendingMedia.map(m => `<div class="mitem" data-id="${m.id}"><img src="${m.url}" alt=""/><button class="mdel" type="button">✕</button></div>`).join('');
  $('save-mprev').querySelectorAll('.mitem').forEach(card => {
    card.querySelector('img')?.addEventListener('click', () => { $('lightbox-img').src = pendingMedia.find(x => x.id === card.dataset.id)?.url || ''; $('lightbox').classList.add('open'); });
    card.querySelector('.mdel')?.addEventListener('click', () => { pendingMedia = pendingMedia.filter(x => x.id !== card.dataset.id); renderSaveMedia(); });
  });
}

function handleFiles(files, store = false) {
  Array.from(files || []).forEach(file => {
    const ok = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!ok) return;
    const r = new FileReader();
    r.onload = () => {
      const item = { id: crypto.randomUUID(), name: file.name, type: file.type, url: r.result, createdAt: new Date().toISOString() };
      if (store) { mediaStore.unshift(item); svl(SK.media, mediaStore); renderMediaGrid(); toast('✓ Archivo almacenado (cifrado)'); } 
      else { pendingMedia.push(item); renderSaveMedia(); }
    };
    r.readAsDataURL(file);
  });
}

function savePlace() {
  if (!pendingPoint) return;
  if ($('q-save-act').classList.contains('disabled')) return;

  const title = $('q-title').value.trim() || 'Lugar sin título';
  const notes = $('q-notes').value.trim();
  const label = $('q-label').value.trim();
  const hashtag = $('q-hashtag')?.value.trim() || '';

  const now = new Date().toISOString();

  const item = {
    id: crypto.randomUUID(),
    title,
    notes,
    label,
    hashtag,
    lat: pendingPoint.lat,
    lng: pendingPoint.lng,
    color: pendingColor,
    media: [...pendingMedia],
    classification: pendingClass,
    vip: pendingVip,
    tagColor: pendingTagColor,
    createdAt: now,
    createdAtLabel: fmtDate(now)
  };

  places.unshift(item);
  saveAll();
  renderAll();
  clearSearchConfirmMarker();
  closeSaveModal();
  resetSaveForm();
  toast('✓ Lugar guardado');
  vibra();
  addNotif(`Nueva ubicación: "${title}"`, CLASS_META[pendingClass]?.e || '⚑');
}

// ─── GEOCODING ──────────────────────────────────────────────────
async function geocodeSearch(term) {
  const q = (term || '').trim();
  const res = $('search-results');
  if (!q) { res.classList.remove('open'); res.innerHTML = ''; return; }
  res.innerHTML = '<div class="sr-loading"><div class="dots"><span></span><span></span><span></span></div>&nbsp;buscando...</div>';
  res.classList.add('open');
  try {
    if (searchAbort) searchAbort.abort();
    searchAbort = new AbortController();
    const proximity = `${userLocation[0]},${userLocation[1]}`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${mapboxgl.accessToken}&limit=6&language=es&proximity=${proximity}`;
    const r = await fetch(url, { signal: searchAbort.signal });
    if (!r.ok) throw new Error('geocode http ' + r.status);
    const data = await r.json();
    const feats = data?.features || [];
    if (!feats.length) {
      res.innerHTML = '<div class="sr-empty">Sin resultados para "' + esc(q) + '"</div>';
      return;
    }
    res.innerHTML = feats.map((f, i) => {
      const [flng, flat] = f.center || [];
      const nearby = places.find(p => distM([flng, flat], [p.lng, p.lat]) < 40);
      const flagColor = nearby ? (nearby.customFlag?.color || CLASS_META[nearby.classification]?.c || nearby.color || '#888') : '';
      const flagHtml = flagColor ? `<span style="color:${flagColor}">⚑</span>` : `<span>⚑</span>`;
      return `<div class="sr" data-idx="${i}">
      ${flagHtml}<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(f.text||f.place_name||'')}</div><div style="font-size:10px;color:var(--text-muted);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(f.place_name||'')}</div></div>${nearby ? `<span class="sr-tag local" style="background:${flagColor}22;color:${flagColor}">GUARDADO</span>` : '<span class="sr-tag map">MAPA</span>'}</div>`;
    }).join('');
    res.querySelectorAll('.sr[data-idx]').forEach(item => item.addEventListener('click', () => {
      const f = feats[parseInt(item.dataset.idx)];
      if (!f) return;
      const [lng, lat] = f.center;
      map.flyTo({ center: [lng, lat], zoom: 17, pitch: BASE.pitch, bearing: BASE.bearing, duration: 900, essential: true });
      // Ocultar search PRIMERO, antes de crear la tarjeta de confirmación
      $('search-wrap').classList.remove('open');
      $('search-explore-btn').classList.remove('active');
      $('srch-lbl').textContent = '𝐒𝐄𝐀𝐑𝐂𝐇';
      $('mode-badge').classList.remove('show', 'explore');
      exploreMode = false;
      map.scrollZoom.disable();
      map.touchZoomRotate.disable();
      if (ctrlVisible) $('orbital').classList.remove('hidden');
      // Ahora sí crear la tarjeta de confirmación (ya no se borra)
      showSearchConfirmMarker(lng, lat, f.place_name || f.text || '');
    }));
  } catch (e) {
    if (e?.name === 'AbortError') return;
    res.innerHTML = '<div class="sr-empty">Error de búsqueda. Intenta de nuevo.</div>';
  }
}

async function reverseGeocode(lng, lat) {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}&language=es&limit=1`;
    const r = await fetch(url);
    if (!r.ok) return '';
    const data = await r.json();
    return data?.features?.[0]?.place_name || '';
  } catch (e) { return ''; }
}

// ─── SEARCH CONFIRM MARKER ─────────────────────────────────────
function clearSearchConfirmMarker() {
  if (searchConfirmMarker) { searchConfirmMarker.remove(); searchConfirmMarker = null; }
  searchConfirmPoint = null;
  searchConfirmAddress = '';
  const row = document.getElementById('sr-confirm');
  if (row) row.remove();
}

function showSearchConfirmMarker(lng, lat, address = '', placeId = null) {
  clearSearchConfirmMarker();
  searchConfirmPoint = { lng, lat };
  searchConfirmAddress = address || '';
  const el = document.createElement('div');
  el.className = 'search-confirm-marker';
  el.textContent = '📍';
  el.style.cursor = 'pointer';
  el.addEventListener('click', () => { openPhotoModal(lng, lat, address, placeId); });
  searchConfirmMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map);
  map.once('moveend', () => { try { if (searchConfirmMarker) searchConfirmMarker.setLngLat([lng, lat]); } catch (e) {} });
  const res = $('search-results');
  if (res) {
    res.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'sr-confirm';
    wrap.id = 'sr-confirm';
    wrap.style.cursor = 'pointer';
    wrap.innerHTML = `<div style="font-size:10px;color:var(--text-muted);line-height:1.5">📍 ${esc(address||'Ubicación marcada')}</div><button class="sr-confirm-btn" id="sr-confirm-btn">Ver lugar</button>`;
    res.appendChild(wrap);
    res.classList.add('open');
    wrap.addEventListener('click', () => { openPhotoModal(lng, lat, address, placeId); });
  }
}

// ─── LOCAL SEARCH ──────────────────────────────────────────────
function searchPlacesByTerm(term) {
  const q = (term || '').toLowerCase().trim();
  if (!q) return [];
  return places.filter(place => {
    const title = (place.title || '').toLowerCase();
    const notes = (place.notes || '').toLowerCase();
    const label = (place.label || '').toLowerCase();
    const hashtag = (place.hashtag || '').toLowerCase();
    return title.includes(q) || notes.includes(q) || label.includes(q) || hashtag.includes(q);
  });
}

function localSearch(term) {
  const results = searchPlacesByTerm(term);
  const res = $('search-results');
  if (!term.trim()) { res.classList.remove('open'); res.innerHTML = ''; return; }
  if (!results.length) { res.innerHTML = '<div class="sr-empty">Sin coincidencias en tus datos guardados.</div>'; res.classList.add('open'); return; }
  res.innerHTML = results.map(p => `<div class="sr sr-local" data-id="${p.id}"><span>⚑</span><div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:700;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(p.title)}</div><div style="font-size:10px;color:var(--text-muted)">${esc(p.notes||p.hashtag||'')}</div></div><span class="sr-tag local">LOCAL</span></div>`).join('');
  res.classList.add('open');
  res.querySelectorAll('[data-id]').forEach(item => item.addEventListener('click', () => {
    const p = results.find(x => x.id === item.dataset.id);
    if (!p) return;
    map.flyTo({ center: [p.lng, p.lat], zoom: 17, pitch: BASE.pitch, bearing: BASE.bearing, duration: 900, essential: true });
    setExplore(false);
    showSearchConfirmMarker(p.lng, p.lat, p.notes || p.title || '', p.id);
  }));
}

// ─── INIT SEARCH ───────────────────────────────────────────────
function initSearch() {
  const si1 = $('si1'),
        sc1 = $('sc1'),
        res = $('search-results');
  si1.addEventListener('input', () => {
    $('sb1').classList.toggle('has-text', si1.value.length > 0);
    armSearchIdle();
    clearTimeout(st1);
    if (searchMode === 'saved') {
      st1 = setTimeout(() => localSearch(si1.value), 250);
    } else {
      if (si1.value.trim().length < 3) { res.classList.remove('open'); res.innerHTML = ''; return; }
      st1 = setTimeout(() => geocodeSearch(si1.value.trim()), 450);
    }
  });
  si1.addEventListener('focus', clearSearchIdle);
  si1.addEventListener('blur', armSearchIdle);
  sc1.addEventListener('click', () => { si1.value = ''; $('sb1').classList.remove('has-text'); res.classList.remove('open'); res.innerHTML = ''; si1.focus(); clearSearchIdle(); });
  $('mode-toggle-icon').addEventListener('click', () => {
    setSearchMode(searchMode === 'address' ? 'saved' : 'address');
    clearSearchIdle();
    si1.focus();
  });
  document.addEventListener('click', e => {
    if (!$('search-wrap').contains(e.target) && e.target !== $('search-explore-btn')) {
      res.classList.remove('open');
      res.innerHTML = '';
      if (exploreMode) armSearchIdle();
    } else {
      clearSearchIdle();
    }
  });
}

// ─── PICK MODAL ────────────────────────────────────────────────
function renderPickFlags() {
  const el = $('pick-flags');
  let h = FLAG_ORDER.map(k => {
    const m = CLASS_META[k];
    return `<button type="button" class="pick-flag" data-cls="${k}" title="${m.l}"><span class="flagico" style="background:${m.c}"></span><span class="flaglbl">${m.l}</span></button>`;
  }).join('');
  h += `<button type="button" class="pick-flag" id="pick-flag-vip"><span class="flagico" style="background:transparent;clip-path:none;font-size:26px;display:flex;align-items:center;justify-content:center">𖣿</span><span class="flaglbl">VIP</span></button>`;
  el.innerHTML = h;
  el.querySelectorAll('.pick-flag[data-cls]').forEach(b => b.addEventListener('click', () => pickToSave(b.dataset.cls)));
  $('pick-flag-vip').addEventListener('click', () => {
    if (!pickPoint) return;
    const { lng, lat } = pickPoint;
    const addr = pickAddress;
    closePickModal();
    openPhotoModal(lng, lat, addr);
  });
}

function openPickModal(lng, lat) {
  pickPoint = { lng, lat };
  pickAddress = '';
  $('pick-name').textContent = 'Ubicación seleccionada';
  $('pick-addr').innerHTML = '<span class="pick-loading"><span class="dots"><span></span><span></span><span></span></span>&nbsp;buscando dirección...</span>';
  $('pick-coords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  renderPickFlags();
  $('pick-modal').classList.add('open');
  reverseGeocode(lng, lat).then(addr => {
    pickAddress = addr || '';
    if (!pickPoint || pickPoint.lng !== lng || pickPoint.lat !== lat) return;
    if (addr) {
      const parts = addr.split(',');
      $('pick-name').textContent = parts[0]?.trim() || addr;
      $('pick-addr').textContent = addr;
    } else {
      $('pick-name').textContent = 'Lugar sin nombre';
      $('pick-addr').textContent = 'No se encontró una dirección para este punto.';
    }
  });
}

function closePickModal() { $('pick-modal').classList.remove('open'); pickPoint = null; }

function pickToSave(classification) {
  if (!pickPoint) return;
  const { lng, lat } = pickPoint;
  const addr = pickAddress;
  pendingClass = classification;
  pendingColor = CLASS_META[classification]?.c || '#d4ff00';
  closePickModal();
  openSaveModal(lng, lat, addr);
}

// ─── PHOTO MODAL HUD ───────────────────────────────────────────
function findPlaceNear(lng, lat, tol = 0.0003) {
  return places.find(p => Math.abs(p.lng - lng) < tol && Math.abs(p.lat - lat) < tol) || null;
}

function hexToRgb(hex) {
  const v = (hex || '#4a4d51').replace('#', '');
  const n = parseInt(v.length === 6 ? v : '4a4d51', 16);
  if (Number.isNaN(n)) return [74, 77, 81];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

let pmCurrentClass = null;
let pmTagColor = null;

function renderPhotoFlags() {
  const el = $('photo-flags');
  if (!el) return;
  el.innerHTML = COLORS.map(c => {
    const isActive = pmTagColor === c.v;
    return `<div class="pm-tag${isActive ? ' active' : ''}" data-color="${c.v}" style="background:${c.v};--pm-glow:${c.v}"></div>`;
  }).join('');
  el.querySelectorAll('.pm-tag[data-color]').forEach(t => t.addEventListener('click', () => photoSetTagColor(t.dataset.color)));
}

function photoSetTagColor(color) {
  if (!photoPoint) return;
  pmTagColor = pmTagColor === color ? null : color;
  if (photoExistingId) {
    const p = places.find(x => x.id === photoExistingId);
    if (p) { p.tagColor = pmTagColor; saveAll(); renderAll(); }
  } else {
    pendingTagColor = pmTagColor;
  }
  renderPhotoFlags();
}

function syncPhotoModalState() {
  const dot = $('pm-active-dot');
  const text = $('pm-active-text');
  const cta = $('pm-save-cta');
  const saveBtn = $('photo-save-btn');
  const vipBtn = $('photo-vip-btn');
  if (!dot || !text || !cta || !saveBtn || !vipBtn) return;

  if (pmCurrentClass === 'save') {
    const m = CLASS_META.save;
    const [r,g,b] = hexToRgb(m.c);
    saveBtn.style.cssText = `background:rgba(${r},${g},${b},.1)!important;border:1.5px solid ${m.c}!important;color:${m.c}!important;box-shadow:0 0 10px rgba(${r},${g},${b},.4)!important`;
  } else {
    saveBtn.style.cssText = 'background:transparent!important;border:1.5px solid rgba(255,255,255,.07)!important;color:#555!important;box-shadow:none!important';
  }
  vipBtn.classList.toggle('active', pmCurrentClass === 'flag');

  if (pmCurrentClass) {
    const m = CLASS_META[pmCurrentClass];
    dot.style.background = m.c;
    text.style.color = m.c;
    text.textContent = m.l.toUpperCase();
  } else {
    dot.style.background = '#4a4d51';
    text.style.color = '#4a4d51';
    text.textContent = 'SIN ETIQUETA · OFF';
  }
  cta.classList.toggle('disabled', !pmCurrentClass);
}

function openPhotoModal(lng, lat, address = '', placeId = null) {
  photoPoint = { lng, lat };
  photoAddress = address || '';
  const existing = placeId ? places.find(p => p.id === placeId) : findPlaceNear(lng, lat);
  photoExistingId = existing ? existing.id : null;
  const name = existing?.title || (address ? address.split(',')[0].trim() : 'Lugar sin nombre');
  $('photo-name').textContent = name;
  $('photo-cat').textContent = address || 'Ubicación sin dirección';
  $('photo-meta').textContent = existing?.notes || '';
  pmCurrentClass = existing?.classification || null;
  pmTagColor = existing?.tagColor || null;
  renderPhotoFlags();
  syncPhotoModalState();
  $('photo-modal').classList.add('open');
}

function closePhotoModal() {
  $('photo-modal').classList.remove('open');
  photoPoint = null; photoExistingId = null; pmCurrentClass = null; pmTagColor = null;
}

function initPhotoDragHandle() {
  const handle = $('pm-drag-handle');
  const box = $('pm-box');
  if (!handle || !box) return;
  let startY = 0, dy = 0, dragging = false;

  const onDown = (clientY) => { dragging = true; startY = clientY; dy = 0; box.style.transition = 'none'; };
  const onMove = (clientY) => {
    if (!dragging) return;
    dy = Math.max(0, clientY - startY);
    box.style.transform = `translateY(${dy}px)`;
    box.style.opacity = String(1 - Math.min(dy / 220, .6));
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    box.style.transition = 'transform .2s ease, opacity .2s ease';
    if (dy > 70) {
      closePhotoModal();
    }
    box.style.transform = '';
    box.style.opacity = '';
  };

  handle.addEventListener('pointerdown', (e) => { e.preventDefault(); onDown(e.clientY); handle.setPointerCapture(e.pointerId); });
  handle.addEventListener('pointermove', (e) => onMove(e.clientY));
  handle.addEventListener('pointerup', () => { const wasTap = dy < 6; onUp(); if (wasTap) closePhotoModal(); });
  handle.addEventListener('pointercancel', onUp);
}

function photoSelectType(type) {
  if (!photoPoint) return;
  const next = pmCurrentClass === type ? null : type;
  pmCurrentClass = next;
  if (photoExistingId) {
    const p = places.find(x => x.id === photoExistingId);
    if (p) {
      p.classification = next;
      if (next) p.color = CLASS_META[next].c;
      p.vip = next === 'flag';
      saveAll(); renderAll();
      toast(next ? `✓ ${CLASS_META[next].l}` : 'Etiqueta quitada');
    }
  } else {
    pendingClass = next || 'save';
    pendingColor = next ? CLASS_META[next].c : '';
    pendingVip = next === 'flag';
  }
  syncPhotoModalState();
}

function photoToSave() {
  if (!photoPoint) return;
  if (photoExistingId) { openDetailModal(photoExistingId); closePhotoModal(); return; }
  const { lng, lat } = photoPoint;
  const addr = photoAddress;
  closePhotoModal();
  openSaveModal(lng, lat, addr);
}

// ─── ENCRYPT ────────────────────────────────────────────────────
function updateEncStatus() {
  const st = $('enc-status');
  if (placesLocked) {
    st.className = 'enc-status locked';
    st.textContent = '🔒 Datos cifrados — ingresa tu clave para desbloquear';
    $('enc-toggle').textContent = 'Desbloquear';
    $('enc-badge').style.display = 'flex';
  } else if (encKey) {
    st.className = 'enc-status unlocked';
    st.textContent = '🔓 Datos cifrados activos';
    $('enc-toggle').textContent = 'Desactivar cifrado';
    $('enc-badge').style.display = 'flex';
  } else {
    st.className = 'enc-status locked';
    st.textContent = '⚿ Datos sin cifrar';
    $('enc-toggle').textContent = 'Activar cifrado';
    $('enc-badge').style.display = 'none';
  }
}

function toggleEncrypt() {
  const key = $('enc-key').value.trim();
  if (!key) { toast('Ingresa una clave'); return; }

  if (placesLocked) {
    // Intentar desbloquear con la clave ingresada
    const raw = localStorage.getItem('fxmap.enc');
    const decrypted = raw ? decD(raw, key) : null;
    if (decrypted) {
      places = decrypted;
      encKey = key;
      placesLocked = false;
      renderAll();
      toast('🔓 Datos desbloqueados');
    } else {
      toast('❌ Clave incorrecta');
      return;
    }
  } else if (encKey) {
    // Desactivar cifrado: descifrar de vuelta a claro y borrar el blob cifrado
    svl(SK.places, places);
    localStorage.removeItem('fxmap.enc');
    encKey = null;
    toast('🔓 Cifrado desactivado, datos restaurados');
  } else {
    // Activar por primera vez: cifrar y BORRAR el dato en claro real
    const t = encD(places, key);
    if (t) {
      svl('fxmap.enc', t);
      localStorage.removeItem(SK.places);
      encKey = key;
      toast('✓ Datos cifrados AES-256');
    } else {
      toast('Error al cifrar');
      return;
    }
  }
  updateEncStatus();
  closeEncModal();
}

function openEncModal() { updateEncStatus(); $('enc-key').value = ''; $('enc-modal').classList.add('open'); }
function closeEncModal() { $('enc-modal').classList.remove('open'); }

// ─── SETTINGS ──────────────────────────────────────────────────
function syncCfgUI() { $('cfg-name').value = settings.name || ''; $('cfg-phone').value = settings.phone || ''; $('cfg-tg').value = settings.telegram || ''; $('cfg-api').value = settings.apikey || ''; $('cfg-radius').value = settings.radius || 500; }

function saveSettings() {
  const p = $('cfg-privpass').value.trim();
  settings = { ...settings, name: $('cfg-name').value.trim(), phone: $('cfg-phone').value.trim(), telegram: $('cfg-tg').value.trim(), apikey: $('cfg-api').value.trim(), radius: parseInt($('cfg-radius').value) || 500 };
  if (p) settings.privPass = p;
  svl(SK.settings, settings);
  toast('✓ Configuración guardada');
}

// ─── SOS ────────────────────────────────────────────────────────
function openSOS() {
  const c = map.getCenter();
  const msg = `🆘 Estoy en peligro, por favor búscame.\nUbicación: https://maps.google.com/?q=${c.lat.toFixed(6)},${c.lng.toFixed(6)}\nCoordenadas: ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}\n— FX MAP CYBER`;
  $('sos-loc').textContent = `⚐ ${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
  $('sos-modal').classList.add('open');
  const enc = encodeURIComponent(msg);
  const ph = (settings.phone || '').replace(/\D/g, '');
  const tg = settings.telegram || '';
  $('sos-wa').onclick = () => { window.open(ph ? `https://wa.me/${ph}?text=${enc}` : `https://wa.me/?text=${enc}`, '_blank', 'noopener'); addNotif('🆘 SOS enviado vía WhatsApp', '🆘'); };
  $('sos-tg').onclick = () => { window.open(tg ? `https://t.me/${tg.replace('@','')}?text=${enc}` : `https://t.me/share/url?url=${encodeURIComponent(c.lat.toFixed(6)+','+c.lng.toFixed(6))}&text=${enc}`, '_blank', 'noopener'); addNotif('🆘 SOS enviado vía Telegram', '🆘'); };
  $('sos-sms').onclick = () => { location.href = `sms:${ph}?body=${enc}`; addNotif('🆘 SOS enviado vía SMS', '🆘'); };
}

function closeSOS() { $('sos-modal').classList.remove('open'); }

// ─── REFRESH ────────────────────────────────────────────────────
function doRefresh() {
  vibra();
  renderAll();
  renderConnList();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      userLocation = [pos.coords.longitude, pos.coords.latitude];
      renderConnList();
      toast('↺ Ubicación actualizada');
    }, () => { toast('↺ Datos recargados'); }, { enableHighAccuracy: true, timeout: 4000 });
  } else {
    toast('↺ Datos recargados');
  }
}

// ─── PANELS ────────────────────────────────────────────────────
function closeAll() {
  $('settings-drawer').classList.remove('open');
  $('notif-panel').classList.remove('open');
  $('media-panel').classList.remove('open');
  $('overlay').classList.remove('show');
}

function openPanel(id) { closeAll(); closeMenuModal(); $(id).classList.add('open'); $('overlay').classList.add('show'); }

function openMenuModal() { closeAll(); $('menu-panel').classList.add('open'); $('overlay-menu').classList.add('show'); }
function closeMenuModal() { $('menu-panel').classList.remove('open'); $('overlay-menu').classList.remove('show'); }

// ─── EXPORT / IMPORT ──────────────────────────────────────────
function exportJson() {
  const b = new Blob([JSON.stringify({ places, routes, labels, meta: { exportedAt: new Date().toISOString(), v: 'X11' } }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(b);
  a.download = `fxmap-x11-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importJson(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const p = JSON.parse(r.result);
      if (p.places && Array.isArray(p.places)) places = p.places;
      else if (Array.isArray(p)) places = p;
      if (p.routes) routes = p.routes;
      saveAll();
      renderAll();
      toast(`✓ ${places.length} lugares importados`);
    } catch { toast('Archivo inválido'); }
  };
  r.readAsText(file);
}

   // ─── BIND ALL ──────────────────────────────────────────────────
function bindAll() {
  // D-PAD
  $('dp-up').addEventListener('mousedown', () => startHold('up'));
  $('dp-up').addEventListener('touchstart', e => { e.preventDefault(); startHold('up'); }, { passive: false });
  $('dp-dn').addEventListener('mousedown', () => startHold('dn'));
  $('dp-dn').addEventListener('touchstart', e => { e.preventDefault(); startHold('dn'); }, { passive: false });
  $('dp-lt').addEventListener('mousedown', () => startHold('lt'));
  $('dp-lt').addEventListener('touchstart', e => { e.preventDefault(); startHold('lt'); }, { passive: false });
  $('dp-rt').addEventListener('mousedown', () => startHold('rt'));
  $('dp-rt').addEventListener('touchstart', e => { e.preventDefault(); startHold('rt'); }, { passive: false });
  $('ctrl-a').addEventListener('click', () => setCtrlMode('zoom'));
  $('ctrl-b').addEventListener('click', () => setCtrlMode('tilt'));
  $('dp-home').addEventListener('click', centerUser);
  $('btn-toggle').addEventListener('click', toggleCtrlVisible);

  // SEARCH
  $('search-explore-btn').addEventListener('click', () => setExplore(!exploreMode));

  // RIGHT COL
  $('btn-enc').addEventListener('click', openEncModal);
  $('btn-refresh').addEventListener('click', doRefresh);
  $('btn-notif').addEventListener('click', () => { renderNotifList(); openPanel('notif-panel'); });
  $('btn-menu').addEventListener('click', openMenuModal);
  $('btn-brand').addEventListener('click', requestFxAccess);
  $('fx-auth-submit').addEventListener('click', submitFxPassword);
  $('fx-auth-pass').addEventListener('keydown', e => { if (e.key === 'Enter') submitFxPassword(); });
  $('fx-auth-bio').addEventListener('click', attemptBiometricUnlock);
  $('fx-auth-cancel').addEventListener('click', closeFxAuth);
  $('fx-auth-modal').addEventListener('click', e => { if (e.target.id === 'fx-auth-modal') closeFxAuth(); });
  $('sos-btn').addEventListener('click', openSOS);
  $('settings-btn').addEventListener('click', () => { openPanel('settings-drawer'); renderBoard(); });

  // PANEL CLOSES
  $('notif-close').addEventListener('click', closeAll);
  $('media-close').addEventListener('click', closeAll);
  $('drawer-close').addEventListener('click', closeAll);
  $('drawer-handle').addEventListener('click', e => { if (e.target === $('drawer-handle') || e.target.classList.contains('drawer-bar')) closeAll(); });
  $('overlay').addEventListener('click', closeAll);

  // MENU MODAL - CORREGIDO
  $('menu-close').addEventListener('click', closeMenuModal);
  $('overlay-menu').addEventListener('click', closeMenuModal);

  // ─── MENU TABS - CORREGIDO ───
  document.querySelectorAll('.ptab').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Remover active de todos los tabs
      document.querySelectorAll('.ptab').forEach(x => x.classList.remove('active'));
      // Activar este tab
      this.classList.add('active');
      // Ocultar todos los paneles
      document.querySelectorAll('.ppane').forEach(x => x.classList.remove('active'));
      // Mostrar el panel correspondiente
      const target = this.dataset.pt;
      const pane = document.getElementById(`pp-${target}`);
      if (pane) pane.classList.add('active');
      if (target === 'vip') renderVipList();
    });
  });

  // ─── NOTIFY CLEAR ───
  $('notif-clear').addEventListener('click', () => { notifications.forEach(n => n.read = true); svl(SK.notifs, notifications); renderNotifBadge(); renderNotifList(); toast('Notificaciones limpiadas'); });

  // ─── ENCRYPT ───
  $('enc-toggle').addEventListener('click', toggleEncrypt);
  $('enc-cancel').addEventListener('click', closeEncModal);
  $('enc-modal').addEventListener('click', e => { if (e.target.id === 'enc-modal') closeEncModal(); });

  // ─── SAVE MODAL ───
  $('q-save-act').addEventListener('click', () => { if ($('q-save-act').classList.contains('disabled')) return; savePlace(); });
  $('q-cancel').addEventListener('click', () => { closeSaveModal(); resetSaveForm(); clearSearchConfirmMarker(); });
  $('save-close').addEventListener('click', () => { closeSaveModal(); resetSaveForm(); clearSearchConfirmMarker(); });
  $('save-modal').addEventListener('click', e => { if (e.target.id === 'save-modal') { closeSaveModal(); resetSaveForm(); clearSearchConfirmMarker(); } });
  $('act-label').addEventListener('click', () => { const l = $('q-label'); l.style.display = l.style.display === 'none' ? '' : 'none'; if (l.style.display !== 'none') l.focus(); });
  $('act-color').addEventListener('click', () => { $('palette').classList.toggle('open'); });
  $('act-copy-addr').addEventListener('click', async () => { const txt = $('q-title').value.trim() || searchConfirmAddress || ''; if (!txt) return toast('Sin dirección'); try { await navigator.clipboard.writeText(txt); toast('Dirección copiada'); } catch (e) { toast('No se pudo copiar'); } });
  $('act-share-note').addEventListener('click', async () => { const payload = `${$('q-title').value.trim()||searchConfirmAddress||'Ubicación'}\n${$('q-notes').value.trim()||''}\n${$('q-coords-chip').textContent||''}`.trim(); try { if (navigator.share) { await navigator.share({ title: 'FX MAP location', text: payload }); } else { await navigator.clipboard.writeText(payload); } toast('Nota compartida'); } catch (e) { toast('Acción cancelada'); } });
  $('q-notes').addEventListener('input', () => { $('save-hero-note').textContent = '"' + (($('q-notes').value || 'Algún comentario').slice(0, 48)) + '"'; });
  $('q-title').addEventListener('input', () => { $('save-addr-preview').textContent = ($('q-title').value || 'Dirección seleccionada').slice(0, 80); });
  $('q-title-ok').addEventListener('click', () => $('q-title').blur());
  $('q-title-del').addEventListener('click', () => { $('q-title').value = ''; $('save-addr-preview').textContent = 'Dirección seleccionada'; });
  $('q-hashtag-ok').addEventListener('click', () => { $('q-hashtag').blur(); });
  $('q-hashtag-del').addEventListener('click', () => { $('q-hashtag').value = ''; });
  $('q-notes-ok').addEventListener('click', () => $('q-notes').blur());
  $('q-notes-del').addEventListener('click', () => { $('q-notes').value = ''; $('save-hero-note').textContent = '"Algún comentario"'; });
  updatePublishState();

  // ─── MEDIA UPLOAD ───
  const gi = document.createElement('input');
  gi.type = 'file';
  gi.accept = 'image/*,video/*';
  gi.multiple = true;
  gi.style.display = 'none';
  document.body.appendChild(gi);
  $('tool-media').addEventListener('click', () => gi.click());
  gi.addEventListener('change', e => handleFiles(e.target.files));

  // ─── LOC POPUP ACTIONS ───
  $('loc-popup').querySelectorAll('.loc-act[data-ac]').forEach(btn => btn.addEventListener('click', () => {
    if (!locPopupCoords) return;
    const ac = btn.dataset.ac;
    pendingClass = ac;
    pendingColor = CLASS_META[ac]?.c || '#d4ff00';
    const coords = locPopupCoords;
    clearLocPopup();
    reverseGeocode(coords[0], coords[1]).then(addr => openSaveModal(coords[0], coords[1], addr || ''));
  }));
  $('loc-x').addEventListener('click', clearLocPopup);

  // ─── SOS - CORREGIDO ───
  $('sos-cancel').addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    closeSOS();
  });
  $('sos-modal').addEventListener('click', function(e) {
    if (e.target === this || e.target.id === 'sos-modal') {
      closeSOS();
    }
  });

  // ─── CONFIRM ───
  $('confirm-del').addEventListener('click', doDel);
  $('confirm-cancel').addEventListener('click', () => { pendingDelId = null; $('confirm-modal').classList.remove('open'); });
  $('confirm-modal').addEventListener('click', e => { if (e.target.id === 'confirm-modal') { pendingDelId = null; $('confirm-modal').classList.remove('open'); } });

  // ─── DETAIL MODAL ───
  $('dm-close').addEventListener('click', closeDetailModal);
  $('detail-modal').addEventListener('click', e => { if (e.target.id === 'detail-modal') closeDetailModal(); });
  $('dm-save').addEventListener('click', saveDetailModal);
  $('dm-flyto').addEventListener('click', () => { if (detailPlaceId) { flyTo(detailPlaceId); closeDetailModal(); } });
  $('dm-delete').addEventListener('click', () => { if (detailPlaceId) { closeDetailModal(); confirmDel(detailPlaceId); } });
  $('dm-vip-btn').addEventListener('click', () => {
    const p = places.find(x => x.id === detailPlaceId);
    if (!p) return;
    p.vip = !p.vip;
    saveAll(); renderAll();
    $('dm-vip-btn').classList.toggle('active', !!p.vip);
    toast(p.vip ? '𖣿 Agregado a VIP' : 'Quitado de VIP');
  });
  $('dm-flag-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const p = places.find(x => x.id === detailPlaceId);
    if (!p) return;
    document.querySelectorAll('.flag-pop').forEach(el => el.remove());
    const pop = buildFlagPopover();
    pop.style.top = '38px';
    pop.style.left = '0';
    $('dm-flag-btn').appendChild(pop);
    wireFlagPopover(pop,
      (cls) => { p.classification = cls; if (cls) p.color = CLASS_META[cls].c; p.vip = cls === 'flag' ? p.vip : p.vip; saveAll(); renderAll(); updateDetailFlagBtn(p); },
      (color, label) => { p.color = color; p.customFlag = { color, label }; saveAll(); renderAll(); updateDetailFlagBtn(p); }
    );
  });

  // ─── LIGHTBOX ───
  $('lightbox').addEventListener('click', () => $('lightbox').classList.remove('open'));

  // ─── AI ───
  $('btn-ai').addEventListener('click', runAI);
  document.querySelectorAll('.ai-chip[data-q]').forEach(c => c.addEventListener('click', () => { $('ai-prompt').value = c.dataset.q; runAI(); }));

  // ─── CONFIG ───
  $('cfg-save').addEventListener('click', saveSettings);
  $('btn-export').addEventListener('click', exportJson);
  $('btn-import').addEventListener('change', e => importJson(e.target.files[0]));

  // ─── NEW ROUTE ───
  $('btn-new-route').addEventListener('click', () => {
    const name = prompt('Nombre de la nueva ruta:');
    if (!name) return;
    const si = prompt('Paradas (separadas por coma):');
    const stops = si ? si.split(',').map(s => s.trim()).filter(Boolean) : [];
    routes.unshift({ id: crypto.randomUUID(), name, stops, createdAt: new Date().toISOString() });
    saveAll();
    renderAll();
    toast('✓ Ruta creada');
  });

  // ─── PRIVATE ───
  $('priv-unlock').addEventListener('click', () => {
    const p = $('priv-pass').value;
    if (p === settings.privPass) {
      privUnlocked = true;
      $('priv-lock-screen').style.display = 'none';
      $('priv-content').classList.add('unlocked');
      renderPrivate();
      toast('✓ Acceso concedido');
    } else toast('❌ Contraseña incorrecta');
  });
  $('priv-pass').addEventListener('keydown', e => { if (e.key === 'Enter') $('priv-unlock').click(); });
  $('priv-lock-btn').addEventListener('click', () => {
    privUnlocked = false;
    $('priv-lock-screen').style.display = '';
    $('priv-content').classList.remove('unlocked');
    $('priv-pass').value = '';
    toast('🔒 Cajón bloqueado');
  });

  // ─── MEDIA UPLOAD ───
  $('media-upload-input').addEventListener('change', e => handleFiles(e.target.files, true));

  // ─── MEDIA CATS ───
  document.querySelectorAll('.mcat').forEach(c => c.addEventListener('click', function() {
    document.querySelectorAll('.mcat').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    mediaFilter = this.dataset.mc || 'all';
    renderMediaGrid();
  }));

  // ─── MEDIA SECTIONS (Multimedia / Notas) ───
  document.querySelectorAll('.msec').forEach(s => s.addEventListener('click', function() {
    document.querySelectorAll('.msec').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    document.querySelectorAll('.media-section-pane').forEach(p => p.classList.remove('active'));
    $('sec-' + this.dataset.sec).classList.add('active');
    if (this.dataset.sec === 'notas') renderNotesFolder();
  }));

  $('notes-folder-open').addEventListener('click', () => {
    $('notes-folder-view').style.display = 'none';
    $('notes-list-view').style.display = 'flex';
    renderNotesList();
  });
  $('notes-back-btn').addEventListener('click', () => {
    $('notes-list-view').style.display = 'none';
    $('notes-folder-view').style.display = 'block';
    renderNotesFolder();
  });
  $('btn-new-note').addEventListener('click', () => openNoteEditor(null));
  $('note-edit-cancel').addEventListener('click', closeNoteEditor);
  $('note-edit-save').addEventListener('click', saveNoteEditor);
  $('note-editor-modal').addEventListener('click', (e) => { if (e.target.id === 'note-editor-modal') closeNoteEditor(); });

  // ─── LONG PRESS ───
  const mapElement = $('map');
  let lastTouchTime = 0;
  mapElement.addEventListener('touchstart', (e) => { lastTouchTime = Date.now(); onPressStart(e); }, { passive: true });
  mapElement.addEventListener('touchmove', onPressMove, { passive: true });
  mapElement.addEventListener('touchend', onPressEnd);
  mapElement.addEventListener('touchcancel', onPressEnd);
  mapElement.addEventListener('mousedown', (e) => { if (Date.now() - lastTouchTime < 800) return; onPressStart(e); });
  mapElement.addEventListener('mousemove', onPressMove);
  mapElement.addEventListener('mouseup', onPressEnd);

  // ─── MAP DBLCLICK — abre pick modal en modo exploración ───
  map.on('dblclick', function(e) {
    if (!exploreMode) return;
    e.preventDefault();
    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    openPickModal(lng, lat);
  });

  // ─── PICK MODAL ───
  $('pick-x').addEventListener('click', closePickModal);
  $('pick-modal').addEventListener('click', function(e) {
    if (e.target === this || e.target.id === 'pick-modal') {
      closePickModal();
    }
  });

  // ─── PHOTO MODAL ───
  initPhotoDragHandle();
  $('photo-save-btn').addEventListener('click', () => photoSelectType('save'));
  $('photo-vip-btn').addEventListener('click', () => photoSelectType('flag'));
  $('pm-save-cta').addEventListener('click', photoToSave);
  $('photo-modal').addEventListener('click', function(e) {
    if (e.target === this || e.target.id === 'photo-modal') {
      closePhotoModal();
    }
  });

  // ─── DRAWER TABS ───
  document.querySelectorAll('.dtab').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.dtab').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.dpane').forEach(x => x.classList.remove('active'));
      const target = this.dataset.dt;
      const pane = document.getElementById(`dp-${target}`);
      if (pane) pane.classList.add('active');
      if (target === 'board') renderBoard();
    });
  });

  // ─── ESC ───
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // Cerrar modales
      ['enc-modal', 'lightbox', 'confirm-modal', 'sos-modal', 'pick-modal', 'photo-modal'].forEach(id => {
        const el = $(id);
        if (el) el.classList.remove('open');
      });
      if ($('detail-modal')?.style.display === 'flex') closeDetailModal();
      if ($('save-modal')?.classList.contains('open')) {
        closeSaveModal();
        resetSaveForm();
        clearSearchConfirmMarker();
      }
      if ($('menu-panel')?.classList.contains('open')) closeMenuModal();
      closeAll();
    }
  });

  // ─── Cierra palette pop al hacer clic fuera ───
  document.addEventListener('click', function(e) {
    if (!e.target.closest('#act-color')) {
      const palette = $('palette');
      if (palette) palette.classList.remove('open');
    }
  });

  setSearchMode('address');

  // ─── FIX: teclado iOS tapa inputs en modales position:fixed ───
  const keyboardSafeInputs = ['q-title', 'q-notes', 'q-label', 'q-hashtag', 'note-edit-title', 'note-edit-body', 'dm-title', 'dm-notes', 'fx-auth-pass', 'enc-key'];
  keyboardSafeInputs.forEach(id => {
    const el = $(id);
    if (!el) return;
    const modal = el.closest('[id$="-modal"]');
    el.addEventListener('focus', () => {
      if (!modal) return;
      modal.style.alignItems = 'flex-start';
      modal.style.paddingTop = '32px';
      modal.style.overflowY = 'auto';
    });
    el.addEventListener('blur', () => {
      if (!modal) return;
      modal.style.alignItems = '';
      modal.style.paddingTop = '';
      modal.style.overflowY = '';
    });
  });
}

// ─── MAP EVENTS ──────────────────────────────────────────────────
map.on('style.load', () => {
  try {
    map.setFog({
      color: 'rgb(10,12,20)',
      'high-color': 'rgb(26,31,48)',
      'horizon-blend': 0.07,
      'space-color': 'rgb(4,6,10)',
      'star-intensity': 0
    });
  } catch (e) {}
});

map.on('load', () => {
  map.easeTo({ center: BASE.center, zoom: BASE.zoom, pitch: BASE.pitch, bearing: BASE.bearing, duration: 0, essential: true });

  try {
    map.setConfigProperty('basemap', 'lightPreset', 'night');
    map.setConfigProperty('basemap', 'show3dObjects', true);
    map.setConfigProperty('basemap', 'showPlaceLabels', false);
    map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
    map.setConfigProperty('basemap', 'showRoadLabels', false);
    map.setConfigProperty('basemap', 'showTransitLabels', false);
  } catch (e) {}

  // Geolocate control (oculto)
  const geo = new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
    showAccuracyCircle: false
  });
  map.addControl(geo, 'bottom-right');
  geo.on('geolocate', e => { userLocation = [e.coords.longitude, e.coords.latitude]; });
  setTimeout(() => {
    const gc = document.querySelector('.mapboxgl-ctrl-geolocate');
    if (gc) gc.style.display = 'none';
  }, 600);

  ensureBuildingHighlightLayers();
  loadAll();
  renderAll();
  renderPalette();
  renderClassBtns();
  initSearch();
  bindAll();
  updateEncStatus();
  if (placesLocked) {
    setTimeout(() => { openEncModal(); toast('🔒 Tus lugares están cifrados — ingresa tu clave'); }, 400);
  }

  map.on('moveend', () => { if (buildingHighlightReady) renderMarkers(); });
  map.on('zoomend', () => { if (buildingHighlightReady) renderMarkers(); });
});

// ─── INICIALIZACIÓN ──────────────────────────────────────────────
console.log('FX MAP X11 — CYBERPUNK NEON — Cargado correctamente 🚀');
