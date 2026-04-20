import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';
import Sidebar from './Sidebar.jsx';
import LocationDetail from './LocationDetail.jsx';
import TimeSelector from './TimeSelector.jsx';
import EmergencyButton from './EmergencyButton.jsx';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MapView = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [timeOfDay, setTimeOfDay] = useState('dusk');
  const [showSidebar, setShowSidebar] = useState(true);
  const markers = useRef([]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    const initMap = async () => {
      try {
        const configRes = await axios.get(`${API}/config`);
        const config = configRes.data;

        mapboxgl.accessToken = config.accessToken;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: config.center,
          zoom: config.zoom,
          pitch: config.pitch,
          bearing: config.bearing,
          projection: 'globe'
        });

        map.current.on('load', () => {
          // Add 3D terrain
          map.current.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 14
          });

          map.current.setTerrain({
            source: 'mapbox-dem',
            exaggeration: 1.5
          });

          // Add 3D buildings
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

          // Add fog
          map.current.setFog({
            range: [-1, 2],
            color: '#d4a89e',
            'high-color': '#ff6347',
            'space-color': '#8b4513',
            'horizon-blend': 0.05
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
      }
    };
  }, []);

  // Load locations
  useEffect(() => {
    loadLocations();
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

  const handleTimeChange = (time) => {
    setTimeOfDay(time);
    
    // Update fog color based on time of day
    const fogConfigs = {
      dawn: { color: '#e8d4c4', highColor: '#ffb347', spaceColor: '#e0d4c4' },
      day: { color: '#ffffff', highColor: '#87ceeb', spaceColor: '#d7e7ff' },
      dusk: { color: '#d4a89e', highColor: '#ff6347', spaceColor: '#8b4513' },
      night: { color: '#1a1a2e', highColor: '#001a4d', spaceColor: '#0d0d1a' }
    };

    const config = fogConfigs[time];
    if (map.current && config) {
      map.current.setFog({
        range: [-1, 2],
        color: config.color,
        'high-color': config.highColor,
        'space-color': config.spaceColor,
        'horizon-blend': 0.05
      });
    }
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
      
      <TimeSelector 
        currentTime={timeOfDay} 
        onTimeChange={handleTimeChange} 
      />

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
          onClose={() => setSelectedLocation(null)}
          onUpdate={loadLocations}
        />
      )}

      <EmergencyButton />
    </div>
  );
};

export default MapView;