const v4 = require('./index-v4');

function patchNotesFx(html) {
  if (html.includes('FX_NOTES_FLOW_V1')) return html;

  const patch = `
<!-- FX_NOTES_FLOW_V1 -->
<style>
  #fx-note-fab{position:fixed;right:18px;bottom:148px;z-index:10050;border:1px solid rgba(250,204,21,.45);background:rgba(11,15,23,.92);color:#facc15;border-radius:999px;padding:11px 15px;font:700 13px/1 system-ui,-apple-system,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35);backdrop-filter:blur(14px)}
  #fx-note-fab:active{transform:scale(.97)}
  #fx-note-sheet{position:fixed;inset:0;z-index:12000;display:none;align-items:flex-end;background:rgba(0,0,0,.45);backdrop-filter:blur(4px)}
  #fx-note-sheet.open{display:flex}
  .fx-note-card{width:100%;max-height:82dvh;overflow:auto;background:#0b0f17;border:1px solid rgba(255,255,255,.10);border-radius:24px 24px 0 0;padding:18px 16px calc(20px + env(safe-area-inset-bottom));color:#fff;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 -12px 40px rgba(0,0,0,.5)}
  .fx-note-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.fx-note-head h3{margin:0;font-size:18px}.fx-note-close{border:0;background:#171d29;color:#fff;width:34px;height:34px;border-radius:50%;font-size:20px}
  .fx-note-meta{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}.fx-chip{border:1px solid rgba(255,255,255,.12);background:#121824;color:#cbd5e1;border-radius:999px;padding:7px 10px;font-size:12px}
  #fx-note-text{width:100%;min-height:120px;resize:vertical;box-sizing:border-box;border:1px solid rgba(255,255,255,.12);border-radius:16px;background:#111827;color:#fff;padding:13px;font:500 15px/1.4 system-ui,-apple-system,sans-serif;outline:none}
  .fx-note-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:11px}.fx-btn{border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:12px 10px;background:#151b26;color:#fff;font:700 13px/1.1 system-ui,-apple-system,sans-serif}.fx-btn.primary{background:#facc15;color:#171717;border-color:#facc15}.fx-btn.recording{background:#facc15;color:#171717;animation:fxPulse 1.15s infinite}@keyframes fxPulse{50%{box-shadow:0 0 0 7px rgba(250,204,21,.12)}}
  #fx-rec-state{display:none;margin-top:10px;color:#facc15;font:700 12px/1.2 system-ui,-apple-system,sans-serif}#fx-rec-state.show{display:block}
  .fx-place-note-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.fx-place-note-actions button{border:1px solid rgba(250,204,21,.35);background:rgba(250,204,21,.08);color:#facc15;border-radius:12px;padding:9px 11px;font:700 12px system-ui,-apple-system,sans-serif}
</style>
<div id="fx-note-sheet" aria-hidden="true">
  <section class="fx-note-card" role="dialog" aria-modal="true" aria-label="FX Note">
    <div class="fx-note-head"><h3>FX Note</h3><button class="fx-note-close" type="button" aria-label="Cerrar">×</button></div>
    <div class="fx-note-meta"><button id="fx-note-location" class="fx-chip" type="button">＋ Añadir dirección</button><span id="fx-note-time" class="fx-chip"></span></div>
    <textarea id="fx-note-text" placeholder="Escribe una nota…"></textarea>
    <div id="fx-rec-state">● Recording</div>
    <div class="fx-note-actions"><button id="fx-note-record" class="fx-btn" type="button">🎙 Grabar nota</button><button id="fx-note-save" class="fx-btn primary" type="button">Guardar</button></div>
  </section>
</div>
<script>
(function(){
  var sheet, text, locationBtn, recordBtn, recState, timeEl;
  var currentLocation=null, mediaRecorder=null, chunks=[], recording=false, stream=null;
  var STORAGE='fx_notes_v1';

  function safeNotes(){try{return JSON.parse(localStorage.getItem(STORAGE)||'[]')}catch(e){return[]}}
  function saveNotes(list){try{localStorage.setItem(STORAGE,JSON.stringify(list))}catch(e){}}
  function nowLabel(){return new Date().toLocaleString([], {dateStyle:'medium',timeStyle:'short'})}

  function openNote(location, autoRecord){
    currentLocation=location||null;
    text.value='';
    timeEl.textContent=nowLabel();
    locationBtn.textContent=currentLocation && currentLocation.label ? '📍 '+currentLocation.label : '＋ Añadir dirección';
    sheet.classList.add('open'); sheet.setAttribute('aria-hidden','false');
    if(autoRecord) setTimeout(toggleRecord,180);
  }
  function closeNote(){ if(recording) stopRecord(); sheet.classList.remove('open'); sheet.setAttribute('aria-hidden','true'); }

  function getCurrentLocation(){
    return new Promise(function(resolve){
      if(!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(function(p){
        resolve({lat:p.coords.latitude,lng:p.coords.longitude,accuracy:p.coords.accuracy,label:p.coords.latitude.toFixed(5)+', '+p.coords.longitude.toFixed(5)});
      },function(){resolve(null)},{enableHighAccuracy:true,timeout:10000,maximumAge:10000});
    });
  }

  async function addLocation(){
    locationBtn.textContent='Buscando ubicación…';
    var loc=await getCurrentLocation();
    if(loc){currentLocation=loc;locationBtn.textContent='📍 '+loc.label;}else{locationBtn.textContent='＋ Añadir dirección';}
  }

  async function startRecord(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){alert('La grabación no está disponible en este navegador.');return;}
    try{
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true}});
      var opts={};
      if(window.MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/mp4')) opts.mimeType='audio/mp4';
      mediaRecorder=new MediaRecorder(stream,opts); chunks=[];
      mediaRecorder.ondataavailable=function(e){if(e.data&&e.data.size)chunks.push(e.data)};
      mediaRecorder.onstop=function(){
        var blob=new Blob(chunks,{type:mediaRecorder.mimeType||'audio/webm'});
        try{window.__fxLastNoteAudio=blob}catch(e){}
      };
      mediaRecorder.start(500); recording=true;
      recordBtn.classList.add('recording'); recordBtn.textContent='■ Detener'; recState.classList.add('show');
      if(navigator.vibrate) navigator.vibrate(40);
    }catch(e){alert('Necesitas permitir acceso al micrófono para grabar una nota.');}
  }
  function stopRecord(){
    try{if(mediaRecorder&&mediaRecorder.state!=='inactive')mediaRecorder.stop()}catch(e){}
    try{if(stream)stream.getTracks().forEach(function(t){t.stop()})}catch(e){}
    recording=false;recordBtn.classList.remove('recording');recordBtn.textContent='🎙 Grabar nota';recState.classList.remove('show');
    if(navigator.vibrate) navigator.vibrate([30,30,30]);
  }
  function toggleRecord(){recording?stopRecord():startRecord()}

  function saveCurrent(){
    var body=(text.value||'').trim();
    if(!body && !window.__fxLastNoteAudio){text.focus();return;}
    var list=safeNotes();
    list.unshift({id:'fxn_'+Date.now(),text:body,createdAt:new Date().toISOString(),location:currentLocation||null,hasAudio:!!window.__fxLastNoteAudio});
    saveNotes(list); window.__fxLastNoteAudio=null; closeNote();
    try{window.dispatchEvent(new CustomEvent('fx-note-saved',{detail:list[0]}))}catch(e){}
  }

  function extractLocationFrom(container){
    if(!container)return null;
    var s=(container.innerText||'').replace(/\s+/g,' ').trim();
    var m=s.match(/(-?\d{1,2}\.\d{3,})\s*[, ]\s*(-?\d{1,3}\.\d{3,})/);
    var label='Dirección seleccionada';
    var candidates=container.querySelectorAll('[data-address],.address,.dm-address,[class*=address]');
    for(var i=0;i<candidates.length;i++){var t=(candidates[i].textContent||'').trim();if(t.length>5){label=t;break}}
    return m?{lat:Number(m[1]),lng:Number(m[2]),label:label}:{label:label};
  }

  function enhancePlaceModals(){
    var nodes=document.querySelectorAll('[role=dialog],dialog,.modal,[class*=modal],[id*=modal]');
    nodes.forEach(function(n){
      if(n.dataset.fxNoteEnhanced==='1')return;
      var s=(n.innerText||'').toLowerCase();
      if(!(s.includes('dirección')||s.includes('direccion')||s.includes('coordenad')))return;
      n.dataset.fxNoteEnhanced='1';
      var wrap=document.createElement('div');wrap.className='fx-place-note-actions';
      var add=document.createElement('button');add.type='button';add.textContent='＋ Agregar nota';
      var rec=document.createElement('button');rec.type='button';rec.textContent='🎙 Grabar nota';
      add.onclick=function(){openNote(extractLocationFrom(n),false)};
      rec.onclick=function(){openNote(extractLocationFrom(n),true)};
      wrap.appendChild(add);wrap.appendChild(rec);
      var target=n.querySelector('.modal-body,.sheet-body,.dm-body,[class*=body]')||n; target.appendChild(wrap);
    });
  }

  function boot(){
    sheet=document.getElementById('fx-note-sheet');text=document.getElementById('fx-note-text');locationBtn=document.getElementById('fx-note-location');recordBtn=document.getElementById('fx-note-record');recState=document.getElementById('fx-rec-state');timeEl=document.getElementById('fx-note-time');
    if(!sheet)return;
    var fab=document.createElement('button');fab.id='fx-note-fab';fab.type='button';fab.textContent='＋ FX Note';fab.onclick=function(){openNote(null,false)};document.body.appendChild(fab);
    sheet.querySelector('.fx-note-close').onclick=closeNote;sheet.addEventListener('click',function(e){if(e.target===sheet)closeNote()});
    locationBtn.onclick=addLocation;recordBtn.onclick=toggleRecord;document.getElementById('fx-note-save').onclick=saveCurrent;
    enhancePlaceModals();new MutationObserver(enhancePlaceModals).observe(document.body,{childList:true,subtree:true});
    window.FXNotes={open:openNote,list:safeNotes};
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
  proxy.send = function(body){ if(statusCode===200 && typeof body==='string') body=patchNotesFx(body); return res.status(statusCode).send(body); };
  return v4(req, proxy);
};
