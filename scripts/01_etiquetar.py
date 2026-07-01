import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from location_tagger import LocationTagger

tagger = LocationTagger('../data/location-history.json')

print("🏷️ ETIQUETANDO UBICACIONES")
print("="*50)

# === TODAS TUS UBICACIONES FRECUENTES ===
ubicaciones_para_etiquetar = [
    # 1. UBICACIÓN PRINCIPAL (357 visitas)
    {
        'lat': 43.254889,
        'lng': -79.843008,
        'tag': '#casa',
        'color': '#4CAF50'
    },
    {
        'lat': 43.255366,
        'lng': -79.844193,
        'tag': '#casa',
        'color': '#4CAF50'
    },
    {
        'lat': 43.255103,
        'lng': -79.843472,
        'tag': '#casa',
        'color': '#4CAF50'
    },
    {
        'lat': 43.661743,
        'lng': -79.374738,
        'tag': '#trabajo',
        'color': '#2196F3'
    },
    {
        'lat': 43.251538,
        'lng': -79.852623,
        'tag': '#gimnasio',
        'color': '#FF9800'
    },
    {
        'lat': 43.645242,
        'lng': -79.380632,
        'tag': '#oeste',
        'color': '#9C27B0'
    },
    {
        'lat': 43.253323,
        'lng': -79.869151,
        'tag': '#sur',
        'color': '#00BCD4'
    },
    {
        'lat': 43.258996,
        'lng': -79.886157,
        'tag': '#destino',
        'color': '#FF5722'
    },
    {
        'lat': 43.256184,
        'lng': -79.868064,
        'tag': '#este',
        'color': '#FFEB3B'
    },
    {
        'lat': 43.258418,
        'lng': -79.870827,
        'tag': '#trabajo2',
        'color': '#E91E63'
    },
]

# Etiquetar cada ubicación
for ubicacion in ubicaciones_para_etiquetar:
    tagger.tag_location(
        lat=ubicacion['lat'],
        lng=ubicacion['lng'],
        tag=ubicacion['tag'],
        color=ubicacion.get('color', '#4CAF50')
    )

# Guardar etiquetas
tagger.save_tags('../tags_data.json')

print(f"\n✅ Etiquetas guardadas. Total: {len(tagger.get_all_tags())}")
print("\n🏷️ ETIQUETAS DISPONIBLES:")
for tag, data in tagger.get_all_tags().items():
    print(f"  {tag} {data['color']} - {data['locations']} ubicaciones, {data['count']} usos")