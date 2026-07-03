#!/usr/bin/env python3
"""
FX MAP — FULL REDESIGN PATCHER
Oxford Gray + Neon Green theme + right-drawer menu + gallery password
Uso: python3 fx_full_redesign_patcher.py index.html
"""
import sys, os, json

if len(sys.argv) < 2:
    print("Uso: python3 fx_full_redesign_patcher.py index.html")
    sys.exit(1)

src = sys.argv[1]
if not os.path.exists(src):
    print(f"Archivo no encontrado: {src}")
    sys.exit(1)

with open(src, encoding='utf-8') as f:
    html = f.read()

# ─────────────────────────────────────────────────────────────────
patches = [
{
'name': 'Root palette Oxford+Neon',
'search': """:root{
  --bg:#060606;--surface:rgba(9,9,9,.96);--surface2:rgba(14,14,14,.88);
  --border:rgba(212,255,0,.1);--border2:rgba(255,255,255,.07);
  --text:#e2e2e2;--text-primary:#e2e2e2;--text-secondary:#888888;--text-muted:#555555;--muted:#555555;--muted2:#888888;
  --neon-green:#d4ff00;--blue:#6b7280;--green:#4ecf7a;--yellow:#f5cf58;
  --red:#ff3b3b;--purple:#555555;--orange:#888888;--cyan:#d4ff00;--silver:#888888;
  --shadow:0 18px 44px rgba(0,0,0,.42);--shadow2:0 8px 22px rgba(0,0,0,.34);
  --shadow-neon:0 0 30px rgba(212,255,0,.12);--shadow-neon-strong:0 0 60px rgba(212,255,0,.1);
  --safe-top:env(safe-area-inset-top,0px);--safe-bottom:env(safe-area-inset-bottom,0px);
}""",
'replace': """:root{
  --bg:#05060a;
  --surface:rgba(12,13,18,.97);
  --surface2:rgba(17,18,24,.94);
  --card:rgba(20,22,28,.98);
  --border:rgba(200,255,0,.08);
  --border2:rgba(255,255,255,.05);
  --oxford:#252830;--oxford2:#2e3240;--oxford3:#3a3f4c;
  --text:#cdd0d8;--text-primary:#cdd0d8;--text-secondary:#787d8c;--text-muted:#464b58;
  --muted:#464b58;--muted2:#787d8c;
  --neon-green:#c8ff00;--blue:#565e72;--green:#38b560;--yellow:#d4b030;
  --red:#ee2e40;--purple:#464b58;--orange:#787d8c;--cyan:#c8ff00;--silver:#787d8c;
  --shadow:0 24px 64px rgba(0,0,0,.7);
  --shadow2:0 10px 30px rgba(0,0,0,.5);
  --shadow-neon:0 0 28px rgba(200,255,0,.1);
  --shadow-neon-strong:0 0 56px rgba(200,255,0,.12);
  --safe-top:env(safe-area-inset-top,0px);
  --safe-bottom:env(safe-area-inset-bottom,0px);
}"""
},
{
'name': 'Menu panel right drawer',
'search': """#overlay-menu{position:fixed;inset:0;z-index:115;background:rgba(0,0,0,0);backdrop-filter:blur(0px);pointer-events:none;transition:background .3s,backdrop-filter .3s}
#overlay-menu.show{background:rgba(0,0,0,.6);backdrop-filter:blur(8px);pointer-events:auto}
#menu-panel{position:fixed;top:50%;left:50%;width:min(420px,92vw);max-height:min(640px,86dvh);background:rgba(9,9,9,.96);border:1px solid rgba(212,255,0,.12);border-radius:22px;backdrop-filter:blur(28px);transform:translate(-50%,-46%) scale(.96);opacity:0;transition:transform .3s cubic-bezier(.22,1,.36,1),opacity .3s;display:flex;flex-direction:column;z-index:116;box-shadow:0 0 60px rgba(0,0,0,.8);pointer-events:none}
#menu-panel.open{transform:translate(-50%,-50%) scale(1);opacity:1;pointer-events:auto}""",
'replace': """#overlay-menu{position:fixed;inset:0;z-index:115;background:rgba(0,0,0,0);backdrop-filter:blur(0px);pointer-events:none;transition:background .35s,backdrop-filter .35s}
#overlay-menu.show{background:rgba(0,0,0,.5);backdrop-filter:blur(10px);pointer-events:auto}
#menu-panel{position:fixed;top:0;right:0;width:min(390px,94vw);height:100%;max-height:100dvh;background:var(--card);border-left:1px solid var(--oxford2);backdrop-filter:blur(32px);transform:translateX(calc(100% + 10px));transition:transform .32s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;z-index:116;box-shadow:-24px 0 80px rgba(0,0,0,.75);pointer-events:none}
#menu-panel.open{transform:translateX(0);pointer-events:auto}"""
},
{
'name': 'Panel header style',
'search': """.ph{display:flex;align-items:center;justify-content:space-between;padding:18px 16px 14px;border-bottom:1px solid rgba(212,255,0,.08);flex:0 0 auto}
.ph-title{color:var(--neon-green);font-size:10px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;display:flex;align-items:center;gap:7px;text-shadow:0 0 20px rgba(212,255,0,.1)}
.ph-title .lockico{color:var(--neon-green);font-size:12px}
.pclose{width:36px;height:36px;border-radius:10px;border:1px solid rgba(212,255,0,.08);background:rgba(255,255,255,.02);color:var(--text-muted);font-size:17px;display:grid;place-items:center;cursor:pointer;transition:all .3s ease}
.pclose:hover{background:rgba(255,255,255,.05);color:var(--text-primary);border-color:rgba(212,255,0,.1)}
.ptabs{display:flex;border-bottom:1px solid rgba(212,255,0,.08);overflow-x:auto;flex:0 0 auto}
.ptabs::-webkit-scrollbar{display:none}
.ptab{flex:0 0 auto;height:44px;padding:0 13px;background:none;color:var(--text-muted);font-size:8.5px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;border-bottom:2px solid transparent;white-space:nowrap;cursor:pointer;transition:all .3s ease}
.ptab.active{color:var(--neon-green);border-bottom-color:var(--neon-green)}
.ptab:hover{color:var(--text-secondary)}""",
'replace': """.ph{display:flex;align-items:center;justify-content:space-between;padding:calc(18px + var(--safe-top)) 18px 16px;border-bottom:1px solid var(--oxford2);flex:0 0 auto}
.ph-title{color:var(--neon-green);font-size:9px;font-weight:900;letter-spacing:.24em;text-transform:uppercase;display:flex;align-items:center;gap:7px}
.ph-title .lockico{font-size:11px}
.pclose{width:34px;height:34px;border-radius:50%;border:1px solid var(--oxford3);background:var(--oxford2);color:var(--text-muted);font-size:14px;display:grid;place-items:center;cursor:pointer;transition:.2s}
.pclose:hover{background:var(--oxford3);color:var(--text-primary)}
.ptabs{display:flex;border-bottom:1px solid var(--oxford2);overflow-x:auto;flex:0 0 auto;padding:0 6px}
.ptabs::-webkit-scrollbar{display:none}
.ptab{flex:0 0 auto;height:42px;padding:0 11px;background:none;color:var(--text-muted);font-size:8px;font-weight:900;letter-spacing:.15em;text-transform:uppercase;border-bottom:2px solid transparent;white-space:nowrap;cursor:pointer;transition:.2s}
.ptab.active{color:var(--neon-green);border-bottom-color:var(--neon-green)}
.ptab:hover{color:var(--text-secondary)}"""
},
{
'name': 'Brand pill',
'search': """.brand-pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:12px;font-size:10px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;border:1px solid var(--border);background:var(--surface);backdrop-filter:blur(20px);box-shadow:var(--shadow2);color:var(--neon-green);cursor:pointer;transition:background .15s}
.brand-pill:hover{background:rgba(212,255,0,.1)}""",
'replace': """.brand-pill{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 13px;border-radius:20px;font-size:9.5px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;border:1px solid var(--oxford3);background:rgba(12,13,18,.94);backdrop-filter:blur(24px);box-shadow:var(--shadow2);color:var(--neon-green);cursor:pointer;transition:.18s}
.brand-pill:hover{background:rgba(200,255,0,.07);border-color:rgba(200,255,0,.2)}"""
},
{
'name': 'RC buttons',
'search': """.rc-btn{width:44px;height:44px;border-radius:13px;border:1px solid var(--border);background:var(--surface);backdrop-filter:blur(20px);box-shadow:var(--shadow2);color:var(--text-muted);font-size:18px;display:grid;place-items:center;transition:all .15s;position:relative}
.rc-btn:hover,.rc-btn:active{color:var(--neon-green);background:rgba(212,255,0,.1)}
.rc-btn.active{color:var(--neon-green);background:rgba(212,255,0,.12);border-color:rgba(212,255,0,.25)}
.rc-btn.danger{color:var(--red);border-color:rgba(255,59,59,.25)}""",
'replace': """.rc-btn{width:42px;height:42px;border-radius:14px;border:1px solid var(--oxford2);background:rgba(12,13,18,.9);backdrop-filter:blur(20px);box-shadow:var(--shadow2);color:var(--text-muted);font-size:17px;display:grid;place-items:center;transition:.18s;position:relative}
.rc-btn:hover,.rc-btn:active{color:var(--neon-green);background:rgba(200,255,0,.07);border-color:var(--oxford3)}
.rc-btn.active{color:var(--neon-green);background:rgba(200,255,0,.08);border-color:rgba(200,255,0,.2)}
.rc-btn.danger{color:var(--red);border-color:rgba(238,46,64,.2);background:rgba(238,46,64,.06)}"""
},
{
'name': 'Toast',
'search': """#toast{position:fixed;left:50%;bottom:calc(78px + var(--safe-bottom));transform:translateX(-50%) translateY(10px);z-index:500;min-height:40px;padding:0 18px;border-radius:12px;border:1px solid rgba(212,255,0,.1);background:rgba(9,9,9,.96);color:var(--neon-green);box-shadow:var(--shadow-neon);display:inline-flex;align-items:center;font-size:11px;font-weight:700;opacity:0;transition:all .3s ease;white-space:nowrap;pointer-events:none;text-shadow:0 0 20px rgba(212,255,0,.1)}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}""",
'replace': """#toast{position:fixed;left:50%;bottom:calc(90px + var(--safe-bottom));transform:translateX(-50%) translateY(14px);z-index:500;min-height:38px;padding:0 16px;border-radius:20px;border:1px solid var(--oxford3);background:var(--card);color:var(--neon-green);box-shadow:var(--shadow);display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;letter-spacing:.03em;opacity:0;transition:all .26s cubic-bezier(.22,1,.36,1);white-space:nowrap;pointer-events:none}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}"""
},
{
'name': 'Settings drawer',
'search': """#settings-drawer{position:fixed;bottom:0;left:0;right:0;z-index:110;background:rgba(9,9,9,.96);border-top:1px solid rgba(212,255,0,.1);border-radius:22px 22px 0 0;transform:translateY(100%);transition:transform .3s cubic-bezier(.22,1,.36,1);max-height:88vh;display:flex;flex-direction:column;backdrop-filter:blur(30px)}""",
'replace': """#settings-drawer{position:fixed;bottom:0;left:0;right:0;z-index:110;background:var(--card);border-top:1px solid var(--oxford2);border-radius:24px 24px 0 0;transform:translateY(100%);transition:transform .32s cubic-bezier(.22,1,.36,1);max-height:88vh;display:flex;flex-direction:column;backdrop-filter:blur(32px);box-shadow:0 -24px 70px rgba(0,0,0,.75)}"""
},
{
'name': 'Notif panel',
'search': """#notif-panel{position:fixed;top:0;left:0;right:0;z-index:115;background:rgba(9,9,9,.96);border-bottom:1px solid rgba(212,255,0,.08);border-radius:0 0 20px 20px;backdrop-filter:blur(28px);transform:translateY(-100%);transition:transform .3s cubic-bezier(.22,1,.36,1);max-height:70vh;display:flex;flex-direction:column}""",
'replace': """#notif-panel{position:fixed;top:0;left:0;right:0;z-index:115;background:var(--card);border-bottom:1px solid var(--oxford2);border-radius:0 0 22px 22px;backdrop-filter:blur(32px);transform:translateY(-100%);transition:transform .32s cubic-bezier(.22,1,.36,1);max-height:70vh;display:flex;flex-direction:column;box-shadow:0 22px 60px rgba(0,0,0,.7)}"""
},
{
'name': 'Modals (enc/save/confirm)',
'search': """.enc-box{width:min(400px,94vw);padding:22px;border-radius:20px;border:1px solid rgba(212,255,0,.12);background:rgba(9,9,9,.96);box-shadow:var(--shadow-neon)}""",
'replace': """.enc-box{width:min(400px,94vw);padding:26px;border-radius:22px;border:1px solid var(--oxford2);background:var(--card);box-shadow:var(--shadow)}"""
},
{
'name': 'Save modal box',
'search': """.save-box{width:min(440px,94vw);max-height:calc(100dvh - 48px);overflow:auto;padding:20px;border-radius:20px;border:1px solid rgba(212,255,0,.12);background:rgba(9,9,9,.96);box-shadow:var(--shadow-neon)}""",
'replace': """.save-box{width:min(450px,94vw);max-height:calc(100dvh - 36px);overflow:auto;padding:22px;border-radius:24px;border:1px solid var(--oxford2);background:var(--card);box-shadow:var(--shadow)}"""
},
{
'name': 'Confirm modal box',
'search': """.cfm-box{width:min(320px,94vw);padding:22px;border-radius:18px;border:1px solid rgba(212,255,0,.12);background:rgba(9,9,9,.96);box-shadow:var(--shadow-neon)}""",
'replace': """.cfm-box{width:min(320px,94vw);padding:24px;border-radius:22px;border:1px solid var(--oxford2);background:var(--card);box-shadow:var(--shadow)}"""
},
{
'name': 'SOS modal box',
'search': """.sos-box{width:100%;max-width:500px;padding:20px;padding-bottom:calc(20px + var(--safe-bottom));border-radius:22px 22px 0 0;border-top:1px solid rgba(255,59,59,.25);background:rgba(9,9,9,.96)}""",
'replace': """.sos-box{width:100%;max-width:480px;padding:22px;padding-bottom:calc(22px + var(--safe-bottom));border-radius:24px 24px 0 0;border-top:2px solid rgba(238,46,64,.3);background:var(--card);box-shadow:0 -22px 60px rgba(0,0,0,.75)}"""
},
{
'name': 'Pick box',
'search': """.pick-box{width:100%;max-width:520px;padding:12px 14px calc(14px + var(--safe-bottom));border-radius:20px 20px 0 0;background:rgba(9,9,9,.96);border-top:1px solid var(--border);box-shadow:0 -18px 45px rgba(0,0,0,.5);position:relative;transform:translateY(0);transition:transform .22s cubic-bezier(.22,1,.36,1)}""",
'replace': """.pick-box{width:100%;max-width:520px;padding:12px 16px calc(18px + var(--safe-bottom));border-radius:24px 24px 0 0;background:var(--card);border-top:1px solid var(--oxford2);box-shadow:0 -24px 60px rgba(0,0,0,.75);position:relative;transform:translateY(0);transition:transform .24s cubic-bezier(.22,1,.36,1)}"""
},
{
'name': 'Pli items',
'search': """.pli{padding:11px 12px;border-radius:13px;border:1px solid rgba(212,255,0,.06);background:rgba(255,255,255,.02);margin-bottom:7px;cursor:pointer;transition:all .3s ease}
.pli:hover{background:rgba(212,255,0,.03);border-color:rgba(212,255,0,.1)}""",
'replace': """.pli{padding:12px 14px;border-radius:14px;border:1px solid var(--oxford2);background:var(--oxford);margin-bottom:6px;cursor:pointer;transition:.18s}
.pli:hover{background:var(--oxford2)}"""
},
{
'name': 'BCards',
'search': """.bcard{border-radius:13px;border:1px solid rgba(212,255,0,.06);background:rgba(255,255,255,.02);overflow:hidden;cursor:pointer;transition:all .3s ease}
.bcard:hover{border-color:rgba(212,255,0,.1);transform:translateY(-2px);box-shadow:0 0 30px rgba(212,255,0,.03)}""",
'replace': """.bcard{border-radius:14px;border:1px solid var(--oxford2);background:var(--oxford);overflow:hidden;cursor:pointer;transition:.2s}
.bcard:hover{border-color:var(--oxford3);transform:translateY(-2px);box-shadow:var(--shadow2)}"""
},
{
'name': 'Field inputs',
'search': """.field input,.field textarea{width:100%;padding:10px 13px;border-radius:11px;border:1px solid rgba(212,255,0,.08);background:rgba(255,255,255,.02);color:var(--text-primary);outline:none;transition:border-color .3s ease;font-family:inherit;font-size:12px}
.field textarea{min-height:70px;resize:none;line-height:1.6}
.field input:focus,.field textarea:focus{border-color:rgba(212,255,0,.12);box-shadow:var(--shadow-neon)}
.field input::placeholder,.field textarea::placeholder{color:var(--text-muted)}""",
'replace': """.field input,.field textarea{width:100%;padding:11px 14px;border-radius:12px;border:1px solid var(--oxford2);background:var(--oxford);color:var(--text-primary);outline:none;transition:.18s;font-family:inherit;font-size:12px}
.field textarea{min-height:72px;resize:none;line-height:1.65}
.field input:focus,.field textarea:focus{border-color:rgba(200,255,0,.2);background:var(--oxford2);box-shadow:0 0 0 3px rgba(200,255,0,.05)}
.field input::placeholder,.field textarea::placeholder{color:var(--text-muted)}"""
},
{
'name': 'Qinput',
'search': """.qinput{flex:1;height:38px;padding:0 12px;border-radius:10px;border:1px solid rgba(212,255,0,.08);background:rgba(255,255,255,.02);color:var(--text-primary);outline:none;font-size:12px}
.qinput:focus{border-color:rgba(212,255,0,.12);box-shadow:var(--shadow-neon)}""",
'replace': """.qinput{flex:1;height:40px;padding:0 13px;border-radius:11px;border:1px solid var(--oxford2);background:var(--oxford);color:var(--text-primary);outline:none;font-size:12px;transition:.18s}
.qinput:focus{border-color:rgba(200,255,0,.2);background:var(--oxford2)}"""
},
{
'name': 'Cinput',
'search': """.cinput{width:100%;height:44px;padding:0 13px;border-radius:11px;border:1px solid rgba(212,255,0,.08);background:rgba(255,255,255,.02);color:var(--text-primary);outline:none;transition:border-color .3s ease}
.cinput:focus{border-color:rgba(212,255,0,.12);box-shadow:var(--shadow-neon)}
.cinput::placeholder{color:var(--text-muted)}""",
'replace': """.cinput{width:100%;height:44px;padding:0 14px;border-radius:12px;border:1px solid var(--oxford2);background:var(--oxford);color:var(--text-primary);outline:none;transition:.18s;font-family:inherit}
.cinput:focus{border-color:rgba(200,255,0,.2);background:var(--oxford2);box-shadow:0 0 0 3px rgba(200,255,0,.05)}
.cinput::placeholder{color:var(--text-muted)}"""
},
# FX BUTTON → PASSWORD MODAL (JS)
{
'name': 'FX gallery password JS',
'search': """  $('btn-brand').addEventListener('click', () => { renderMediaGrid(); openPanel('media-panel'); });""",
'replace': """  $('btn-brand').addEventListener('click', () => { openGalleryAuth(); });"""
},
# Gallery password modal ADD (before render functions)
{
'name': 'Gallery auth function',
'search': """// ─── RENDER FUNCTIONS ──────────────────────────────────────────""",
'replace': """// ─── GALLERY AUTH ──────────────────────────────────────────────
function openGalleryAuth() {
  const pass = settings.privPass || '0000';
  const modal = document.createElement('div');
  modal.id = 'gallery-auth-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:250;background:rgba(0,0,0,.75);backdrop-filter:blur(14px);display:flex;align-items:center;justify-content:center';
  modal.innerHTML = `
    <div style="width:min(340px,90vw);padding:28px;border-radius:22px;background:var(--card);border:1px solid var(--oxford2);box-shadow:var(--shadow)">
      <div style="font-size:9px;font-weight:900;letter-spacing:.22em;text-transform:uppercase;color:var(--neon-green);margin-bottom:16px">◈ GALERÍA PRIVADA</div>
      <input id="gallery-pass-input" type="password" placeholder="● ● ● ● ● ●" autocomplete="off"
        style="width:100%;height:48px;padding:0 16px;border-radius:13px;border:1px solid var(--oxford2);background:var(--oxford);color:var(--text-primary);font-size:18px;letter-spacing:.18em;text-align:center;outline:none;font-family:inherit;margin-bottom:12px">
      <div id="gallery-pass-err" style="font-size:10px;color:var(--red);min-height:16px;text-align:center;margin-bottom:10px"></div>
      <div style="display:flex;gap:8px">
        <button id="gallery-pass-ok" style="flex:1;height:44px;border-radius:12px;background:var(--neon-green);color:#000;border:none;font-family:inherit;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">ABRIR</button>
        <button id="gallery-pass-cancel" style="width:44px;height:44px;border-radius:12px;background:var(--oxford2);border:none;color:var(--text-muted);font-size:18px;cursor:pointer">✕</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const inp = document.getElementById('gallery-pass-input');
  const err = document.getElementById('gallery-pass-err');
  inp.focus();
  const cleanup = () => modal.remove();
  const tryOpen = () => {
    if (inp.value === pass) { cleanup(); renderMediaGrid(); openPanel('media-panel'); }
    else { err.textContent = '❌ Contraseña incorrecta'; inp.value = ''; inp.focus(); }
  };
  document.getElementById('gallery-pass-ok').onclick = tryOpen;
  document.getElementById('gallery-pass-cancel').onclick = cleanup;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') tryOpen(); if (e.key === 'Escape') cleanup(); });
  modal.addEventListener('click', e => { if (e.target === modal) cleanup(); });
}

// ─── RENDER FUNCTIONS ──────────────────────────────────────────"""
}
]

ok = True
for p in patches:
    if p['search'] not in html:
        print(f"⚠ NO ENCONTRADO: {p['name']}")
        ok = False
    else:
        html = html.replace(p['search'], p['replace'], 1)
        print(f"✓ {p['name']}")

out = src.replace('.html', '_redesigned.html') if '_redesigned' not in src else src
with open(out, 'w', encoding='utf-8') as f:
    f.write(html)

status = "✓ TODOS LOS PATCHES APLICADOS" if ok else "⚠ ALGUNOS PATCHES FALLARON — revisa el output"
print(f"\n{status}")
print(f"→ {out} ({len(html):,} chars)")
