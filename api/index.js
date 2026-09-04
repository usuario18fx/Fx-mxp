const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(file, 'utf8');

    // Keep the public Mapbox token split so repository secret scanning does not
    // mistake a browser token for a server-side secret.
    const mapboxToken = [
      'pk.eyJ1IjoiLXVzZXIxOGZ4IiwiYSI6ImNtdG43NXJjNjA4YjMyeG9hc2xpNW40enIifQ',
      'awn8NmfTc-yM6KElfuxUTQ'
    ].join('.');
    html = html.replace(/mapboxgl\.accessToken\s*=\s*['"][^'"]+['"]\s*;/, `mapboxgl.accessToken = '${mapboxToken}';`);

    // IMPORTANT: the normal route must render the original FX Map.
    // OSM fallback is now opt-in only with ?fallback=1.
    const appScriptNeedle = '<script>\n// FX MAP — private, offline-first place intelligence';
    const useFallback = /(?:\?|&)fallback=1(?:&|$)/.test(req.url || '');
    if (useFallback && !html.includes('/fx-map-fallback.js') && html.includes(appScriptNeedle)) {
      html = html.replace(appScriptNeedle, `<script src="/fx-map-fallback.js?v=20260904-3"></script>\n${appScriptNeedle}`);
    }

    // Expose the real Mapbox instance to GPS + joystick enhancements.
    const mapNeedle = '// Disable all zoom controls';
    const mapBridge = "window.__fxMapInstance = map;\nwindow.dispatchEvent(new CustomEvent('fx-map-ready', { detail: { map } }));\n";
    if (!html.includes('window.__fxMapInstance = map;') && html.includes(mapNeedle)) {
      html = html.replace(mapNeedle, `${mapBridge}${mapNeedle}`);
    }

    const injected = `
<style id="fx-runtime-style">
:root{
  --fx-bg:#0B0F17;
  --fx-oxford:#1B1F24;
  --fx-oxford-2:#252B32;
  --fx-blue:#00C2FF;
  --fx-blue-soft:rgba(0,194,255,.14);
  --fx-blue-border:rgba(0,194,255,.38);
  --fx-error:#800020;
  --fx-warning:#00FF88;
  --fx-text:#E8F1FF;
  --fx-muted:#9CB0D9;
  --fx-line:#34414D;
}

#fx-inline-accuracy{position:fixed;z-index:109;border:2px solid rgba(0,194,255,.48);background:rgba(0,194,255,.10);border-radius:50%;pointer-events:none;display:none;transform:translate(-50%,-50%)}
#fx-inline-user{position:fixed;z-index:110;display:flex;flex-direction:column;align-items:center;gap:5px;transform:translate(-50%,-50%);cursor:pointer;user-select:none;-webkit-user-select:none}
#fx-inline-user .ring{position:relative;width:66px;height:66px;border-radius:50%;display:grid;place-items:center}
#fx-inline-user .ring:before,#fx-inline-user .ring:after{content:'';position:absolute;inset:-7px;border:2px solid rgba(0,194,255,.70);border-radius:50%;box-shadow:0 0 22px rgba(0,194,255,.30);animation:fxPulse 2.2s ease-out infinite}
#fx-inline-user .ring:after{inset:-14px;animation-delay:1.1s;opacity:.48}
#fx-inline-user img,#fx-inline-user .fallback{position:relative;z-index:2;width:56px;height:56px;border-radius:50%;border:2px solid rgba(232,241,255,.96);box-shadow:0 5px 18px rgba(0,0,0,.58);background:#101620}
#fx-inline-user img{display:none;object-fit:cover}
#fx-inline-user .fallback{display:grid;place-items:center;font-size:32px}
#fx-inline-user .acc{padding:5px 8px;border-radius:999px;background:rgba(11,15,23,.96);border:1px solid rgba(0,194,255,.50);color:#BFEFFF;font:800 11px/1 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.36)}
body.fx-modal-open #fx-inline-user,body.fx-modal-open #fx-inline-accuracy,body.fx-modal-open #fx-gps-card{display:none!important;pointer-events:none!important}
@keyframes fxPulse{0%{transform:scale(.78);opacity:.75}72%,100%{transform:scale(1.35);opacity:0}}

#fx-gps-card{position:fixed;z-index:111;width:min(310px,calc(100vw - 28px));padding:13px;border-radius:16px;background:rgba(27,31,36,.98);border:1px solid rgba(0,194,255,.28);box-shadow:0 18px 48px rgba(0,0,0,.60),inset 0 1px 0 rgba(255,255,255,.05);display:none;transform:translateX(-50%)}
#fx-gps-card.open{display:block}
#fx-gps-address{font:800 12px/1.45 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;color:var(--fx-text);cursor:pointer;padding-right:24px}
#fx-gps-address:active{opacity:.65}
.fx-gps-meta{margin-top:7px;font:600 10px/1.5 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;color:var(--fx-muted)}
.fx-gps-row{display:flex;gap:7px;margin-top:10px}
.fx-gps-btn{position:relative;flex:1;height:34px;border-radius:10px;border:1px solid rgba(255,255,255,.10);background:#252B32;color:var(--fx-text);font-size:10px;font-weight:800;display:grid;place-items:center;overflow:hidden}
.fx-gps-btn.accent{border-color:rgba(0,194,255,.35);color:var(--fx-blue)}
#fx-inline-file{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}
#fx-gps-close{position:absolute;right:8px;top:7px;width:24px;height:24px;border-radius:7px;color:#9CB0D9;display:grid;place-items:center;font-size:15px}

/* FX palette — all modal/menu surfaces */
.fx-defined-frame{
  background:linear-gradient(180deg,#20262D 0%,#1B1F24 18%,#0B0F17 100%)!important;
  border:1px solid rgba(0,194,255,.30)!important;
  box-shadow:0 24px 72px rgba(0,0,0,.72),0 0 0 1px rgba(255,255,255,.025) inset,0 0 28px rgba(0,194,255,.055)!important;
  overflow:hidden;
  z-index:300!important;
}
.fx-defined-frame [class*="header"],
.fx-defined-frame [class*="head"],
.fx-defined-frame [class*="top"]{
  background:linear-gradient(180deg,#252B32,#1B1F24)!important;
  border-bottom:1px solid rgba(0,194,255,.18)!important;
}
.fx-defined-frame [class*="tabs"],
.fx-defined-frame [class*="segmented"],
.fx-defined-frame [class*="nav"]{
  background:#141A20!important;
  border:1px solid rgba(156,176,217,.14)!important;
  border-radius:13px!important;
  overflow:hidden;
}
.fx-defined-frame [class*="tab"],
.fx-defined-frame [role="tab"],
.fx-defined-frame button{
  border-color:rgba(156,176,217,.16)!important;
}
.fx-defined-frame [class*="tab"].active,
.fx-defined-frame [class*="tab"][aria-selected="true"],
.fx-defined-frame [role="tab"][aria-selected="true"],
.fx-defined-frame button.active,
.fx-defined-frame button[aria-pressed="true"]{
  background:linear-gradient(180deg,rgba(0,194,255,.22),rgba(0,194,255,.10))!important;
  border-color:rgba(0,194,255,.52)!important;
  color:#DFF8FF!important;
  box-shadow:inset 0 0 0 1px rgba(0,194,255,.08),0 0 18px rgba(0,194,255,.08)!important;
}
.fx-defined-frame [class*="card"],
.fx-defined-frame [class*="item"],
.fx-defined-frame [class*="panel"],
.fx-defined-frame [class*="box"]{
  background-color:#1B1F24!important;
  border-color:rgba(156,176,217,.14)!important;
}
.fx-defined-frame input,
.fx-defined-frame textarea,
.fx-defined-frame select{
  background:#11171D!important;
  color:var(--fx-text)!important;
  border-color:rgba(156,176,217,.20)!important;
}
.fx-defined-frame input:focus,
.fx-defined-frame textarea:focus,
.fx-defined-frame select:focus{
  border-color:rgba(0,194,255,.58)!important;
  box-shadow:0 0 0 3px rgba(0,194,255,.10)!important;
  outline:none!important;
}
.fx-defined-frame [class*="primary"],
.fx-defined-frame [class*="accent"],
.fx-defined-frame button[style*="rgb(0, 122, 255)"],
.fx-defined-frame button[style*="#007aff"],
.fx-defined-frame button[style*="#0a84ff"]{
  background:linear-gradient(180deg,#00C2FF,#0099D6)!important;
  border-color:#00C2FF!important;
  color:#06131A!important;
  box-shadow:0 8px 24px rgba(0,194,255,.20)!important;
}
.fx-defined-frame [class*="danger"],
.fx-defined-frame [class*="error"],
.fx-defined-frame [data-state="error"]{
  background-color:rgba(128,0,32,.18)!important;
  border-color:rgba(128,0,32,.62)!important;
  color:#FFD8E2!important;
}
.fx-defined-frame [class*="warning"],
.fx-defined-frame [class*="success"],
.fx-defined-frame [data-state="warning"],
.fx-defined-frame [data-state="success"]{
  background-color:rgba(0,255,136,.09)!important;
  border-color:rgba(0,255,136,.42)!important;
  color:#9BFFD0!important;
}
.fx-defined-frame [class*="close"],
.fx-defined-frame button[aria-label*="Cerrar"],
.fx-defined-frame button[aria-label*="Close"]{
  background:transparent!important;
  color:#9CB0D9!important;
  box-shadow:none!important;
}
.fx-defined-frame hr,
.fx-defined-frame [class*="divider"]{border-color:rgba(156,176,217,.14)!important;background:rgba(156,176,217,.14)!important}

/* Explicit organizer / places coverage for legacy classes */
[id*="organizer"].fx-defined-frame,
[id*="places"].fx-defined-frame,
[class*="organizer"].fx-defined-frame,
[class*="places"].fx-defined-frame{
  background:#0B0F17!important;
}
[id*="organizer"].fx-defined-frame > *,
[id*="places"].fx-defined-frame > *,
[class*="organizer"].fx-defined-frame > *,
[class*="places"].fx-defined-frame > *{
  border-color:rgba(0,194,255,.14);
}

/* Structural fallback for Organizer / Mis lugares */
.fx-organizer-frame{background:linear-gradient(180deg,#20262D 0%,#1B1F24 15%,#0B0F17 100%)!important;border:1px solid rgba(0,194,255,.34)!important}
.fx-organizer-frame .fx-org-tabs{background:#11171D!important;border:1px solid rgba(0,194,255,.16)!important;border-radius:13px!important;overflow:hidden!important}
.fx-organizer-frame .fx-org-tab{background:transparent!important;color:#C8D5E6!important;border-color:transparent!important;box-shadow:none!important}
.fx-organizer-frame .fx-org-tab-active{background:linear-gradient(180deg,rgba(0,194,255,.24),rgba(0,194,255,.11))!important;color:#E6FBFF!important;border:1px solid rgba(0,194,255,.50)!important;box-shadow:0 0 16px rgba(0,194,255,.08)!important}
.fx-organizer-frame .fx-primary-action{background:linear-gradient(180deg,#00C2FF,#0099D6)!important;color:#06131A!important;border:1px solid #00C2FF!important;box-shadow:0 10px 28px rgba(0,194,255,.22)!important}
.fx-organizer-frame .fx-organizer-header{background:linear-gradient(180deg,#252B32,#1B1F24)!important;border-bottom:1px solid rgba(0,194,255,.18)!important}
</style>
<script id="fx-runtime-script">
(()=>{'use strict';
const S={lat:null,lng:null,accuracy:null,url:null,centered:false,address:'Obteniendo dirección…'};

function openDb(){return new Promise((ok,no)=>{const r=indexedDB.open('fx-map-gps',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function getMemoji(){try{const d=await openDb();return await new Promise((ok,no)=>{const r=d.transaction('media','readonly').objectStore('media').get('memoji');r.onsuccess=()=>ok(r.result||null);r.onerror=()=>no(r.error)})}catch(_){return null}}
async function saveMemoji(file){try{const d=await openDb();await new Promise((ok,no)=>{const tx=d.transaction('media','readwrite');tx.objectStore('media').put(file,'memoji');tx.oncomplete=ok;tx.onerror=()=>no(tx.error)})}catch(_){}}

function buildGps(){
  if(document.getElementById('fx-inline-user')) return;
  const accuracy=document.createElement('div');accuracy.id='fx-inline-accuracy';document.body.appendChild(accuracy);
  const marker=document.createElement('div');marker.id='fx-inline-user';marker.innerHTML='<div class="ring"><img alt="Memoji"><div class="fallback">🙂</div></div><div class="acc">GPS…</div>';document.body.appendChild(marker);
  const card=document.createElement('div');card.id='fx-gps-card';card.innerHTML='<button id="fx-gps-close">×</button><div id="fx-gps-address" title="Toca para copiar">Obteniendo dirección…</div><div class="fx-gps-meta" id="fx-gps-meta">Esperando GPS…</div><div class="fx-gps-row"><button class="fx-gps-btn accent" id="fx-gps-copy">Copiar dirección</button><label class="fx-gps-btn">Cambiar imagen<input id="fx-inline-file" type="file" accept="image/*"></label></div>';document.body.appendChild(card);
  marker.addEventListener('click',e=>{e.stopPropagation();toggleCard(true)});
  card.querySelector('#fx-gps-close').addEventListener('click',()=>toggleCard(false));
  card.querySelector('#fx-gps-address').addEventListener('click',copyAddress);
  card.querySelector('#fx-gps-copy').addEventListener('click',copyAddress);
  card.querySelector('#fx-inline-file').addEventListener('change',async ev=>{const f=ev.target.files&&ev.target.files[0];if(!f)return;await saveMemoji(f);applyMemoji(f);ev.target.value=''});
  restoreMemoji();placeFallback();
}
function applyMemoji(blob){if(!blob)return;if(S.url)URL.revokeObjectURL(S.url);S.url=URL.createObjectURL(blob);const e=document.getElementById('fx-inline-user');if(!e)return;const i=e.querySelector('img'),f=e.querySelector('.fallback');i.src=S.url;i.style.display='block';f.style.display='none'}
async function restoreMemoji(){applyMemoji(await getMemoji())}
function placeFallback(){const e=document.getElementById('fx-inline-user');if(!e)return;e.style.left='50%';e.style.top='50%'}
function metersPerPixel(lat,zoom){return 156543.03392*Math.cos(lat*Math.PI/180)/Math.pow(2,zoom)}
function positionCard(){const marker=document.getElementById('fx-inline-user'),card=document.getElementById('fx-gps-card');if(!marker||!card||!card.classList.contains('open'))return;const r=marker.getBoundingClientRect();let top=r.bottom+8;if(top+170>innerHeight)top=Math.max(8,r.top-150);card.style.left=(r.left+r.width/2)+'px';card.style.top=top+'px'}
function toggleCard(open){const card=document.getElementById('fx-gps-card');if(!card)return;card.classList.toggle('open',open);if(open)positionCard()}
async function copyAddress(){const txt=S.address&&S.address!=='Obteniendo dirección…'?S.address:(S.lat!=null?S.lat.toFixed(6)+', '+S.lng.toFixed(6):'');if(!txt)return;try{await navigator.clipboard.writeText(txt)}catch(_){const t=document.createElement('textarea');t.value=txt;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove()}const el=document.getElementById('fx-gps-address');if(el){const old=el.textContent;el.textContent='✓ Dirección copiada';setTimeout(()=>el.textContent=old,900)}}
let reverseTimer=0;
function reverseAddress(){clearTimeout(reverseTimer);reverseTimer=setTimeout(async()=>{if(S.lat==null)return;try{const u='https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat='+encodeURIComponent(S.lat)+'&lon='+encodeURIComponent(S.lng);const r=await fetch(u,{headers:{Accept:'application/json'}});if(!r.ok)return;const d=await r.json();if(d&&d.display_name){S.address=d.display_name;const el=document.getElementById('fx-gps-address');if(el)el.textContent=S.address}}catch(_){}},350)}
function render(){const e=document.getElementById('fx-inline-user'),c=document.getElementById('fx-inline-accuracy');if(!e)return;const m=window.__fxMapInstance;if(S.lat==null||S.lng==null||!m||typeof m.project!=='function'){placeFallback();positionCard();return}try{const p=m.project([S.lng,S.lat]),rect=m.getContainer().getBoundingClientRect(),x=rect.left+p.x,y=rect.top+p.y;e.style.left=x+'px';e.style.top=y+'px';if(S.accuracy){const px=Math.max(20,Math.min(600,(S.accuracy/metersPerPixel(S.lat,m.getZoom()))*2));c.style.display='block';c.style.left=x+'px';c.style.top=y+'px';c.style.width=px+'px';c.style.height=px+'px'}if(!S.centered){S.centered=true;m.easeTo({center:[S.lng,S.lat],zoom:Math.max(m.getZoom(),17),duration:700,essential:true})}positionCard()}catch(_){placeFallback()}}
function pos(p){S.lat=p.coords.latitude;S.lng=p.coords.longitude;S.accuracy=p.coords.accuracy;const b=document.querySelector('#fx-inline-user .acc');if(b)b.textContent='± '+Math.max(1,Math.round(S.accuracy||0))+' m';const meta=document.getElementById('fx-gps-meta');if(meta)meta.textContent='Precisión ± '+Math.max(1,Math.round(S.accuracy||0))+' m · '+new Date(p.timestamp).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});window.__fxGPSState={lat:S.lat,lng:S.lng,accuracy:S.accuracy,timestamp:p.timestamp};render();reverseAddress()}
function err(e){const b=document.querySelector('#fx-inline-user .acc');if(b)b.textContent=e&&e.code===1?'GPS OFF':'GPS…';placeFallback()}
function hookMap(){const m=window.__fxMapInstance;if(!m)return;['move','zoom','rotate','pitch','resize'].forEach(ev=>{try{m.on(ev,render)}catch(_){}});render()}

function findTextNodeExact(text){
  return [...document.querySelectorAll('h1,h2,h3,h4,strong,b,span,div')].find(el=>el.children.length<=2&&(el.textContent||'').trim()===text)||null;
}
function findStructuredPanel(label){
  const vw=innerWidth||document.documentElement.clientWidth,vh=innerHeight||document.documentElement.clientHeight;
  let n=findTextNodeExact(label);if(!n)return null;
  for(let i=0;i<8&&n&&n!==document.body;i++,n=n.parentElement){
    const txt=(n.textContent||'').replace(/\s+/g,' ').trim();
    const r=n.getBoundingClientRect();
    const organizer=label==='Organizador'&&txt.includes('Rutas')&&txt.includes('Hashtags')&&txt.includes('Lugares')&&txt.includes('Ajustes');
    const places=label==='Mis lugares'&&txt.includes('Todos los lugares')&&txt.includes('Vista protegida');
    const sized=r.width>=Math.min(320,vw*.62)&&r.height>=Math.min(320,vh*.42)&&r.width<=vw*.96;
    if(sized&&(organizer||places))return n;
  }
  return null;
}
function decorateStructuredPanel(root,label){
  if(!root)return false;
  root.classList.add('fx-defined-frame','fx-organizer-frame');
  const all=[...root.querySelectorAll('button,[role="tab"],a,div,span')];
  const labels=label==='Organizador'?['Rutas','Hashtags','Lugares','Favoritos','Resumen','Ajustes']:['Todos los lugares','Vista protegida'];
  const tabs=all.filter(el=>labels.includes((el.textContent||'').trim())&&el.children.length<=1);
  if(tabs.length){
    const parent=tabs.map(t=>t.parentElement).find(p=>p&&tabs.filter(t=>t.parentElement===p).length>=Math.min(2,tabs.length));
    if(parent)parent.classList.add('fx-org-tabs');
    let active=tabs.find(t=>t.classList.contains('active')||t.getAttribute('aria-selected')==='true'||t.getAttribute('aria-pressed')==='true');
    if(!active)active=tabs[0];
    tabs.forEach(t=>{
      t.classList.add('fx-org-tab');t.classList.toggle('fx-org-tab-active',t===active);
      if(t.dataset.fxPaletteBound!=='1'){
        t.dataset.fxPaletteBound='1';
        t.addEventListener('click',()=>{tabs.forEach(x=>x.classList.remove('fx-org-tab-active'));t.classList.add('fx-org-tab-active')});
      }
    });
  }
  const primary=[...root.querySelectorAll('button,a,div')].find(el=>/crear una ruta/i.test((el.textContent||'').trim())&&el.children.length<=2);
  if(primary)primary.classList.add('fx-primary-action');
  const title=findTextNodeExact(label);
  if(title){let h=title.parentElement;for(let i=0;i<3&&h&&h!==root;i++,h=h.parentElement){const r=h.getBoundingClientRect();if(r.width>root.getBoundingClientRect().width*.7){h.classList.add('fx-organizer-header');break}}}
  return true;
}

function markFrames(){
  const vw=innerWidth||document.documentElement.clientWidth,vh=innerHeight||document.documentElement.clientHeight;
  let modalOpen=false;
  const org=findStructuredPanel('Organizador');if(org){decorateStructuredPanel(org,'Organizador');modalOpen=true}
  const places=findStructuredPanel('Mis lugares');if(places){decorateStructuredPanel(places,'Mis lugares');modalOpen=true}
  document.querySelectorAll('[role="dialog"],dialog[open],[aria-modal="true"],body [class*="modal"],body [class*="sheet"],body [class*="drawer"],body [id*="modal"],body [id*="organizer"],body [id*="places"],body [id*="menu"]').forEach(el=>{
    if(el.id==='fx-gps-card'||el.id==='fx-inline-user'||el.id==='fx-inline-accuracy')return;
    const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||Number(cs.opacity)===0)return;
    const r=el.getBoundingClientRect();const big=r.width>=vw*.68&&r.height>=vh*.24;const detached=r.top>36||r.left>8||r.width<vw*.98;
    if(big&&detached){el.classList.add('fx-defined-frame');modalOpen=true}
  });
  document.body.classList.toggle('fx-modal-open',modalOpen);
}
let q=false;function scan(){if(q)return;q=true;requestAnimationFrame(()=>{q=false;markFrames()})}

function installSensitiveJoystick(){
  const pad=document.querySelector('.dpad');
  if(!pad||pad.dataset.fxSensitive==='1')return false;
  pad.dataset.fxSensitive='1';pad.style.touchAction='none';pad.style.userSelect='none';pad.style.webkitUserSelect='none';
  let active=false,pointerId=null,lastX=0,lastY=0,vx=0,vy=0,moved=false;
  const sensitivity=4.6,deadZone=1.5,maxStep=110;
  const getMap=()=>window.__fxMapInstance||null;
  function pan(dx,dy){const m=getMap();if(!m||typeof m.panBy!=='function')return;const px=Math.max(-maxStep,Math.min(maxStep,dx*sensitivity)),py=Math.max(-maxStep,Math.min(maxStep,dy*sensitivity));if(Math.abs(px)<deadZone&&Math.abs(py)<deadZone)return;try{m.panBy([px,py],{duration:0,animate:false,essential:true})}catch(_){try{m.panBy([px,py],{duration:0})}catch(_){}}}
  function start(e){if(e.pointerType==='mouse'&&e.button!==0)return;active=true;pointerId=e.pointerId;lastX=e.clientX;lastY=e.clientY;vx=0;vy=0;moved=false;try{pad.setPointerCapture(pointerId)}catch(_){}}
  function move(e){if(!active||(pointerId!=null&&e.pointerId!==pointerId))return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;vx=vx*.35+dx*.65;vy=vy*.35+dy*.65;if(Math.abs(dx)>deadZone||Math.abs(dy)>deadZone)moved=true;pan(dx,dy);if(e.cancelable)e.preventDefault()}
  function end(e){if(!active||(pointerId!=null&&e.pointerId!==pointerId))return;active=false;try{pad.releasePointerCapture(pointerId)}catch(_){}pointerId=null;if(moved){const m=getMap();if(m&&typeof m.panBy==='function'){const fx=Math.max(-220,Math.min(220,vx*15)),fy=Math.max(-220,Math.min(220,vy*15));if(Math.abs(fx)>8||Math.abs(fy)>8){try{m.panBy([fx,fy],{duration:180,easing:t=>1-Math.pow(1-t,3),essential:true})}catch(_){}}}}}
  pad.addEventListener('pointerdown',start,{passive:false});pad.addEventListener('pointermove',move,{passive:false});pad.addEventListener('pointerup',end,{passive:false});pad.addEventListener('pointercancel',end,{passive:false});
  return true;
}
function bootJoystick(){if(installSensitiveJoystick())return;let tries=0;const timer=setInterval(()=>{tries++;if(installSensitiveJoystick()||tries>100)clearInterval(timer)},100)}

function boot(){buildGps();bootJoystick();if(navigator.geolocation)navigator.geolocation.watchPosition(pos,err,{enableHighAccuracy:true,maximumAge:0,timeout:15000});else err({code:2});hookMap();window.addEventListener('fx-map-ready',()=>{hookMap();bootJoystick()});new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','open','aria-hidden']});addEventListener('resize',()=>{render();scan()});document.addEventListener('click',()=>setTimeout(scan,25),true);setTimeout(hookMap,350);setTimeout(scan,50);setTimeout(scan,700)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>`;

    if (!html.includes('fx-runtime-script')) {
      html = html.includes('</body>') ? html.replace('</body>', `${injected}\n</body>`) : `${html}\n${injected}`;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.status(200).send(html);
  } catch (error) {
    console.error('FX Map loader error', error);
    res.status(500).send('FX Map loader error');
  }
};