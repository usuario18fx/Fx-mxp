import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import Sidebar from './Sidebar.jsx';
import LocationDetail from './LocationDetail.jsx';
import EmergencyButton from './EmergencyButton.jsx';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const mapInitialized = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const markers = useRef([]);

  // Initialize map
  useEffect(() => {
    if (map.current || mapInitialized.current) return;
    mapInitialized.current = true;

    const initMap = async () => {
      try {
        const configRes = await axios.get(`${API}/config`);
        const config = configRes.data;

        mapboxgl.accessToken = config.accessToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: config.center,
          zoom: config.zoom - 1,
          pitch: 0,
          bearing: 0
        });

        map.current.on('load', () => {
          // Add 3D terrain - guard against duplicate
          if (!map.current.getSource('mapbox-dem')) {
            map.current.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14
            });
          }

          if (map.current.getTerrain() === null) {
            map.current.setTerrain({
              source: 'mapbox-dem',
              exaggeration: 1.5
            });
          }

          // Add 3D buildings - guard against duplicate
          if (!map.current.getLayer('3d-buildings')) {
            const layers = map.current.getStyle().layers;
            const labelLayerId = layers.find(
              layer => layer.type === 'symbol' && layer.layout['text-field']
            )?.id;

            map.current.addLayer(
              {
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 14,
                paint: {
                  'fill-extrusion-color': '#4D7C59',
                  'fill-extrusion-height': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0,
                    14.05,
                    ['get', 'height']
                  ],
                  'fill-extrusion-base': [
                    'interpolate',
                    ['linear'],
                    ['zoom'],
                    14,
                    0,
                    14.05,
                    ['get', 'min_height']
                  ],
                  'fill-extrusion-opacity': 0.6
                }
              },
              labelLayerId
            );
          }

          // Apply dark filter to make it look like night
          map.current.on('styledata', () => {
            const layers = map.current.getStyle().layers;
            layers.forEach((layer) => {
              if (layer.type === 'background') {
                map.current.setPaintProperty(layer.id, 'background-color', '#0a0a0a');
              } else if (layer.type === 'fill') {
                map.current.setPaintProperty(layer.id, 'fill-color', '#1a1a2e');
              } else if (layer.type === 'line') {
                map.current.setPaintProperty(layer.id, 'line-color', '#2a2a3e');
              }
            });
          });

          // Add navigation control
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

          // Click to add location
          map.current.on('click', (e) => {
            handleMapClick(e.lngLat);
          });

          setMapLoaded(true);
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        toast.error('Error al cargar el mapa');
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        mapInitialized.current = false;
      }
    };
  }, []);

  // Load locations
  useEffect(() => {
    loadLocations();

    // Listen for location selection events
    const handleSelectLocation = (e) => {
      setSelectedLocation(e.detail);
      if (map.current && e.detail) {
        map.current.flyTo({
          center: [e.detail.longitude, e.detail.latitude],
          zoom: 15,
          pitch: 60,
          duration: 2000
        });
      }
    };

    window.addEventListener('selectLocation', handleSelectLocation);
    return () => window.removeEventListener('selectLocation', handleSelectLocation);
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    updateMarkers();
  }, [locations, mapLoaded]);

  const loadLocations = async () => {
    try {
      const res = await axios.get(`${API}/locations`);
      setLocations(res.data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleMapClick = async (lngLat) => {
    const name = prompt('Nombre de la ubicación:');
    if (!name) return;

    try {
      const res = await axios.post(`${API}/locations`, {
        name,
        latitude: lngLat.lat,
        longitude: lngLat.lng
      });
      setLocations([...locations, res.data]);
      toast.success('Ubicación agregada');
    } catch (error) {
      console.error('Error creating location:', error);
      toast.error('Error al agregar ubicación');
    }
  };

  const updateMarkers = () => {
    // Remove old markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers
    locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAzMCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMTUgMEMxMC44NTc5IDAgNy41IDMuMzU3ODkgNy41IDcuNUM3LjUgMTIuNSAxNSAyNSAxNSAyNUMxNSAyNSAyMi41IDEyLjUgMjIuNSA3LjVDMjIuNSAzLjM1Nzg5IDE5LjE0MjEgMCAxNSAwWiIgZmlsbD0iIzRBREU4MCIvPjxjaXJjbGUgY3g9IjE1IiBjeT0iNy41IiByPSIzIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==)';
      el.style.width = '30px';
      el.style.height = '40px';
      el.style.backgroundSize = 'cover';
      el.style.cursor = 'pointer';
      el.setAttribute('data-testid', `location-marker-${location.id}`);

      el.addEventListener('click', () => {
        setSelectedLocation(location);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.longitude, location.latitude])
        .addTo(map.current);

      markers.current.push(marker);
    });
  };

  const flyToLocation = (location) => {
    if (map.current) {
      map.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 15,
        pitch: 60,
        duration: 2000
      });
      setSelectedLocation(location);
    }
  };

  return (
    <div className="relative w-full h-screen" data-testid="map-view-container">
      <div ref={mapContainer} className="absolute inset-0" data-testid="map-container" />

      <Sidebar
        locations={locations}
        onLocationClick={flyToLocation}
        onRefresh={loadLocations}
        isOpen={showSidebar}
        onToggle={() => setShowSidebar(!showSidebar)}
      />

      {selectedLocation && (
        <LocationDetail
          location={selectedLocation}
          allLocations={locations}
          onClose={() => setSelectedLocation(null)}
          onUpdate={loadLocations}
        />
      )}

      <EmergencyButton />
    </div>
  );
};

export default MapView;