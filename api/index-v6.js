const v5 = require('./index-v5');

function patchPrecisionControls(html) {
  if (html.includes('FX_MEMOJI_PRECISION_CONTROLS_V1')) return html;

  let out = html;

  // Fine movement: 24px per pulse instead of 96px.
  out = out
    .replace('up: [0, -96]', 'up: [0, -24]')
    .replace('rt: [96, 0]', 'rt: [24, 0]')
    .replace('dn: [0, 96]', 'dn: [0, 24]')
    .replace('lt: [-96, 0]', 'lt: [-24, 0]')
    .replace('duration: 190, essential: true', 'duration: 28, easing: t => t, essential: true')
    .replace('setInterval(() => dpadAction(dir), 180)', 'setInterval(() => dpadAction(dir), 30)');

  const marker = '<!-- FX_MEMOJI_PRECISION_CONTROLS_V1 -->';
  return out.includes('</body>') ? out.replace('</body>', marker + '\n</body>') : out + marker;
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
