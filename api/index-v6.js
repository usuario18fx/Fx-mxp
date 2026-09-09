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

module.exports = function handler(req, res) {
  let statusCode = 200;
  const proxy = Object.create(res);
  proxy.setHeader = function(name, value){ res.setHeader(name, value); return proxy; };
  proxy.status = function(code){ statusCode = code; return proxy; };
  proxy.send = function(body){
    if (statusCode === 200 && typeof body === 'string') body = patchPrecisionControls(body);
    return res.status(statusCode).send(body);
  };
  return v5(req, proxy);
};
