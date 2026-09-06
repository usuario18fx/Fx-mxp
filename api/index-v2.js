const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(file, 'utf8');

    const mapboxToken = [
      'pk.eyJ1IjoiLXVzZXIxOGZ4IiwiYSI6ImNtdG43NXJjNjA4YjMyeG9hc2xpNW40enIifQ',
      'awn8NmfTc-yM6KElfuxUTQ'
    ].join('.');
    html = html.replace(/mapboxgl\.accessToken\s*=\s*['"][^'"]+['"]\s*;/, "mapboxgl.accessToken = '" + mapboxToken + "';");

    const mapNeedle = '// Disable all zoom controls';
    const mapBridge = "window.__fxMapInstance = map;\nwindow.dispatchEvent(new CustomEvent('fx-map-ready', { detail: { map: map } }));\n";
    if (!html.includes('window.__fxMapInstance = map;') && html.includes(mapNeedle)) {
      html = html.replace(mapNeedle, mapBridge + mapNeedle);
    }

    const injected = `
<style id="fx-v2-style">
:root{--fxg:#00FF88;--fxg2:#18D77C;--fxbg:#0B0F17;--fxox:#1B1F24;--fxox2:#252B32;--fxtext:#F3F7FB;--fxmuted:#9AA7B8;--fxline:#33404C;--fxblue:#00C2FF;--fxred:#800020}
#fx-v2-accuracy{position:fixed;z-index:105;display:none;pointer-events:none;border:1.5px solid rgba(0,255,136,.38);background:rgba(0,255,136,.07);border-radius:50%;transform:translate(-50%,-50%)}
#fx-v2-user{position:fixed;z-index:110;display:flex;flex-direction:column;align-items:center;gap:5px;transform:translate(-50%,-50%);pointer-events:none}
#fx-v2-user .fx-rings{position:relative;width:72px;height:72px;display:grid;place-items:center;border-radius:50%}
#fx-v2-user .fx-rings:before,#fx-v2-user .fx-rings:after{content:'';position:absolute;border-radius:50%;inset:5px;border:2px solid rgba(0,255,136,.74);box-shadow:0 0 18px rgba(0,255,136,.24);animation:fxRingPulse 2.2s ease-out infinite}
#fx-v2-user .fx-rings:after{inset:-7px;animation-delay:1.1s;opacity:.48}
@keyframes fxRingPulse{0%{transform:scale(.72);opacity:.88}75%,100%{transform:scale(1.42);opacity:0}}
#fx-v2-user img{position:relative;z-index:2;width:64px;height:64px;object-fit:contain;display:none;background:transparent!important;border:0!important;border-radius:0!important;filter:drop-shadow(0 5px 10px rgba(0,0,0,.42))}
#fx-v2-user .fx-fallback{position:relative;z-index:2;font-size:42px;line-height:1;filter:drop-shadow(0 5px 10px rgba(0,0,0,.42))}
#fx-v2-user .fx-acc{position:relative;z-index:3;padding:4px 8px;border-radius:999px;background:rgba(11,15,23,.92);border:1px solid rgba(0,255,136,.34);color:#B9FFDA;font:750 11px/1 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.30)}

#fx-v2-card{position:fixed;z-index:250;display:none;left:12px;bottom:calc(88px + env(safe-area-inset-bottom,0px));width:min(390px,calc(100vw - 24px));max-height:min(68vh,620px);overflow:auto;background:linear-gradient(180deg,rgba(27,31,36,.985),rgba(11,15,23,.99));border:1px solid rgba(0,255,136,.30);border-radius:22px;box-shadow:0 24px 70px rgba(0,0,0,.68),0 0 0 1px rgba(255,255,255,.025) inset;font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;color:var(--fxtext);-webkit-overflow-scrolling:touch}
#fx-v2-card.open{display:block}
.fx-v2-head{padding:14px 15px 12px;border-bottom:1px solid rgba(154,167,184,.14)}
.fx-v2-state{display:inline-flex;align-items:center;gap:7px;padding:7px 11px;border-radius:999px;background:rgba(0,255,136,.10);border:1px solid rgba(0,255,136,.22);color:#8DFFC3;font-size:11px;font-weight:800}
.fx-v2-state i{width:7px;height:7px;border-radius:50%;background:var(--fxg);box-shadow:0 0 10px rgba(0,255,136,.65)}
.fx-v2-close{position:absolute;right:12px;top:12px;width:34px;height:34px;border:1px solid rgba(154,167,184,.16);border-radius:11px;background:#171D23;color:#B7C2CF;font-size:20px}
.fx-v2-profile{display:grid;grid-template-columns:82px 1fr;gap:13px;align-items:center;margin-top:13px}
.fx-v2-avatar{position:relative;width:82px;height:82px;display:grid;place-items:center}
.fx-v2-avatar:before{content:'';position:absolute;inset:3px;border-radius:50%;border:1.5px solid rgba(0,255,136,.52);box-shadow:0 0 18px rgba(0,255,136,.11)}
.fx-v2-avatar img{position:relative;z-index:2;width:76px;height:76px;object-fit:contain;display:none;background:transparent;border:0}
.fx-v2-avatar .fallback{position:relative;z-index:2;font-size:54px}
.fx-v2-avatar label{position:absolute;right:-1px;bottom:-1px;z-index:3;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:#16221D;border:1px solid rgba(0,255,136,.38);color:#83FFBC;font-size:13px;overflow:hidden}
.fx-v2-avatar input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.fx-v2-name{font-size:22px;font-weight:850;letter-spacing:-.02em}.fx-v2-sub{margin-top:5px;color:var(--fxmuted);font-size:12px;line-height:1.45}.fx-v2-address{margin-top:8px;color:#DCE6EF;font-size:12px;font-weight:700;cursor:pointer}.fx-v2-address:active{opacity:.65}
.fx-v2-stats{display:grid;grid-template-columns:repeat(3,1fr);margin:0 15px 13px;border:1px solid rgba(154,167,184,.14);border-radius:14px;overflow:hidden;background:#12181E}.fx-v2-stat{padding:10px 6px;text-align:center;border-right:1px solid rgba(154,167,184,.12)}.fx-v2-stat:last-child{border-right:0}.fx-v2-stat b{display:block;color:#F7FAFC;font-size:15px}.fx-v2-stat span{display:block;margin-top:3px;color:#8392A3;font-size:9px;text-transform:uppercase;letter-spacing:.08em}
.fx-v2-section{margin:0 15px 14px;border:1px solid rgba(154,167,184,.14);border-radius:14px;background:#10161C;overflow:hidden}.fx-v2-section-title{display:flex;align-items:center;justify-content:space-between;padding:10px 11px;border-bottom:1px solid rgba(154,167,184,.12);font-size:12px;font-weight:800}.fx-v2-edit{border:1px solid rgba(0,255,136,.30);background:rgba(0,255,136,.08);color:#79FFB6;border-radius:9px;padding:6px 9px;font-size:10px;font-weight:800}
.fx-v2-row{display:grid;grid-template-columns:72px 1fr;align-items:center;min-height:39px;padding:0 11px;border-bottom:1px solid rgba(154,167,184,.10)}.fx-v2-row:last-child{border-bottom:0}.fx-v2-row label{font-size:10px;color:#8E9BAC}.fx-v2-row input{min-width:0;width:100%;border:0;background:transparent;color:#E8EFF6;font:650 11px/1.2 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;outline:0;padding:8px 0}.fx-v2-row input[readonly]{color:#CED8E2}.fx-v2-row input:not([readonly]){color:#A7FFD1;border-bottom:1px solid rgba(0,255,136,.38)}
.fx-v2-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 15px 15px}.fx-v2-actions button{min-height:38px;border-radius:11px;border:1px solid rgba(154,167,184,.18);background:#151C22;color:#E8EFF6;font-size:11px;font-weight:800}.fx-v2-actions .green{border-color:rgba(0,255,136,.40);background:linear-gradient(180deg,rgba(0,255,136,.20),rgba(0,255,136,.09));color:#A8FFD0}

.fx-defined-frame{background:linear-gradient(180deg,#20262D 0%,#1B1F24 16%,#0B0F17 100%)!important;border:1px solid rgba(0,194,255,.28)!important;box-shadow:0 24px 72px rgba(0,0,0,.72)!important;overflow:hidden;z-index:300!important}
.fx-defined-frame [class*="tabs"],.fx-defined-frame [class*="segmented"],.fx-defined-frame [class*="nav"]{background:#141A20!important;border-color:rgba(154,167,184,.15)!important}.fx-defined-frame [class*="tab"].active,.fx-defined-frame [role="tab"][aria-selected="true"],.fx-defined-frame button.active{background:rgba(0,194,255,.15)!important;border-color:rgba(0,194,255,.42)!important;color:#E9FBFF!important}
.fx-organizer-frame{background:linear-gradient(180deg,#20262D 0%,#1B1F24 15%,#0B0F17 100%)!important;border:1px solid rgba(0,194,255,.30)!important}.fx-organizer-frame .fx-org-tabs{background:#11171D!important;border:1px solid rgba(0,194,255,.16)!important;border-radius:13px!important;overflow:hidden}.fx-organizer-frame .fx-org-tab{background:transparent!important;color:#C8D5E6!important}.fx-organizer-frame .fx-org-tab-active{background:rgba(0,194,255,.16)!important;color:#E6FBFF!important;border:1px solid rgba(0,194,255,.44)!important}.fx-organizer-frame .fx-primary-action{background:linear-gradient(180deg,#00C2FF,#0099D6)!important;color:#06131A!important;border-color:#00C2FF!important}
</style>
<script id="fx-v2-script">
(function(){'use strict';
var state={lat:null,lng:null,accuracy:null,address:'Obteniendo dirección…',memojiUrl:null,lastTime:null,cardOpen:false};
var profileKey='fx-map-profile-v2';
function qs(s,r){return (r||document).querySelector(s)}
function qsa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))}
function openDb(){return new Promise(function(ok,no){var r=indexedDB.open('fx-map-gps',1);r.onupgradeneeded=function(){if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media')};r.onsuccess=function(){ok(r.result)};r.onerror=function(){no(r.error)}})}
function getMemoji(){return openDb().then(function(d){return new Promise(function(ok,no){var r=d.transaction('media','readonly').objectStore('media').get('memoji');r.onsuccess=function(){ok(r.result||null)};r.onerror=function(){no(r.error)}})}).catch(function(){return null})}
function saveMemoji(file){return openDb().then(function(d){return new Promise(function(ok,no){var tx=d.transaction('media','readwrite');tx.objectStore('media').put(file,'memoji');tx.oncomplete=ok;tx.onerror=function(){no(tx.error)}})}).catch(function(){})}
function loadProfile(){try{return Object.assign({name:'Fx User',phone:'',email:'',notes:''},JSON.parse(localStorage.getItem(profileKey)||'{}'))}catch(e){return{name:'Fx User',phone:'',email:'',notes:''}}}
function saveProfile(){var p={};qsa('#fx-v2-card [data-profile]').forEach(function(i){p[i.getAttribute('data-profile')]=i.value});try{localStorage.setItem(profileKey,JSON.stringify(p))}catch(e){};qs('.fx-v2-name').textContent=p.name||'Fx User'}
function build(){if(qs('#fx-v2-user'))return;
 var a=document.createElement('div');a.id='fx-v2-accuracy';document.body.appendChild(a);
 var m=document.createElement('div');m.id='fx-v2-user';m.innerHTML='<div class="fx-rings"><img alt="Tu Memoji"><div class="fx-fallback">🙂</div></div><div class="fx-acc">GPS…</div>';document.body.appendChild(m);
 var c=document.createElement('section');c.id='fx-v2-card';c.innerHTML='<div class="fx-v2-head"><button class="fx-v2-close" aria-label="Cerrar">×</button><div class="fx-v2-state"><i></i> En ruta · ubicación en tiempo real</div><div class="fx-v2-profile"><div class="fx-v2-avatar"><img alt="Tu cara"><div class="fallback">🙂</div><label title="Cambiar Memoji">✎<input id="fx-v2-photo" type="file" accept="image/*"></label></div><div><div class="fx-v2-name">Fx User</div><div class="fx-v2-sub" id="fx-v2-meta">Esperando GPS…</div><div class="fx-v2-address" id="fx-v2-address" title="Toca para copiar">Obteniendo dirección…</div></div></div></div><div class="fx-v2-stats"><div class="fx-v2-stat"><b id="fx-v2-accstat">—</b><span>Precisión</span></div><div class="fx-v2-stat"><b id="fx-v2-time">—</b><span>Actualizado</span></div><div class="fx-v2-stat"><b>Live</b><span>Estado</span></div></div><div class="fx-v2-section"><div class="fx-v2-section-title">Información personal <button class="fx-v2-edit" id="fx-v2-edit">Editar</button></div><div class="fx-v2-row"><label>Nombre</label><input data-profile="name" readonly></div><div class="fx-v2-row"><label>Teléfono</label><input data-profile="phone" inputmode="tel" placeholder="Agregar teléfono" readonly></div><div class="fx-v2-row"><label>Correo</label><input data-profile="email" inputmode="email" placeholder="Agregar correo" readonly></div><div class="fx-v2-row"><label>Notas</label><input data-profile="notes" placeholder="Agregar una nota" readonly></div></div><div class="fx-v2-actions"><button class="green" id="fx-v2-copy">Copiar dirección</button><button id="fx-v2-center">Centrar ubicación</button></div>';document.body.appendChild(c);
 var p=loadProfile();qsa('[data-profile]',c).forEach(function(i){i.value=p[i.getAttribute('data-profile')]||''});qs('.fx-v2-name',c).textContent=p.name||'Fx User';
 qs('.fx-v2-close',c).addEventListener('click',function(){toggleCard(false)});qs('#fx-v2-address',c).addEventListener('click',copyAddress);qs('#fx-v2-copy',c).addEventListener('click',copyAddress);qs('#fx-v2-center',c).addEventListener('click',centerGps);
 qs('#fx-v2-edit',c).addEventListener('click',function(){var editing=this.getAttribute('data-edit')==='1';if(editing){saveProfile();qsa('[data-profile]',c).forEach(function(i){i.readOnly=true});this.textContent='Editar';this.setAttribute('data-edit','0')}else{qsa('[data-profile]',c).forEach(function(i){i.readOnly=false});this.textContent='Guardar';this.setAttribute('data-edit','1');var first=qs('[data-profile]',c);if(first)first.focus()}});
 qs('#fx-v2-photo',c).addEventListener('change',function(e){var f=e.target.files&&e.target.files[0];if(!f)return;saveMemoji(f).then(function(){applyMemoji(f)});e.target.value=''});
 getMemoji().then(applyMemoji);placeAtCenter();
}
function applyMemoji(blob){if(!blob)return;if(state.memojiUrl)URL.revokeObjectURL(state.memojiUrl);state.memojiUrl=URL.createObjectURL(blob);['#fx-v2-user','#fx-v2-card'].forEach(function(sel){var r=qs(sel);if(!r)return;var i=qs('img',r),f=qs('.fx-fallback,.fallback',r);if(i){i.src=state.memojiUrl;i.style.display='block'}if(f)f.style.display='none'})}
function placeAtCenter(){var e=qs('#fx-v2-user');if(e){e.style.left='50%';e.style.top='50%'}}
function metersPerPixel(lat,z){return 156543.03392*Math.cos(lat*Math.PI/180)/Math.pow(2,z)}
function render(){var e=qs('#fx-v2-user'),a=qs('#fx-v2-accuracy'),map=window.__fxMapInstance;if(!e)return;if(state.lat==null||state.lng==null||!map||typeof map.project!=='function'){placeAtCenter();return}try{var p=map.project([state.lng,state.lat]),rect=map.getContainer().getBoundingClientRect(),x=rect.left+p.x,y=rect.top+p.y;e.style.left=x+'px';e.style.top=y+'px';if(state.accuracy){var px=Math.max(34,Math.min(620,(state.accuracy/metersPerPixel(state.lat,map.getZoom()))*2));a.style.display='block';a.style.left=x+'px';a.style.top=y+'px';a.style.width=px+'px';a.style.height=px+'px'}}catch(err){placeAtCenter()}}
function updatePos(p){state.lat=p.coords.latitude;state.lng=p.coords.longitude;state.accuracy=p.coords.accuracy;state.lastTime=p.timestamp;var n=Math.max(1,Math.round(state.accuracy||0)),d=new Date(p.timestamp);var b=qs('#fx-v2-user .fx-acc');if(b)b.textContent='± '+n+' m';var meta=qs('#fx-v2-meta');if(meta)meta.textContent='Hamilton · '+state.lat.toFixed(5)+', '+state.lng.toFixed(5);var as=qs('#fx-v2-accstat');if(as)as.textContent='± '+n+' m';var tm=qs('#fx-v2-time');if(tm)tm.textContent=d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});render();reverseAddress()}
function gpsError(e){var b=qs('#fx-v2-user .fx-acc');if(b)b.textContent=e&&e.code===1?'GPS OFF':'GPS…';placeAtCenter()}
var reverseTimer=0;function reverseAddress(){clearTimeout(reverseTimer);reverseTimer=setTimeout(function(){if(state.lat==null)return;var token=mapboxgl&&mapboxgl.accessToken;var url='https://api.mapbox.com/geocoding/v5/mapbox.places/'+state.lng+','+state.lat+'.json?types=address,place,locality,neighborhood&limit=1&access_token='+encodeURIComponent(token||'');fetch(url).then(function(r){if(!r.ok)throw new Error('geo');return r.json()}).then(function(d){var f=d&&d.features&&d.features[0];if(f){state.address=f.place_name||f.text||state.address;var el=qs('#fx-v2-address');if(el)el.textContent=state.address}}).catch(function(){})},420)}
function copyAddress(){var t=state.address&&state.address!=='Obteniendo dirección…'?state.address:(state.lat!=null?state.lat.toFixed(6)+', '+state.lng.toFixed(6):'');if(!t)return;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).catch(function(){});var e=qs('#fx-v2-address');if(e){var old=e.textContent;e.textContent='✓ Dirección copiada';setTimeout(function(){e.textContent=old},900)}}
function toggleCard(open){var c=qs('#fx-v2-card');if(!c)return;state.cardOpen=!!open;c.classList.toggle('open',!!open)}
function centerGps(){var map=window.__fxMapInstance;if(!map||state.lat==null)return;try{map.easeTo({center:[state.lng,state.lat],zoom:Math.max(map.getZoom(),17),duration:650,essential:true})}catch(e){}setTimeout(render,60)}
function bindMap(){var map=window.__fxMapInstance;if(!map)return;['move','zoom','rotate','pitch','resize'].forEach(function(ev){try{map.on(ev,render)}catch(e){}});render()}
function labelOrganizer(root){if(!root)return;root.classList.add('fx-defined-frame','fx-organizer-frame');var buttons=qsa('button',root);var tabs=buttons.filter(function(b){var t=(b.textContent||'').trim();return /^(Rutas|Hashtags|Lugares|Favoritos|Resumen|Ajustes|Todos los lugares|Vista protegida)$/i.test(t)});if(tabs.length){var parent=tabs[0].parentElement;if(parent)parent.classList.add('fx-org-tabs');tabs.forEach(function(b){b.classList.add('fx-org-tab');var cs=getComputedStyle(b),bg=cs.backgroundColor;if(b.classList.contains('active')||b.getAttribute('aria-selected')==='true'||b.getAttribute('aria-pressed')==='true'||(bg&&bg!=='rgba(0, 0, 0, 0)'&&bg!=='transparent'))b.classList.add('fx-org-tab-active')})}buttons.forEach(function(b){var t=(b.textContent||'').trim();if(/Crear una ruta|Guardar|Continuar|Agregar/i.test(t))b.classList.add('fx-primary-action')})}
function scanFrames(){var vw=innerWidth||document.documentElement.clientWidth,vh=innerHeight||document.documentElement.clientHeight;qsa('[role="dialog"],dialog[open],[aria-modal="true"],body [class*="modal"],body [class*="sheet"],body [class*="drawer"],body [id*="modal"],body [id*="organizer"],body [id*="places"],body [id*="menu"]').forEach(function(el){if(el.id==='fx-v2-card'||el.id==='fx-v2-user'||el.id==='fx-v2-accuracy')return;var cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return;var r=el.getBoundingClientRect(),big=r.width>=vw*.55&&r.height>=vh*.22,txt=(el.textContent||'').replace(/\s+/g,' ').trim();if(big){el.classList.add('fx-defined-frame');if(/Organizador|Todo lo que guardas|Rutas guardadas|Mis lugares|Lugares registrados|Vista protegida/i.test(txt))labelOrganizer(el)}})}
function installJoystick(){var pad=qs('.dpad');if(!pad||pad.getAttribute('data-fx-v2')==='1')return false;pad.setAttribute('data-fx-v2','1');pad.style.touchAction='none';var active=false,pid=null,sx=0,sy=0,lx=0,ly=0,moved=false,centerCandidate=false,clickTimer=0,lastCenterTap=0;var sensitivity=4.8,dead=1.2,maxStep=118;
 function map(){return window.__fxMapInstance}
 function pan(dx,dy,duration){var m=map();if(!m||typeof m.panBy!=='function')return;var x=Math.max(-maxStep,Math.min(maxStep,dx*sensitivity)),y=Math.max(-maxStep,Math.min(maxStep,dy*sensitivity));if(Math.abs(x)<dead&&Math.abs(y)<dead)return;try{m.panBy([x,y],{duration:duration||0,animate:(duration||0)>0,essential:true})}catch(e){}}
 function zone(e){var r=pad.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,rad=Math.min(r.width,r.height)/2,dist=Math.sqrt(dx*dx+dy*dy);return{center:dist<rad*.36,dx:dx,dy:dy,rad:rad}}
 function start(e){if(e.pointerType==='mouse'&&e.button!==0)return;var z=zone(e);active=true;pid=e.pointerId;sx=lx=e.clientX;sy=ly=e.clientY;moved=false;centerCandidate=z.center;try{pad.setPointerCapture(pid)}catch(x){};e.stopImmediatePropagation();if(e.cancelable)e.preventDefault()}
 function move(e){if(!active||e.pointerId!==pid)return;var dx=e.clientX-lx,dy=e.clientY-ly;lx=e.clientX;ly=e.clientY;if(Math.abs(e.clientX-sx)>3||Math.abs(e.clientY-sy)>3)moved=true;if(!centerCandidate||moved)pan(dx,dy,0);e.stopImmediatePropagation();if(e.cancelable)e.preventDefault()}
 function finish(e){if(!active||e.pointerId!==pid)return;active=false;try{pad.releasePointerCapture(pid)}catch(x){};var z=zone(e);if(centerCandidate&&!moved&&z.center){var now=Date.now();if(now-lastCenterTap<330){clearTimeout(clickTimer);clickTimer=0;lastCenterTap=0;toggleCard(false);centerGps()}else{lastCenterTap=now;clickTimer=setTimeout(function(){lastCenterTap=0;toggleCard(!state.cardOpen)},280)}}else if(!moved){var ax=Math.abs(z.dx),ay=Math.abs(z.dy),step=26;if(ax>ay)pan(z.dx>0?step:-step,0,160);else pan(0,z.dy>0?step:-step,160)}e.stopImmediatePropagation();if(e.cancelable)e.preventDefault();pid=null}
 pad.addEventListener('pointerdown',start,true);pad.addEventListener('pointermove',move,true);pad.addEventListener('pointerup',finish,true);pad.addEventListener('pointercancel',finish,true);pad.addEventListener('click',function(e){e.stopImmediatePropagation();e.preventDefault()},true);pad.addEventListener('dblclick',function(e){e.stopImmediatePropagation();e.preventDefault()},true);return true}
function bootJoystick(){if(installJoystick())return;var n=0,t=setInterval(function(){n++;if(installJoystick()||n>120)clearInterval(t)},100)}
function boot(){build();bootJoystick();if(navigator.geolocation)navigator.geolocation.watchPosition(updatePos,gpsError,{enableHighAccuracy:true,maximumAge:0,timeout:15000});bindMap();window.addEventListener('fx-map-ready',function(){bindMap();bootJoystick()});new MutationObserver(function(){scanFrames();bootJoystick()}).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','open','aria-hidden']});window.addEventListener('resize',render);setTimeout(scanFrames,100);setTimeout(scanFrames,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>`;

    if (!html.includes('fx-v2-script')) {
      html = html.includes('</body>') ? html.replace('</body>', injected + '\n</body>') : html + '\n' + injected;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(html);
  } catch (error) {
    console.error('FX Map v2 loader error', error);
    res.status(500).send('FX Map loader error');
  }
};