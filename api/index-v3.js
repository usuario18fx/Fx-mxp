const v2 = require('./index-v2');

function patchMapHtml(html) {
  const rasterStyle = `{version:8,sources:{fxRaster:{type:'raster',tiles:['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png','https://b.tile.openstreetmap.org/{z}/{x}/{y}.png','https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap contributors'}},layers:[{id:'fxRaster',type:'raster',source:'fxRaster',minzoom:0,maxzoom:19}]}`;

  html = html.replace(/#map\s*\{[^}]*position\s*:\s*absolute[^}]*\}/i,
    '#map{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100vh!important;z-index:1!important;background:transparent!important}'
  );

  html = html.replace(/style\s*:\s*['"]mapbox:\/\/styles\/mapbox\/(?:standard|dark-v11)['"]/g,
    `style: ${rasterStyle}`
  );

  if (!html.includes('FXMAP_RENDER_FIX_V3_HARD')) {
    const injected = `
<!-- FXMAP_RENDER_FIX_V3_HARD -->
<style>
html,body{background:#0b0f17!important}
#fx-map-fallback{position:fixed;inset:0;z-index:0;width:100vw;height:100dvh;border:0;background:#0b0f17;display:block}
#map,.mapboxgl-map,.mapboxgl-canvas-container,.mapboxgl-canvas{width:100%!important;height:100%!important;min-height:100%!important}
#map{background:transparent!important}
.mapboxgl-canvas{display:block!important;background:transparent!important}
body.fx-use-fallback #map{opacity:0!important;pointer-events:none!important}
body.fx-use-fallback #fx-map-fallback{z-index:1}
body:not(.fx-use-fallback) #fx-map-fallback{pointer-events:none}
</style>
<script>
(function(){
  var FALLBACK_ID='fx-map-fallback';
  var usingFallback=false;

  function makeEmbed(lat,lng,zoom){
    lat=Number(lat)||43.25295; lng=Number(lng)||-79.86125; zoom=Number(zoom)||16;
    var d=0.012;
    var left=lng-d,right=lng+d,bottom=lat-d,top=lat+d;
    return 'https://www.openstreetmap.org/export/embed.html?bbox='+encodeURIComponent(left+','+bottom+','+right+','+top)+'&layer=mapnik&marker='+encodeURIComponent(lat+','+lng);
  }

  function ensureFallback(){
    var f=document.getElementById(FALLBACK_ID);
    if(f) return f;
    f=document.createElement('iframe');
    f.id=FALLBACK_ID;
    f.title='FX Map fallback';
    f.referrerPolicy='no-referrer-when-downgrade';
    f.setAttribute('loading','eager');
    f.src=makeEmbed(43.25295,-79.86125,16);
    document.body.insertBefore(f,document.body.firstChild);
    return f;
  }

  function useFallback(lat,lng){
    var f=ensureFallback();
    if(lat!=null && lng!=null) f.src=makeEmbed(lat,lng,17);
    usingFallback=true;
    document.body.classList.add('fx-use-fallback');
  }

  function useMapbox(){
    usingFallback=false;
    document.body.classList.remove('fx-use-fallback');
  }

  function mapLooksReady(){
    try{
      var m=window.__fxMapInstance || (typeof map!=='undefined'?map:null);
      if(!m) return false;
      if(typeof m.resize==='function') m.resize();
      if(typeof m.loaded==='function' && !m.loaded()) return false;
      var c=m.getCanvas && m.getCanvas();
      if(!c || c.width<50 || c.height<50) return false;
      return true;
    }catch(e){return false}
  }

  function verify(){
    if(mapLooksReady()) useMapbox(); else useFallback();
  }

  function resizeBurst(){
    try{var m=window.__fxMapInstance || (typeof map!=='undefined'?map:null);if(m&&m.resize)m.resize()}catch(e){}
    requestAnimationFrame(function(){try{var m=window.__fxMapInstance || (typeof map!=='undefined'?map:null);if(m&&m.resize)m.resize()}catch(e){}});
  }

  ensureFallback();
  setTimeout(verify,3500);
  setTimeout(verify,7000);

  window.addEventListener('fx-map-ready',function(){resizeBurst();setTimeout(verify,1200)});
  window.addEventListener('load',function(){resizeBurst();setTimeout(verify,1800)},{once:true});
  window.addEventListener('resize',resizeBurst,{passive:true});
  window.addEventListener('orientationchange',resizeBurst,{passive:true});
  if(window.visualViewport) window.visualViewport.addEventListener('resize',resizeBurst,{passive:true});
  document.addEventListener('visibilitychange',function(){if(!document.hidden){resizeBurst();setTimeout(verify,500)}});

  if(navigator.geolocation){
    navigator.geolocation.watchPosition(function(p){
      var lat=p.coords.latitude,lng=p.coords.longitude;
      var f=ensureFallback();
      if(usingFallback) f.src=makeEmbed(lat,lng,17);
    },function(){},{enableHighAccuracy:true,maximumAge:15000,timeout:12000});
  }
})();
</script>`;
    html = html.includes('</body>') ? html.replace('</body>', injected + '\n</body>') : html + injected;
  }

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
    if (statusCode === 200 && typeof body === 'string') {
      body = patchMapHtml(body);
    }
    return res.status(statusCode).send(body);
  };

  return v2(req, proxy);
};
