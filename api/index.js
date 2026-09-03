const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(file, 'utf8');

    const mapNeedle = "// Disable all zoom controls";
    const mapBridge = "window.__fxMapInstance = map;\nwindow.dispatchEvent(new CustomEvent('fx-map-ready', { detail: { map } }));\n";
    if (!html.includes('window.__fxMapInstance = map;') && html.includes(mapNeedle)) {
      html = html.replace(mapNeedle, `${mapBridge}${mapNeedle}`);
    }

    const inlineGps = `
<style id="fx-inline-gps-style">
#fx-inline-accuracy{position:fixed;z-index:2147482000;border:2px solid rgba(10,132,255,.5);background:rgba(10,132,255,.10);border-radius:50%;pointer-events:none;display:none;transform:translate(-50%,-50%)}
#fx-inline-user{position:fixed;z-index:2147483000;display:flex;flex-direction:column;align-items:center;gap:5px;transform:translate(-50%,-50%);cursor:pointer;user-select:none;-webkit-user-select:none}
#fx-inline-user .ring{position:relative;width:66px;height:66px;border-radius:50%;display:grid;place-items:center}
#fx-inline-user .ring:before,#fx-inline-user .ring:after{content:'';position:absolute;inset:-7px;border:2px solid rgba(10,132,255,.64);border-radius:50%;box-shadow:0 0 22px rgba(10,132,255,.32);animation:fxInlinePulse 2.2s ease-out infinite}
#fx-inline-user .ring:after{inset:-14px;animation-delay:1.1s;opacity:.5}
#fx-inline-user img,#fx-inline-user .fallback{position:relative;z-index:2;width:56px;height:56px;border-radius:50%;border:2px solid rgba(255,255,255,.96);box-shadow:0 5px 18px rgba(0,0,0,.58);background:#10131a}
#fx-inline-user img{display:none;object-fit:cover}
#fx-inline-user .fallback{display:grid;place-items:center;font-size:32px}
#fx-inline-user .acc{padding:5px 8px;border-radius:999px;background:rgba(6,8,12,.96);border:1px solid rgba(10,132,255,.48);color:#bfe7ff;font:800 11px/1 -apple-system,BlinkMacSystemFont,'SF Pro Text',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,.36)}
#fx-inline-file{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
@keyframes fxInlinePulse{0%{transform:scale(.78);opacity:.75}72%,100%{transform:scale(1.35);opacity:0}}
</style>
<script id="fx-inline-gps-script">
(()=>{ 'use strict';
const S={lat:null,lng:null,accuracy:null,url:null,centered:false};
function openDb(){return new Promise((ok,no)=>{const r=indexedDB.open('fx-map-gps',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('media'))r.result.createObjectStore('media')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
async function getMemoji(){try{const d=await openDb();return await new Promise((ok,no)=>{const r=d.transaction('media','readonly').objectStore('media').get('memoji');r.onsuccess=()=>ok(r.result||null);r.onerror=()=>no(r.error)})}catch(_){return null}}
async function saveMemoji(file){try{const d=await openDb();await new Promise((ok,no)=>{const tx=d.transaction('media','readwrite');tx.objectStore('media').put(file,'memoji');tx.oncomplete=ok;tx.onerror=()=>no(tx.error)})}catch(_){}}
function build(){if(document.getElementById('fx-inline-user'))return;const a=document.createElement('div');a.id='fx-inline-accuracy';document.body.appendChild(a);const e=document.createElement('div');e.id='fx-inline-user';e.innerHTML='<div class="ring"><img alt="Memoji"><div class="fallback">🙂</div></div><div class="acc">GPS…</div><input id="fx-inline-file" type="file" accept="image/*">';document.body.appendChild(e);e.addEventListener('click',()=>document.getElementById('fx-inline-file').click());document.getElementById('fx-inline-file').addEventListener('change',async ev=>{const f=ev.target.files&&ev.target.files[0];if(!f)return;await saveMemoji(f);applyMemoji(f);ev.target.value=''});restoreMemoji();placeFallback()}
function applyMemoji(blob){if(!blob)return;if(S.url)URL.revokeObjectURL(S.url);S.url=URL.createObjectURL(blob);const e=document.getElementById('fx-inline-user');if(!e)return;const i=e.querySelector('img'),f=e.querySelector('.fallback');i.src=S.url;i.style.display='block';f.style.display='none'}
async function restoreMemoji(){applyMemoji(await getMemoji())}
function placeFallback(){const e=document.getElementById('fx-inline-user');if(!e)return;e.style.left='50%';e.style.top='50%'}
function metersPerPixel(lat,zoom){return 156543.03392*Math.cos(lat*Math.PI/180)/Math.pow(2,zoom)}
function render(){const e=document.getElementById('fx-inline-user');const c=document.getElementById('fx-inline-accuracy');if(!e)return;const m=window.__fxMapInstance;if(S.lat==null||S.lng==null||!m||typeof m.project!=='function'){placeFallback();return}try{const p=m.project([S.lng,S.lat]);const rect=m.getContainer().getBoundingClientRect();const x=rect.left+p.x,y=rect.top+p.y;e.style.left=x+'px';e.style.top=y+'px';if(S.accuracy){const px=Math.max(20,Math.min(600,(S.accuracy/metersPerPixel(S.lat,m.getZoom()))*2));c.style.display='block';c.style.left=x+'px';c.style.top=y+'px';c.style.width=px+'px';c.style.height=px+'px'}if(!S.centered){S.centered=true;m.easeTo({center:[S.lng,S.lat],zoom:Math.max(m.getZoom(),17),duration:700,essential:true})}}catch(_){placeFallback()}}
function pos(p){S.lat=p.coords.latitude;S.lng=p.coords.longitude;S.accuracy=p.coords.accuracy;const b=document.querySelector('#fx-inline-user .acc');if(b)b.textContent='± '+Math.max(1,Math.round(S.accuracy||0))+' m';window.__fxGPSState={lat:S.lat,lng:S.lng,accuracy:S.accuracy,timestamp:p.timestamp};render()}
function err(e){const b=document.querySelector('#fx-inline-user .acc');if(b)b.textContent=e&&e.code===1?'GPS OFF':'GPS…';placeFallback()}
function hookMap(){const m=window.__fxMapInstance;if(!m)return;['move','zoom','rotate','pitch','resize'].forEach(ev=>{try{m.on(ev,render)}catch(_){}});render()}
function boot(){build();if(navigator.geolocation)navigator.geolocation.watchPosition(pos,err,{enableHighAccuracy:true,maximumAge:0,timeout:15000});else err({code:2});hookMap();window.addEventListener('fx-map-ready',hookMap);setTimeout(hookMap,300);setTimeout(hookMap,1200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>`;

    const frameUi = `
<style id="fx-modal-frame-style">
.fx-defined-frame{border:1px solid rgba(255,255,255,.14)!important;box-shadow:0 22px 70px rgba(0,0,0,.68),inset 0 1px 0 rgba(255,255,255,.055),inset 0 0 0 1px rgba(0,134,223,.035)!important;overflow:hidden}
.fx-defined-frame:before{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px rgba(0,0,0,.65)}
.fx-defined-frame [class*="tab"],.fx-defined-frame [class*="seg"],.fx-defined-frame [class*="card"],.fx-defined-frame [class*="item"]{border-color:rgba(255,255,255,.09)}
.fx-defined-frame [class*="header"]{border-bottom-color:rgba(255,255,255,.10)!important}
.fx-defined-frame [class*="tabs"],.fx-defined-frame [class*="segmented"]{border:1px solid rgba(255,255,255,.085)!important;border-radius:13px;overflow:hidden}
</style>
<script id="fx-modal-frame-script">
(()=>{'use strict';
function markFrames(){
  const vw=innerWidth||document.documentElement.clientWidth,vh=innerHeight||document.documentElement.clientHeight;
  document.querySelectorAll('body *').forEach(el=>{
    if(el.id==='map'||el.id==='fx-inline-user'||el.id==='fx-inline-accuracy'||el.classList.contains('fx-defined-frame'))return;
    const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||cs.opacity==='0')return;
    const r=el.getBoundingClientRect();
    const fixed=cs.position==='fixed'||cs.position==='absolute';
    const big=r.width>=vw*.72&&r.height>=vh*.28;
    const rounded=parseFloat(cs.borderTopLeftRadius||'0')>=12;
    const dark=/rgba?\((?:0|[0-3]?\d),\s*(?:0|[0-3]?\d),\s*(?:0|[0-3]?\d)/.test(cs.backgroundColor)||cs.backgroundColor==='rgb(0, 0, 0)';
    const named=/(modal|sheet|drawer|panel|organizer|places|menu)/i.test((el.id||'')+' '+(el.className||''));
    if((fixed&&big&&rounded&&dark)||(named&&big&&rounded))el.classList.add('fx-defined-frame');
  });
}
let queued=false;function scan(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;markFrames()})}
new MutationObserver(scan).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
addEventListener('resize',scan);document.addEventListener('click',()=>setTimeout(scan,30),true);setTimeout(scan,0);setTimeout(scan,400);
})();
</script>`;

    if (!html.includes('fx-inline-gps-script')) {
      html = html.includes('</body>') ? html.replace('</body>', `${inlineGps}\n${frameUi}\n</body>`) : `${html}\n${inlineGps}\n${frameUi}`;
    } else if (!html.includes('fx-modal-frame-script')) {
      html = html.includes('</body>') ? html.replace('</body>', `${frameUi}\n</body>`) : `${html}\n${frameUi}`;
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
