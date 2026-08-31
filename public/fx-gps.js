(() => {
  'use strict';

  const FX_GPS = {
    map: null,
    marker: null,
    markerEl: null,
    lastPosition: null,
    lastAddress: 'Ubicación actual',
    lastGeocodeAt: 0,
    lastGeocodePoint: null,
    watchId: null,
    started: false,
    db: null
  };

  // Capture the Mapbox map instance without touching the existing app code.
  if (window.mapboxgl && mapboxgl.Map && !window.__fxMapboxCaptured) {
    window.__fxMapboxCaptured = true;
    const OriginalMap = mapboxgl.Map;
    mapboxgl.Map = new Proxy(OriginalMap, {
      construct(target, args, newTarget) {
        const instance = Reflect.construct(target, args, newTarget);
        window.__fxMapInstance = instance;
        return instance;
      }
    });
  }

  const CSS = `
    .fx-gps-marker{display:flex;flex-direction:column;align-items:center;gap:5px;cursor:pointer;user-select:none;-webkit-user-select:none;transform:translateZ(0)}
    .fx-gps-face-wrap{position:relative;width:58px;height:58px;border-radius:50%;display:grid;place-items:center}
    .fx-gps-face-wrap::before,.fx-gps-face-wrap::after{content:'';position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(0,134,223,.48);box-shadow:0 0 18px rgba(0,134,223,.28);animation:fxGpsPulse 2.2s ease-out infinite}
    .fx-gps-face-wrap::after{inset:-13px;border-color:rgba(0,134,223,.2);animation-delay:1.1s}
    .fx-gps-face{position:relative;z-index:2;width:52px;height:52px;border-radius:50%;object-fit:cover;background:#10131a;border:2px solid rgba(255,255,255,.9);box-shadow:0 5px 18px rgba(0,0,0,.55),0 0 20px rgba(0,134,223,.25);display:none}
    .fx-gps-face-fallback{position:relative;z-index:2;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 50% 35%,#1c2531,#080b10 72%);border:2px solid rgba(255,255,255,.9);box-shadow:0 5px 18px rgba(0,0,0,.55),0 0 20px rgba(0,134,223,.25);font-size:30px}
    .fx-gps-accuracy{position:relative;z-index:3;min-width:48px;height:20px;padding:0 7px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(6,8,12,.92);border:1px solid rgba(0,134,223,.35);color:#9fd9ff;font:800 10px/1 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;letter-spacing:.03em;box-shadow:0 4px 12px rgba(0,0,0,.35);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
    .fx-gps-accuracy.good{color:#70e59a;border-color:rgba(78,207,122,.42)}
    .fx-gps-accuracy.mid{color:#f5cf58;border-color:rgba(245,207,88,.42)}
    .fx-gps-accuracy.poor{color:#ff8d8d;border-color:rgba(255,59,59,.42)}
    @keyframes fxGpsPulse{0%{transform:scale(.78);opacity:.72}70%,100%{transform:scale(1.35);opacity:0}}

    #fx-gps-card{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:1000;max-width:390px;margin:0 auto;padding:16px;border-radius:22px;background:rgba(7,9,15,.94);border:1px solid rgba(255,255,255,.1);box-shadow:0 22px 60px rgba(0,0,0,.56),0 0 0 1px rgba(0,134,223,.04) inset;backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);color:#fff;display:none;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif}
    #fx-gps-card.show{display:block;animation:fxGpsCardIn .22s cubic-bezier(.22,1,.36,1)}
    @keyframes fxGpsCardIn{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:none}}
    .fx-gps-head{display:flex;align-items:center;gap:12px;margin-bottom:13px}
    .fx-gps-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;background:#111722;border:1px solid rgba(255,255,255,.12);display:none}
    .fx-gps-avatar-fallback{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:#111722;border:1px solid rgba(255,255,255,.12);font-size:26px}
    .fx-gps-head-copy{min-width:0;flex:1}.fx-gps-title{font-size:14px;font-weight:900;letter-spacing:.01em}.fx-gps-sub{margin-top:3px;color:#7f8a99;font-size:10px;font-weight:700}
    .fx-gps-close{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#9aa4b2;font-size:18px}
    .fx-gps-location{padding:12px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.07);cursor:pointer}
    .fx-gps-address{font-size:12px;line-height:1.45;font-weight:800;color:#f1f5f9}.fx-gps-coords{margin-top:5px;font:700 10px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#748093}.fx-gps-copyhint{margin-top:7px;font-size:9px;color:#0086df;font-weight:900;letter-spacing:.1em;text-transform:uppercase}
    .fx-gps-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.fx-gps-stat{padding:10px 11px;border-radius:12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06)}.fx-gps-stat b{display:block;font-size:12px;color:#fff}.fx-gps-stat span{display:block;margin-top:3px;color:#697586;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
    .fx-gps-photo-row{display:grid;grid-template-columns:72px 1fr;gap:10px;margin-top:10px}.fx-gps-photo{width:72px;height:72px;border-radius:13px;object-fit:cover;background:#0d1118;border:1px solid rgba(255,255,255,.08);display:none}.fx-gps-photo-empty{width:72px;height:72px;border-radius:13px;display:grid;place-items:center;background:#0d1118;border:1px dashed rgba(255,255,255,.13);color:#4f5b69;font-size:22px}.fx-gps-photo-copy{display:flex;flex-direction:column;justify-content:center}.fx-gps-photo-copy strong{font-size:11px}.fx-gps-photo-copy span{margin-top:4px;color:#697586;font-size:9px;line-height:1.35}
    .fx-gps-actions{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:12px}.fx-gps-btn{height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.045);color:#e7edf5;font-size:10px;font-weight:900;letter-spacing:.02em}.fx-gps-btn.primary{background:#0086df;border-color:#0086df;color:#fff}.fx-gps-btn:active{transform:scale(.97)}
    .fx-gps-hidden-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
    .fx-gps-toast{position:fixed;left:50%;bottom:calc(132px + env(safe-area-inset-bottom,0px));z-index:1200;transform:translateX(-50%) translateY(8px);padding:9px 12px;border-radius:10px;background:rgba(7,9,15,.95);border:1px solid rgba(0,134,223,.24);color:#dcecff;font-size:10px;font-weight:800;opacity:0;pointer-events:none;transition:.18s}.fx-gps-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
    @media(max-width:430px){#fx-gps-card{max-width:none}.fx-gps-actions{grid-template-columns:1fr 1fr}.fx-gps-btn.primary{grid-column:span 2}}
    @media(prefers-reduced-motion:reduce){.fx-gps-face-wrap::before,.fx-gps-face-wrap::after{animation:none}#fx-gps-card.show{animation:none}}
  `;

  function injectCss() {
    if (document.getElementById('fx-gps-style')) return;
    const style = document.createElement('style');
    style.id = 'fx-gps-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function openDb() {
    if (FX_GPS.db) return Promise.resolve(FX_GPS.db);
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('fx-map-gps', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
      };
      request.onsuccess = () => { FX_GPS.db = request.result; resolve(FX_GPS.db); };
      request.onerror = () => reject(request.error);
    });
  }

  async function dbSet(key, value) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction('media', 'readwrite');
        tx.objectStore('media').put(value, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
  }

  async function dbGet(key) {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('media', 'readonly');
        const req = tx.objectStore('media').get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) { return null; }
  }

  function todayKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function toObjectUrl(blob) {
    if (!blob) return null;
    return URL.createObjectURL(blob);
  }

  function buildMarker() {
    const el = document.createElement('div');
    el.className = 'fx-gps-marker';
    el.innerHTML = `
      <div class="fx-gps-face-wrap">
        <img class="fx-gps-face" alt="Memoji" />
        <div class="fx-gps-face-fallback">🙂</div>
      </div>
      <div class="fx-gps-accuracy">± -- m</div>
    `;
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      showCard();
    });
    FX_GPS.markerEl = el;
    return el;
  }

  function buildCard() {
    if (document.getElementById('fx-gps-card')) return;
    const card = document.createElement('section');
    card.id = 'fx-gps-card';
    card.setAttribute('aria-label', 'Mi ubicación GPS');
    card.innerHTML = `
      <div class="fx-gps-head">
        <img class="fx-gps-avatar" id="fx-gps-avatar" alt="Memoji" />
        <div class="fx-gps-avatar-fallback" id="fx-gps-avatar-fallback">🙂</div>
        <div class="fx-gps-head-copy"><div class="fx-gps-title">Mi ubicación</div><div class="fx-gps-sub" id="fx-gps-time">Esperando GPS…</div></div>
        <button class="fx-gps-close" id="fx-gps-close" type="button">×</button>
      </div>
      <div class="fx-gps-location" id="fx-gps-copy">
        <div class="fx-gps-address" id="fx-gps-address">Esperando ubicación precisa…</div>
        <div class="fx-gps-coords" id="fx-gps-coords">--</div>
        <div class="fx-gps-copyhint">Toca para copiar ubicación</div>
      </div>
      <div class="fx-gps-stats">
        <div class="fx-gps-stat"><b id="fx-gps-accuracy-card">± -- m</b><span>Precisión GPS</span></div>
        <div class="fx-gps-stat"><b id="fx-gps-speed">--</b><span>Velocidad</span></div>
      </div>
      <div class="fx-gps-photo-row">
        <img class="fx-gps-photo" id="fx-gps-photo" alt="Foto de hoy" />
        <div class="fx-gps-photo-empty" id="fx-gps-photo-empty">＋</div>
        <div class="fx-gps-photo-copy"><strong>Foto de hoy</strong><span>Se guarda sólo en este dispositivo y cambia por fecha.</span></div>
      </div>
      <div class="fx-gps-actions">
        <button class="fx-gps-btn" id="fx-gps-center" type="button">Centrar</button>
        <button class="fx-gps-btn" id="fx-gps-memoji" type="button">Memoji</button>
        <button class="fx-gps-btn" id="fx-gps-photo-btn" type="button">Foto hoy</button>
        <button class="fx-gps-btn" id="fx-gps-shortcut" type="button">Atajo</button>
        <button class="fx-gps-btn primary" id="fx-gps-message" type="button">iMessage</button>
      </div>
      <input class="fx-gps-hidden-input" id="fx-gps-memoji-input" type="file" accept="image/*" />
      <input class="fx-gps-hidden-input" id="fx-gps-photo-input" type="file" accept="image/*" capture="environment" />
    `;
    document.body.appendChild(card);

    const toast = document.createElement('div');
    toast.className = 'fx-gps-toast';
    toast.id = 'fx-gps-toast';
    document.body.appendChild(toast);

    document.getElementById('fx-gps-close').addEventListener('click', hideCard);
    document.getElementById('fx-gps-copy').addEventListener('click', copyLocation);
    document.getElementById('fx-gps-center').addEventListener('click', centerOnMe);
    document.getElementById('fx-gps-message').addEventListener('click', openMessage);
    document.getElementById('fx-gps-shortcut').addEventListener('click', runShortcut);
    document.getElementById('fx-gps-memoji').addEventListener('click', () => document.getElementById('fx-gps-memoji-input').click());
    document.getElementById('fx-gps-photo-btn').addEventListener('click', () => document.getElementById('fx-gps-photo-input').click());
    document.getElementById('fx-gps-photo-empty').addEventListener('click', () => document.getElementById('fx-gps-photo-input').click());
    document.getElementById('fx-gps-memoji-input').addEventListener('change', onMemojiSelected);
    document.getElementById('fx-gps-photo-input').addEventListener('change', onDailyPhotoSelected);
  }

  function toast(text) {
    const el = document.getElementById('fx-gps-toast');
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 1500);
  }

  async function onMemojiSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    await dbSet('memoji', file);
    applyMemoji(file);
    toast('Memoji actualizado');
    event.target.value = '';
  }

  async function onDailyPhotoSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    await dbSet(`daily:${todayKey()}`, file);
    applyDailyPhoto(file);
    toast('Foto de hoy guardada');
    event.target.value = '';
  }

  function applyMemoji(blob) {
    const url = toObjectUrl(blob);
    if (!url) return;
    const markerImg = FX_GPS.markerEl && FX_GPS.markerEl.querySelector('.fx-gps-face');
    const markerFallback = FX_GPS.markerEl && FX_GPS.markerEl.querySelector('.fx-gps-face-fallback');
    if (markerImg) { markerImg.src = url; markerImg.style.display = 'block'; }
    if (markerFallback) markerFallback.style.display = 'none';
    const avatar = document.getElementById('fx-gps-avatar');
    const fallback = document.getElementById('fx-gps-avatar-fallback');
    if (avatar) { avatar.src = url; avatar.style.display = 'block'; }
    if (fallback) fallback.style.display = 'none';
  }

  function applyDailyPhoto(blob) {
    const url = toObjectUrl(blob);
    const photo = document.getElementById('fx-gps-photo');
    const empty = document.getElementById('fx-gps-photo-empty');
    if (url && photo) { photo.src = url; photo.style.display = 'block'; }
    if (empty) empty.style.display = url ? 'none' : 'grid';
  }

  async function restoreMedia() {
    applyMemoji(await dbGet('memoji'));
    applyDailyPhoto(await dbGet(`daily:${todayKey()}`));
  }

  function showCard() {
    buildCard();
    refreshCard();
    document.getElementById('fx-gps-card').classList.add('show');
  }

  function hideCard() {
    const card = document.getElementById('fx-gps-card');
    if (card) card.classList.remove('show');
  }

  function refreshCard() {
    const p = FX_GPS.lastPosition;
    const time = document.getElementById('fx-gps-time');
    if (time) time.textContent = p ? `Actualizado ${new Date(p.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}` : 'Esperando GPS…';
    if (!p) return;
    const c = p.coords;
    const address = document.getElementById('fx-gps-address');
    const coords = document.getElementById('fx-gps-coords');
    const accuracy = document.getElementById('fx-gps-accuracy-card');
    const speed = document.getElementById('fx-gps-speed');
    if (address) address.textContent = FX_GPS.lastAddress;
    if (coords) coords.textContent = `${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}`;
    if (accuracy) accuracy.textContent = `± ${Math.round(c.accuracy)} m`;
    if (speed) speed.textContent = Number.isFinite(c.speed) ? `${Math.max(0, c.speed * 3.6).toFixed(1)} km/h` : '—';
  }

  function distanceMeters(a, b) {
    if (!a || !b) return Infinity;
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const la1 = a.lat * Math.PI / 180;
    const la2 = b.lat * Math.PI / 180;
    const h = Math.sin(dLat/2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng/2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  async function reverseGeocode(lng, lat) {
    const now = Date.now();
    const point = {lng, lat};
    if (now - FX_GPS.lastGeocodeAt < 30000 && distanceMeters(FX_GPS.lastGeocodePoint, point) < 25) return;
    FX_GPS.lastGeocodeAt = now;
    FX_GPS.lastGeocodePoint = point;
    const token = window.mapboxgl && mapboxgl.accessToken;
    if (!token) return;
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address,poi,place,locality,neighborhood&limit=1&language=es&access_token=${encodeURIComponent(token)}`;
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      const feature = data.features && data.features[0];
      if (feature) {
        FX_GPS.lastAddress = feature.place_name || feature.text || 'Ubicación actual';
        refreshCard();
      }
    } catch (_) {}
  }

  function accuracyGeoJSON(lng, lat, radius, steps = 72) {
    const earth = 6378137;
    const latRad = lat * Math.PI / 180;
    const ring = [];
    const safeRadius = Math.max(1, Math.min(Number(radius) || 1, 5000));
    for (let i = 0; i <= steps; i++) {
      const angle = i / steps * Math.PI * 2;
      const dx = Math.cos(angle) * safeRadius;
      const dy = Math.sin(angle) * safeRadius;
      const dLat = dy / earth * 180 / Math.PI;
      const dLng = dx / (earth * Math.max(.01, Math.cos(latRad))) * 180 / Math.PI;
      ring.push([lng + dLng, lat + dLat]);
    }
    return {type:'Feature', properties:{accuracy:safeRadius}, geometry:{type:'Polygon', coordinates:[ring]}};
  }

  function ensureAccuracyLayer() {
    const map = FX_GPS.map;
    if (!map || !map.isStyleLoaded || !map.isStyleLoaded()) return false;
    try {
      if (!map.getSource('fx-gps-accuracy')) {
        map.addSource('fx-gps-accuracy', {type:'geojson', data:{type:'FeatureCollection', features:[]}});
      }
      if (!map.getLayer('fx-gps-accuracy-fill')) {
        map.addLayer({id:'fx-gps-accuracy-fill', type:'fill', source:'fx-gps-accuracy', paint:{'fill-color':'#0086df','fill-opacity':.10}});
      }
      if (!map.getLayer('fx-gps-accuracy-line')) {
        map.addLayer({id:'fx-gps-accuracy-line', type:'line', source:'fx-gps-accuracy', paint:{'line-color':'#0086df','line-width':1.4,'line-opacity':.48}});
      }
      return true;
    } catch (_) { return false; }
  }

  function updateAccuracyCircle(lng, lat, accuracy) {
    const map = FX_GPS.map;
    if (!map || !ensureAccuracyLayer()) return;
    try {
      const src = map.getSource('fx-gps-accuracy');
      if (src) src.setData(accuracyGeoJSON(lng, lat, accuracy));
    } catch (_) {}
  }

  function updateMarkerAccuracy(accuracy) {
    if (!FX_GPS.markerEl) return;
    const badge = FX_GPS.markerEl.querySelector('.fx-gps-accuracy');
    if (!badge) return;
    const rounded = Math.max(1, Math.round(accuracy || 0));
    badge.textContent = `± ${rounded} m`;
    badge.classList.remove('good','mid','poor');
    badge.classList.add(rounded <= 10 ? 'good' : rounded <= 30 ? 'mid' : 'poor');
  }

  function onPosition(position) {
    FX_GPS.lastPosition = position;
    const {latitude:lat, longitude:lng, accuracy} = position.coords;
    if (!FX_GPS.marker && FX_GPS.map && window.mapboxgl) {
      const markerEl = FX_GPS.markerEl || buildMarker();
      FX_GPS.marker = new mapboxgl.Marker({element:markerEl, anchor:'center', offset:[0,-10]}).setLngLat([lng,lat]).addTo(FX_GPS.map);
      restoreMedia();
    } else if (FX_GPS.marker) {
      FX_GPS.marker.setLngLat([lng, lat]);
    }
    updateMarkerAccuracy(accuracy);
    updateAccuracyCircle(lng, lat, accuracy);
    reverseGeocode(lng, lat);
    refreshCard();
    window.__fxGPSState = {lat, lng, accuracy, timestamp:position.timestamp};
  }

  function onPositionError(error) {
    if (error && error.code === 1) toast('Activa ubicación precisa para FX Map');
  }

  function startGps() {
    if (FX_GPS.started || !navigator.geolocation) return;
    FX_GPS.started = true;
    FX_GPS.watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
      enableHighAccuracy:true,
      maximumAge:0,
      timeout:15000
    });
  }

  function centerOnMe() {
    const p = FX_GPS.lastPosition;
    if (!p || !FX_GPS.map) return toast('Esperando señal GPS');
    const c = p.coords;
    FX_GPS.map.easeTo({center:[c.longitude,c.latitude], zoom:Math.max(FX_GPS.map.getZoom(),17), duration:650});
  }

  function shareText() {
    const p = FX_GPS.lastPosition;
    if (!p) return '';
    const c = p.coords;
    const maps = `https://maps.apple.com/?ll=${c.latitude},${c.longitude}`;
    return `Mi ubicación actual\n${FX_GPS.lastAddress}\n${c.latitude.toFixed(6)}, ${c.longitude.toFixed(6)}\nPrecisión GPS: ±${Math.round(c.accuracy)} m\n${maps}`;
  }

  async function copyLocation() {
    const text = shareText();
    if (!text) return toast('Esperando señal GPS');
    try { await navigator.clipboard.writeText(text); toast('Ubicación copiada'); }
    catch (_) { toast('No se pudo copiar'); }
  }

  function openMessage() {
    const text = shareText();
    if (!text) return toast('Esperando señal GPS');
    const recipient = (localStorage.getItem('fx-share-recipient') || '').trim();
    const target = recipient ? `sms:${encodeURIComponent(recipient)}&body=${encodeURIComponent(text)}` : `sms:&body=${encodeURIComponent(text)}`;
    window.location.href = target;
  }

  function runShortcut() {
    const text = shareText();
    if (!text) return toast('Esperando señal GPS');
    const name = localStorage.getItem('fx-shortcut-name') || 'FX Share Location';
    window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${encodeURIComponent(text)}`;
  }

  function bindMap(map) {
    if (!map || FX_GPS.map === map) return;
    FX_GPS.map = map;
    const styleHandler = () => {
      ensureAccuracyLayer();
      if (FX_GPS.lastPosition) {
        const c = FX_GPS.lastPosition.coords;
        updateAccuracyCircle(c.longitude, c.latitude, c.accuracy);
      }
    };
    map.on('load', styleHandler);
    map.on('styledata', styleHandler);
    if (map.loaded && map.loaded()) styleHandler();
    startGps();
  }

  function waitForMap() {
    const existing = window.__fxMapInstance;
    if (existing) return bindMap(existing);
    // Fallback for a map created before the capture hook.
    try {
      const globalMap = Function('try{return typeof map!=="undefined"?map:null}catch(e){return null}')();
      if (globalMap) return bindMap(globalMap);
    } catch (_) {}
    setTimeout(waitForMap, 120);
  }

  function init() {
    injectCss();
    buildCard();
    buildMarker();
    restoreMedia();
    waitForMap();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !FX_GPS.started) startGps();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
