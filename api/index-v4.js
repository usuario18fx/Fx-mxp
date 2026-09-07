const v3 = require('./index-v3');

function patchMapHtml(html) {
  if (html.includes('FXMAP_RENDER_FIX_V4_TILE_READY')) return html;

  const headPatch = `
<!-- FXMAP_RENDER_FIX_V4_TILE_READY -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
<style>
  #fx-leaflet-map{
    position:fixed!important;
    inset:0!important;
    width:100vw!important;
    height:100dvh!important;
    min-height:100vh!important;
    z-index:0!important;
    background:#080a0d!important;
    pointer-events:none!important;
    opacity:0!important;
  }
  body.fx-leaflet-ready #fx-leaflet-map{
    z-index:2!important;
    opacity:1!important;
  }
  #map{
    z-index:1!important;
    background:transparent!important;
  }
  #map .mapboxgl-canvas-container{
    background:transparent!important;
  }
  #fx-leaflet-map.leaflet-container{
    background:#080a0d!important;
  }
  #fx-leaflet-map .leaflet-control-container{
    display:none!important;
  }
  #fx-leaflet-map .leaflet-pane,
  #fx-leaflet-map .leaflet-tile-pane{
    z-index:1!important;
  }
</style>`;

  const bodyPatch = `
<div id="fx-leaflet-map" aria-hidden="true"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<script>
(function(){
  var fallbackMap = null;
  var lastLat = null, lastLng = null, lastZoom = null;
  var tileLoaded = false;

  function markReady(){
    if(tileLoaded) return;
    tileLoaded = true;
    document.body.classList.add('fx-leaflet-ready');
  }

  function initFallback(){
    if (fallbackMap || !window.L) return;
    var el = document.getElementById('fx-leaflet-map');
    if (!el) return;

    fallbackMap = L.map(el, {
      zoomControl:false,
      attributionControl:false,
      dragging:false,
      touchZoom:false,
      doubleClickZoom:false,
      scrollWheelZoom:false,
      boxZoom:false,
      keyboard:false,
      tap:false,
      preferCanvas:false
    }).setView([43.25295, -79.86125], 16);

    var tiles = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', {
      subdomains:'abcd',
      maxZoom:20,
      detectRetina:false,
      crossOrigin:true,
      updateWhenIdle:false,
      keepBuffer:3
    });

    tiles.on('tileload', markReady);
    tiles.addTo(fallbackMap);

    setTimeout(function(){ try{ fallbackMap.invalidateSize(true); }catch(e){} }, 0);
    setTimeout(function(){ try{ fallbackMap.invalidateSize(true); }catch(e){} }, 250);
    setTimeout(function(){ try{ fallbackMap.invalidateSize(true); }catch(e){} }, 900);
  }

  function getPrimaryMap(){
    try {
      if (window.__fxMapInstance && typeof window.__fxMapInstance.getCenter === 'function') return window.__fxMapInstance;
    } catch(e){}
    try {
      if (typeof map !== 'undefined' && map && typeof map.getCenter === 'function') return map;
    } catch(e){}
    return null;
  }

  function syncFallback(){
    if (!fallbackMap) return;
    var m = getPrimaryMap();
    if (!m) return;
    try {
      var c = m.getCenter();
      var z = m.getZoom();
      if (!c || !isFinite(c.lat) || !isFinite(c.lng) || !isFinite(z)) return;
      var targetZoom = Math.max(0, Math.min(20, z));
      if (lastLat === null || Math.abs(c.lat-lastLat) > 0.000001 || Math.abs(c.lng-lastLng) > 0.000001 || Math.abs(targetZoom-lastZoom) > 0.01) {
        fallbackMap.setView([c.lat, c.lng], targetZoom, {animate:false});
        lastLat = c.lat;
        lastLng = c.lng;
        lastZoom = targetZoom;
      }
    } catch(e){}
  }

  function boot(){
    initFallback();
    syncFallback();
    setInterval(syncFallback, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();

  window.addEventListener('resize', function(){ try{ if(fallbackMap) fallbackMap.invalidateSize(false); }catch(e){} }, {passive:true});
  window.addEventListener('orientationchange', function(){ setTimeout(function(){ try{ if(fallbackMap) fallbackMap.invalidateSize(true); }catch(e){} }, 250); }, {passive:true});
})();
</script>`;

  html = html.includes('</head>') ? html.replace('</head>', headPatch + '\n</head>') : headPatch + html;
  html = html.includes('</body>') ? html.replace('</body>', bodyPatch + '\n</body>') : html + bodyPatch;
  return html;
}

module.exports = function handler(req, res) {
  let statusCode = 200;
  const proxy = Object.create(res);

  proxy.setHeader = function(name, value) {
    res.setHeader(name, value);
    return proxy;
  };

  proxy.status = function(code) {
    statusCode = code;
    return proxy;
  };

  proxy.send = function(body) {
    if (statusCode === 200 && typeof body === 'string') body = patchMapHtml(body);
    return res.status(statusCode).send(body);
  };

  return v3(req, proxy);
};
