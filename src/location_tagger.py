import json
import os
from datetime import datetime
from collections import defaultdict, Counter
from math import radians, cos, sin, asin, sqrt
from typing import List, Dict, Optional

class LocationTagger:
    def __init__(self, history_file: str = None):
        self.locations = []
        self.tags = {}
        self.raw_data = []
        if history_file and os.path.exists(history_file):
            self.load_history(history_file)
    
    def load_history(self, file_path: str):
        print(f"📂 Cargando historial desde: {file_path}")
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            self.raw_data = json.load(f)
        for item in self.raw_data:
            if 'visit' in item:
                visit = item['visit']
                if 'topCandidate' in visit and 'placeLocation' in visit['topCandidate']:
                    location = visit['topCandidate']['placeLocation']
                    coords = location.replace('geo:', '').split(',')
                    self.locations.append({
                        'lat': float(coords[0]),
                        'lng': float(coords[1]),
                        'place_id': visit['topCandidate'].get('placeID', ''),
                        'start_time': item.get('startTime', ''),
                        'end_time': item.get('endTime', ''),
                        'probability': float(visit.get('probability', 0)),
                        'tags': []
                    })
            elif 'activity' in item and 'end' in item['activity']:
                coords = item['activity']['end'].replace('geo:', '').split(',')
                self.locations.append({
                    'lat': float(coords[0]),
                    'lng': float(coords[1]),
                    'place_id': '',
                    'start_time': item.get('startTime', ''),
                    'end_time': item.get('endTime', ''),
                    'probability': float(item['activity'].get('probability', 0)),
                    'activity_type': item['activity'].get('topCandidate', {}).get('type', ''),
                    'tags': []
                })
        print(f"✅ {len(self.locations)} ubicaciones cargadas")
    
    def tag_location(self, lat: float, lng: float, tag: str, color: str = "#4CAF50", metadata: dict = None):
        if not tag.startswith('#'):
            tag = f'#{tag}'
        location = self._find_nearest_location(lat, lng)
        if location:
            if tag not in location['tags']:
                location['tags'].append(tag)
            if tag not in self.tags:
                self.tags[tag] = {
                    'color': color,
                    'locations': [],
                    'count': 0,
                    'metadata': metadata or {}
                }
            loc_key = f"{lat},{lng}"
            if loc_key not in [f"{l['lat']},{l['lng']}" for l in self.tags[tag]['locations']]:
                self.tags[tag]['locations'].append({
                    'lat': lat,
                    'lng': lng,
                    'place_id': location.get('place_id', ''),
                    'first_seen': location.get('start_time', ''),
                    'last_seen': location.get('end_time', '')
                })
                self.tags[tag]['count'] += 1
                print(f"🏷️ Etiqueta {tag} agregada a ubicación ({lat}, {lng})")
        return location
    
    def _find_nearest_location(self, lat: float, lng: float, radius_km: float = 0.1):
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371
            dLat = radians(lat2 - lat1)
            dLon = radians(lon2 - lon1)
            a = sin(dLat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2)**2
            c = 2 * asin(sqrt(a))
            return R * c
        min_dist = float('inf')
        closest = None
        for loc in self.locations:
            dist = haversine(lat, lng, loc['lat'], loc['lng'])
            if dist < radius_km and dist < min_dist:
                min_dist = dist
                closest = loc
        return closest
    
    def search_by_tag(self, tag: str) -> List[Dict]:
        if not tag.startswith('#'):
            tag = f'#{tag}'
        if tag not in self.tags:
            return []
        locations = self.tags[tag]['locations']
        enriched = []
        for loc in locations:
            visits = self._get_visits_for_location(loc['lat'], loc['lng'])
            enriched.append({
                'lat': loc['lat'],
                'lng': loc['lng'],
                'place_id': loc['place_id'],
                'total_visits': len(visits),
                'first_visit': loc['first_seen'],
                'last_visit': loc['last_seen'],
                'tag': tag,
                'color': self.tags[tag]['color'],
                'visits': visits[:10]
            })
        return sorted(enriched, key=lambda x: x['total_visits'], reverse=True)
    
    def _get_visits_for_location(self, lat: float, lng: float, radius_km: float = 0.1):
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371
            dLat = radians(lat2 - lat1)
            dLon = radians(lon2 - lon1)
            a = sin(dLat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2)**2
            c = 2 * asin(sqrt(a))
            return R * c
        visits = []
        for loc in self.locations:
            dist = haversine(lat, lng, loc['lat'], loc['lng'])
            if dist < radius_km:
                visits.append({
                    'lat': loc['lat'],
                    'lng': loc['lng'],
                    'time': loc.get('start_time', ''),
                    'tags': loc.get('tags', [])
                })
        return visits
    
    def find_patterns(self, tag: str) -> Dict:
        if not tag.startswith('#'):
            tag = f'#{tag}'
        if tag not in self.tags:
            return {}
        locations = self.search_by_tag(tag)
        if not locations:
            return {}
        hours = []
        weekdays = []
        for loc in locations:
            for visit in loc.get('visits', []):
                if visit.get('time'):
                    try:
                        dt = datetime.fromisoformat(visit['time'].replace('Z', '+00:00'))
                        hours.append(dt.hour)
                        weekdays.append(dt.strftime('%A'))
                    except:
                        pass
        tag_coincidences = defaultdict(int)
        for loc in self.locations:
            if tag in loc.get('tags', []):
                for other_tag in loc.get('tags', []):
                    if other_tag != tag:
                        tag_coincidences[other_tag] += 1
        location_counts = defaultdict(int)
        for loc in locations:
            key = f"{loc['lat']},{loc['lng']}"
            location_counts[key] += loc['total_visits']
        top_locations = sorted(location_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        return {
            'tag': tag,
            'color': self.tags[tag]['color'],
            'total_locations': len(locations),
            'total_visits': sum(l['total_visits'] for l in locations),
            'top_locations': [
                {
                    'coords': loc,
                    'visits': count,
                    'percentage': round((count / sum(location_counts.values())) * 100, 1)
                }
                for loc, count in top_locations
            ],
            'time_patterns': {
                'peak_hours': Counter(hours).most_common(5),
                'peak_days': Counter(weekdays).most_common(3)
            },
            'tag_coincidences': sorted(
                [{'tag': t, 'count': c} for t, c in tag_coincidences.items()],
                key=lambda x: x['count'],
                reverse=True
            )[:10]
        }
    
    def get_all_tags(self) -> Dict:
        result = {}
        for tag, data in self.tags.items():
            result[tag] = {
                'color': data['color'],
                'count': data['count'],
                'locations': len(data['locations']),
                'metadata': data.get('metadata', {})
            }
        return result
    
    def save_tags(self, file_path: str = 'tags_data.json'):
        with open(file_path, 'w', encoding='utf-8-sig') as f:
            json.dump({
                'tags': self.tags,
                'locations': self.locations
            }, f, indent=2, default=str)
        print(f"💾 Etiquetas guardadas en {file_path}")
    
    def load_tags(self, file_path: str = 'tags_data.json'):
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                data = json.load(f)
                self.tags = data.get('tags', {})
                self.locations = data.get('locations', self.locations)
            print(f"📂 Etiquetas cargadas desde {file_path}")
