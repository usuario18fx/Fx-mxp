(() => {
  'use strict';

  const STATE = {
    map: null,
    marker: null,
    el: null,
    centered: false,
    watchId: null,
    memojiUrl: null
  };

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('fx-map-gps', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('media')) db.createObjectStore('media');
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function loadMemoji() {
    try {
      const db = await openDb();
      const blob = await new Promise((resolve, reject) => {
        const tx = db.transaction('media', 'readonly');
        const req = tx.objectStore('media').get('memoji');
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
      if (blob) {
        if (STATE.memojiUrl) URL.revokeObjectURL(STATE.memojiUrl);
        STATE.memojiUrl = URL.createObjectURL(blob);
      }
    } catch (_) {}
  }

  function injectStyle() {
    if (document.getElementById('fx-gps-visibility-style')) return;
    const style = document.createElement('style');
    style.id = 'fx-gps-visibility-style';
    style.textContent = `
      .fx-live-user-marker{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;z-index:120;cursor:pointer;pointer-events:auto}
      .fx-live-user-ring{position:relative;width:62px;height:62px;border-radius:50%;display:grid;place-items:center}
      .fx-live-user-ring::before,.fx-live-user-ring::after{content:'';position:absolute;inset:-7px;border-radius:50%;border:1px solid rgba(0,134,223,.55);box-shadow:0 0 20px rgba(0,134,223,.3);animation:fxLivePulse 2.2s ease-out infinite}
      .fx-live-user-ring::after{inset:-14px;opacity:.5;animation-delay:1.1s}
      .fx-live-user-face,.fx-live-user-fallback{position:relative;z-index:2;width:54px;height:54px;border-radius:50%;border:2px solid rgba(255,255,255,.95);box-shadow:0 5px 18px rgba(0,0,0,.55),0 0 22px rgba(0,134,223,.28);background:#10131a}
      .fx-live-user-face{display:none;object-fit:cover}
      .fx-live-user-fallback{display:grid;place-items:center;font-size:31px;background:radial-gradient(circle at 50% 35%,#1c2531,#080b10 72%)}
      .fx-live-user-accuracy{z-index:3;min-width:48px;height:20px;padding:0 7px;border-radius:999px;display:flex;align-items:center;justify-content:center;background:rgba(6,8,12,.94);border:1px solid rgba(0,134,223,.4);color:#9fd9ff;font:800 10px/1 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.35)}
      @keyframes fxLivePulse{0%{transform:scale(.78);opacity:.72}70%,100%{transform:scale(1.35);opacity:0}}
    `;
    document.head.appendChild(style);
  }

  function buildMarkerEl() {
    if (STATE.el) return STATE.el;
    const el = document.createElement('div');
    el.className = 'fx-live-user-marker';
    el.innerHTML = `
      <div class="fx-live-user-ring">
        <img class="fx-live-user-face" alt="Memoji" />
        <div class="fx-live-user-fallback">🙂</div>
      </div>
      <div class="fx-live-user-accuracy">± -- m</div>
    `;
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const card = document.getElementById('fx-gps-card');
      if (card) card.classList.add('show');
    });
    STATE.el = el;
    return el;
  }

  function applyMemojiToMarker() {
    if (!STATE.el || !STATE.memojiUrl) return;
    const img = STATE.el.querySelector('.fx-live-user-face');
    const fallback = STATE.el.querySelector('.fx-live-user-fallback');
    if (img) {
      img.src = STATE.memojiUrl;
      img.style.display = 'block';
    }
    if (fallback) fallback.style.display = 'none';
  }

  async function refreshMemoji() {
    await loadMemoji();
    applyMemojiToMarker();
  }

  function onPosition(position) {
    if (!STATE.map || !window.mapboxgl) return;
    const c = position.coords;
    const lngLat = [c.longitude, c.latitude];

    if (!STATE.marker) {
      const el = buildMarkerEl();
      STATE.marker = new mapboxgl.Marker({ element: el, anchor: 'center', offset: [0, -12] })
        .setLngLat(lngLat)
        .addTo(STATE.map);
      const parent = el.parentElement;
      if (parent) parent.style.zIndex = '120';
      refreshMemoji();
    } else {
      STATE.marker.setLngLat(lngLat);
    }

    const badge = STATE.el && STATE.el.querySelector('.fx-live-user-accuracy');
    if (badge) badge.textContent = `± ${Math.max(1, Math.round(c.accuracy || 0))} m`;

    if (!STATE.centered) {
      STATE.centered = true;
      try {
        STATE.map.easeTo({ center: lngLat, zoom: Math.max(STATE.map.getZoom(), 17), duration: 700, essential: true });
      } catch (_) {}
    }
  }

  function onError(error) {
    const toast = document.getElementById('fx-gps-toast');
    if (!toast) return;
    toast.textContent = error && error.code === 1 ? 'Activa ubicación precisa para mostrar tu Memoji' : 'Buscando señal GPS…';
    toast.classList.add('show');
    clearTimeout(toast.__fxVisTimer);
    toast.__fxVisTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function startWatch() {
    if (STATE.watchId !== null || !navigator.geolocation) return;
    STATE.watchId = navigator.geolocation.watchPosition(onPosition, onError, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    });
  }

  function bindMap(map) {
    if (!map || STATE.map === map) return;
    STATE.map = map;
    startWatch();
  }

  function waitForMap() {
    if (window.__fxMapInstance) return bindMap(window.__fxMapInstance);
    const ready = (event) => bindMap(event && event.detail && event.detail.map);
    window.addEventListener('fx-map-ready', ready, { once: true });
    setTimeout(() => {
      if (window.__fxMapInstance) bindMap(window.__fxMapInstance);
    }, 250);
    setTimeout(() => {
      if (window.__fxMapInstance) bindMap(window.__fxMapInstance);
    }, 1000);
  }

  function boot() {
    injectStyle();
    waitForMap();
    document.addEventListener('change', (event) => {
      const input = event.target;
      if (input && input.type === 'file' && (input.id === 'fx-gps-memoji-input' || input.getAttribute('aria-label') === 'Seleccionar Memoji')) {
        setTimeout(refreshMemoji, 150);
        setTimeout(refreshMemoji, 700);
      }
    }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
