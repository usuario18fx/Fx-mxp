const v5 = require('./index-v5');

function patchPrecisionControls(html) {
  if (html.includes('FX_MEMOJI_PRECISION_CONTROLS_V2')) return html;

  const patch = `
<!-- FX_MEMOJI_PRECISION_CONTROLS_V2 -->
<style>
.dpad[data-fx-v6="1"]{touch-action:none!important;-webkit-user-select:none!important;user-select:none!important;overscroll-behavior:contain!important}
.dpad[data-fx-v6="1"].fx-driving{transform:scale(1.015);filter:brightness(1.06)}
</style>
<script>
(function(){'use strict';
  var installed=false,pad=null,pointerId=null,raf=0,active=false,vx=0,vy=0,lastT=0;
  var DEADZONE=0.05;
  var CURVE=1.85;
  var MAX_SPEED=7.4;

  function getMap(){try{return window.__fxMapInstance||null}catch(e){return null}}
  function response(v){
    var a=Math.abs(v);
    if(a<=DEADZONE)return 0;
    var n=(a-DEADZONE)/(1-DEADZONE);
    n=Math.pow(Math.min(1,n),CURVE);
    return (v<0?-1:1)*n;
  }
  function readVector(e){
    var r=pad.getBoundingClientRect();
    var cx=r.left+r.width/2,cy=r.top+r.height/2;
    var radius=Math.max(1,Math.min(r.width,r.height)*0.46);
    var x=(e.clientX-cx)/radius,y=(e.clientY-cy)/radius;
    var mag=Math.hypot(x,y);
    if(mag>1){x/=mag;y/=mag;}
    vx=response(x);vy=response(y);
  }
  function tick(t){
    if(!active){raf=0;return;}
    if(!lastT)lastT=t;
    var dt=Math.min(2,Math.max(.45,(t-lastT)/16.6667));lastT=t;
    var m=getMap();
    if(m&&typeof m.panBy==='function'&&(vx||vy)){
      try{m.panBy([vx*MAX_SPEED*dt,vy*MAX_SPEED*dt],{duration:0,animate:false,essential:true})}catch(e){}
    }
    raf=requestAnimationFrame(tick);
  }
  function start(e){
    if(e.pointerType==='mouse'&&e.button!==0)return;
    pointerId=e.pointerId;active=true;lastT=0;readVector(e);pad.classList.add('fx-driving');
    try{pad.setPointerCapture(pointerId)}catch(x){}
    if(navigator.vibrate)try{navigator.vibrate(10)}catch(x){}
    if(!raf)raf=requestAnimationFrame(tick);
    e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();
  }
  function move(e){
    if(!active||e.pointerId!==pointerId)return;
    readVector(e);e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();
  }
  function stop(e){
    if(!active)return;
    if(e&&e.pointerId!=null&&pointerId!=null&&e.pointerId!==pointerId)return;
    active=false;vx=0;vy=0;pointerId=null;lastT=0;pad.classList.remove('fx-driving');
    if(raf){cancelAnimationFrame(raf);raf=0;}
    if(e){e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();}
  }
  function install(){
    if(installed)return true;
    var old=document.querySelector('.dpad');
    if(!old)return false;
    var fresh=old.cloneNode(true);
    fresh.setAttribute('data-fx-v2','1');
    fresh.setAttribute('data-fx-v6','1');
    old.parentNode.replaceChild(fresh,old);
    pad=fresh;installed=true;
    pad.addEventListener('pointerdown',start,{passive:false});
    pad.addEventListener('pointermove',move,{passive:false});
    pad.addEventListener('pointerup',stop,{passive:false});
    pad.addEventListener('pointercancel',stop,{passive:false});
    pad.addEventListener('lostpointercapture',function(){stop(null)});
    return true;
  }
  function boot(){
    if(install())return;
    var tries=0,timer=setInterval(function(){tries++;if(install()||tries>80)clearInterval(timer)},125);
    new MutationObserver(function(){install()}).observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>`;

  return html.includes('</body>') ? html.replace('</body>', patch + '\n</body>') : html + patch;
}


function patchMapDiagnostics(html) {
  if (html.includes('FX_MAP_DIAGNOSTICS_V1')) return html;
  const patch = `
<!-- FX_MAP_DIAGNOSTICS_V1 -->
<style>
#fx-map-status{position:fixed;left:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:9999;padding:6px 9px;border-radius:999px;background:rgba(7,11,17,.72);border:1px solid rgba(255,255,255,.10);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font:800 9px/1 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;letter-spacing:.08em;color:#9aa7b8;pointer-events:none;opacity:.86}
#fx-map-status.live{color:#79ffb6;border-color:rgba(0,255,136,.24)}
#fx-map-status.backup{color:#facc15;border-color:rgba(250,204,21,.28)}
</style>
<div id="fx-map-status">MAP · CHECKING</div>
<script>
(function(){'use strict';
  var badge=document.getElementById('fx-map-status');
  var primaryReady=false;
  var fallbackReady=false;

  function setState(mode){
    if(!badge)return;
    badge.className=mode==='live'?'live':mode==='backup'?'backup':'';
    badge.textContent=mode==='live'?'MAP · LIVE':mode==='backup'?'MAP · BACKUP':'MAP · CHECKING';
  }

  function showFallback(){
    fallbackReady=document.body.classList.contains('fx-leaflet-ready');
    if(fallbackReady){setState('backup');return true;}
    return false;
  }

  function bindPrimary(){
    var m=null;
    try{m=window.__fxMapInstance||null}catch(e){}
    if(!m)return false;
    try{
      m.once('load',function(){primaryReady=true;if(!showFallback())setState('live')});
      m.on('error',function(){setTimeout(showFallback,0)});
      if(typeof m.loaded==='function'&&m.loaded()){primaryReady=true;if(!showFallback())setState('live')}
    }catch(e){}
    return true;
  }

  var obs=new MutationObserver(function(){
    if(document.body.classList.contains('fx-leaflet-ready'))showFallback();
  });
  obs.observe(document.body,{attributes:true,attributeFilter:['class']});

  var tries=0,t=setInterval(function(){
    tries++;
    bindPrimary();
    if(showFallback()||primaryReady||tries>40)clearInterval(t);
  },150);

  setTimeout(function(){
    if(!primaryReady)showFallback();
  },3500);
})();
</script>`;
  return html.includes('</body>') ? html.replace('</body>', patch + '\n</body>') : html + patch;
}

module.exports = function handler(req, res) {
  let statusCode = 200;
  const proxy = Object.create(res);
  proxy.setHeader = function(name, value){ res.setHeader(name, value); return proxy; };
  proxy.status = function(code){ statusCode = code; return proxy; };
  proxy.send = function(body){
    if (statusCode === 200 && typeof body === 'string') { body = patchPrecisionControls(body); body = patchMapDiagnostics(body); }
    return res.status(statusCode).send(body);
  };
  return v5(req, proxy);
};
