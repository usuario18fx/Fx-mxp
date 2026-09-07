const v2 = require('./index-v2');

function patchMapHtml(html) {
  const rasterStyle = `{version:8,sources:{fxRaster:{type:'raster',tiles:['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png','https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],tileSize:256,attribution:'© OpenStreetMap © CARTO'}},layers:[{id:'fxRaster',type:'raster',source:'fxRaster',minzoom:0,maxzoom:22}]}`;

  html = html.replace(
    '#map{position:absolute;inset:0}',
    '#map{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;min-height:100vh!important;z-index:0!important;background:#080a0d!important}'
  );

  html = html.replace(
    "style: 'mapbox://styles/mapbox/standard'",
    `style: ${rasterStyle}`
  );

  html = html.replace(
    "style: 'mapbox://styles/mapbox/dark-v11'",
    `style: ${rasterStyle}`
  );

  if (!html.includes('FXMAP_RENDER_FIX_V3')) {
    const injected = `
<!-- FXMAP_RENDER_FIX_V3 -->
<style>
#map,.mapboxgl-map,.mapboxgl-canvas-container,.mapboxgl-canvas{width:100%!important;height:100%!important;min-height:100%!important}
.mapboxgl-canvas{display:block!important}
</style>
<script>
(function(){
  function fxResizeMap(){
    try{
      var m=window.__fxMapInstance || (typeof map!=='undefined' ? map : null);
      if(m && typeof m.resize==='function') m.resize();
    }catch(e){}
  }
  function fxResizeBurst(){
    fxResizeMap();
    requestAnimationFrame(function(){fxResizeMap();requestAnimationFrame(fxResizeMap)});
    setTimeout(fxResizeMap,100);
    setTimeout(fxResizeMap,350);
    setTimeout(fxResizeMap,900);
  }
  window.addEventListener('load',fxResizeBurst,{once:true});
  window.addEventListener('resize',fxResizeBurst,{passive:true});
  window.addEventListener('orientationchange',fxResizeBurst,{passive:true});
  if(window.visualViewport) window.visualViewport.addEventListener('resize',fxResizeBurst,{passive:true});
  window.addEventListener('fx-map-ready',fxResizeBurst);
  document.addEventListener('visibilitychange',function(){if(!document.hidden)fxResizeBurst()});
  fxResizeBurst();
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
