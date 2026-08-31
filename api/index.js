const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(file, 'utf8');

    // Expose the exact Mapbox instance created by the existing single-file app.
    // This avoids proxying/replacing mapboxgl.Map and keeps the base map untouched.
    const mapNeedle = "// Disable all zoom controls";
    const mapBridge = "window.__fxMapInstance = map;\nwindow.dispatchEvent(new CustomEvent('fx-map-ready', { detail: { map } }));\n";
    if (!html.includes('window.__fxMapInstance = map;') && html.includes(mapNeedle)) {
      html = html.replace(mapNeedle, `${mapBridge}${mapNeedle}`);
    }

    // GPS loads only after the original application script has finished parsing.
    const loader = '<script src="/fx-gps.js?v=20260831-3"></script>';
    if (!html.includes('/fx-gps.js')) {
      html = html.includes('</body>')
        ? html.replace('</body>', `${loader}\n</body>`)
        : `${html}\n${loader}`;
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    console.error('FX Map loader error', error);
    res.status(500).send('FX Map loader error');
  }
};
