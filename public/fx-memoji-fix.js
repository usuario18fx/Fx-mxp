(() => {
  'use strict';

  const DB_NAME = 'fx-map-gps';
  const STORE = 'media';

  function openDb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveMemoji(file) {
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(file, 'memoji');
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (_) {}
  }

  function applyMemoji(file) {
    if (!file) return;
    const url = URL.createObjectURL(file);

    document.querySelectorAll('.fx-gps-face').forEach((img) => {
      img.src = url;
      img.style.display = 'block';
    });
    document.querySelectorAll('.fx-gps-face-fallback').forEach((el) => {
      el.style.display = 'none';
    });

    const avatar = document.getElementById('fx-gps-avatar');
    const fallback = document.getElementById('fx-gps-avatar-fallback');
    if (avatar) {
      avatar.src = url;
      avatar.style.display = 'block';
    }
    if (fallback) fallback.style.display = 'none';
  }

  function installNativePicker() {
    const button = document.getElementById('fx-gps-memoji');
    if (!button || button.dataset.nativePicker === '1') return false;

    button.dataset.nativePicker = '1';
    button.style.position = 'relative';
    button.style.overflow = 'hidden';

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('aria-label', 'Seleccionar Memoji');
    input.style.position = 'absolute';
    input.style.inset = '0';
    input.style.width = '100%';
    input.style.height = '100%';
    input.style.opacity = '0.001';
    input.style.cursor = 'pointer';
    input.style.zIndex = '5';
    input.style.fontSize = '100px';

    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      await saveMemoji(file);
      applyMemoji(file);
      input.value = '';
      const toast = document.getElementById('fx-gps-toast');
      if (toast) {
        toast.textContent = 'Memoji actualizado';
        toast.classList.add('show');
        clearTimeout(toast.__fxTimer);
        toast.__fxTimer = setTimeout(() => toast.classList.remove('show'), 1500);
      }
    });

    button.appendChild(input);
    return true;
  }

  function boot() {
    if (installNativePicker()) return;
    const observer = new MutationObserver(() => {
      if (installNativePicker()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(() => installNativePicker(), 250);
    setTimeout(() => installNativePicker(), 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
