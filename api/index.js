const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const appScriptNeedle = '<script>\n// FX MAP — private, offline-first place intelligence';
    const fallbackLoader = '<script src="/fx-map-fallback.js?v=20260901-1"></script>\n';
    if (!html.includes('/fx-map-fallback.js') && html.includes(appScriptNeedle)) html = html.replace(appScriptNeedle, `${fallbackLoader}${appScriptNeedle}`);
    const mapNeedle = "// Disable all zoom controls";
    const mapBridge = "window.__fxMapInstance = map;\nwindow.dispatchEvent(new CustomEvent('fx-map-ready', { detail: { map } }));\n";
    if (!html.includes('window.__fxMapInstance = map;') && html.includes(mapNeedle)) html = html.replace(mapNeedle, `${mapBridge}${mapNeedle}`);
    const loader = '<script src="/fx-gps.js?v=20260901-5"></script>\n<script src="/fx-memoji-fix.js?v=20260901-5"></script>\n<script src="/fx-gps-visibility.js?v=20260901-5"></script>';
    if (!html.includes('/fx-gps.js')) html = html.includes('</body>') ? html.replace('</body>', `${loader}\n</body>`) : `${html}\n${loader}`;
    else {
      if (!html.includes('/fx-memoji-fix.js')) html = html.includes('</body>') ? html.replace('</body>', '<script src="/fx-memoji-fix.js?v=20260901-5"></script>\n</body>') : `${html}\n<script src="/fx-memoji-fix.js?v=20260901-5"></script>`;
      if (!html.includes('/fx-gps-visibility.js')) html = html.includes('</body>') ? html.replace('</body>', '<script src="/fx-gps-visibility.js?v=20260901-5"></script>\n</body>') : `${html}\n<script src="/fx-gps-visibility.js?v=20260901-5"></script>`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    console.error('FX Map loader error', error);
    res.status(500).send('FX Map loader error');
  }
};
