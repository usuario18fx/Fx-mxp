const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  try {
    const file = path.join(process.cwd(), 'public', 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const loader = '<script src="/fx-gps.js?v=20260831"></script>';
    if (!html.includes('/fx-gps.js')) {
      html = html.includes('</head>')
        ? html.replace('</head>', `${loader}</head>`)
        : `${loader}${html}`;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.status(200).send(html);
  } catch (error) {
    res.status(500).send('FX Map loader error');
  }
};
