(() => {
  'use strict';

  const OSM_STYLE = {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors'
      }
    },
    layers: [
      {
        id: 'osm-base',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 22,
        paint: {
          'raster-brightness-max': 0.72,
          'raster-contrast': 0.22,
          'raster-saturation': -0.82
        }
      }
    ]
  };

  function patchMapboxMap() {
    if (!window.mapboxgl || !mapboxgl.Map || window.__fxFallbackMapPatched) return false;
    window.__fxFallbackMapPatched = true;
    const OriginalMap = mapboxgl.Map;

    mapboxgl.Map = new Proxy(OriginalMap, {
      construct(target, args, newTarget) {
        const opts = Object.assign({}, args[0] || {});
        if (typeof opts.style === 'string' && opts.style.startsWith('mapbox://')) {
          opts.style = OSM_STYLE;
          delete opts.config;
        }
        const nextArgs = [opts, ...args.slice(1)];
        return Reflect.construct(target, nextArgs, newTarget === mapboxgl.Map ? target : newTarget);
      }
    });
    return true;
  }

  const nativeFetch = window.fetch.bind(window);

  function mapboxFeature(item) {
    const lon = Number(item.lon);
    const lat = Number(item.lat);
    const label = item.display_name || item.name || 'Ubicación';
    return {
      id: `osm.${item.place_id || Math.random().toString(36).slice(2)}`,
      type: 'Feature',
      place_type: ['place'],
      relevance: Number(item.importance || 0.8),
      properties: { source: 'openstreetmap' },
      text: item.name || String(label).split(',')[0],
      place_name: label,
      center: [lon, lat],
      geometry: { type: 'Point', coordinates: [lon, lat] },
      context: []
    };
  }

  async function nominatimSearch(query, limit = 6) {
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
    const response = await nativeFetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const data = await response.json();
    return { type: 'FeatureCollection', query: String(query).split(/\s+/), features: (data || []).map(mapboxFeature) };
  }

  async function nominatimReverse(lng, lat) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    const response = await nativeFetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Nominatim ${response.status}`);
    const item = await response.json();
    return { type: 'FeatureCollection', features: item ? [mapboxFeature(item)] : [] };
  }

  function responseJson(data) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  }

  window.fetch = async function fxFetch(input, init) {
    const raw = typeof input === 'string' ? input : (input && input.url) || '';
    if (!raw.includes('api.mapbox.com')) return nativeFetch(input, init);

    try {
      const url = new URL(raw, location.href);

      // Legacy Mapbox Geocoding API: forward and reverse.
      if (url.pathname.includes('/geocoding/v5/mapbox.places/')) {
        const encoded = url.pathname.split('/geocoding/v5/mapbox.places/')[1].replace(/\.json$/, '');
        const value = decodeURIComponent(encoded);
        const reverse = value.match(/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/);
        if (reverse) {
          const data = await nominatimReverse(Number(reverse[1]), Number(reverse[2]));
          return responseJson(data);
        }
        const data = await nominatimSearch(value, Number(url.searchParams.get('limit') || 6));
        return responseJson(data);
      }

      // Mapbox Searchbox suggest/retrieve style requests.
      if (url.pathname.includes('/search/searchbox/v1/suggest')) {
        const q = url.searchParams.get('q') || '';
        const data = await nominatimSearch(q, Number(url.searchParams.get('limit') || 6));
        return responseJson({
          suggestions: data.features.map((f) => ({
            name: f.text,
            full_address: f.place_name,
            place_formatted: f.place_name,
            mapbox_id: f.id,
            feature_type: 'address',
            language: 'es',
            coordinates: { longitude: f.center[0], latitude: f.center[1] }
          }))
        });
      }

      if (url.pathname.includes('/search/searchbox/v1/retrieve/')) {
        return nativeFetch(input, init);
      }
    } catch (error) {
      console.warn('FX geocoding fallback error', error);
    }

    return nativeFetch(input, init);
  };

  if (!patchMapboxMap()) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (patchMapboxMap() || tries > 100) clearInterval(timer);
    }, 20);
  }

  window.__fxMapFallbackReady = true;
})();
