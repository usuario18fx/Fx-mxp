import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from location_tagger import LocationTagger

tagger = LocationTagger('../data/location-history.json')
tagger.load_tags('../tags_data.json')

def buscar_y_mostrar(tag):
    print(f"\n🔍 Buscando: {tag}")
    print("="*50)
    
    resultados = tagger.search_by_tag(tag)
    
    if not resultados:
        print(f"❌ No se encontraron ubicaciones para {tag}")
        return
    
    print(f"📍 {len(resultados)} ubicaciones encontradas:")
    for i, loc in enumerate(resultados[:10], 1):
        print(f"\n{i}. Lat: {loc['lat']}, Lng: {loc['lng']}")
        print(f"   Visitas: {loc['total_visits']}")
        print(f"   Color: {loc['color']}")
        if loc.get('last_visit'):
            print(f"   Última visita: {loc['last_visit']}")
    
    print("\n" + "="*50)
    print("📊 PATRONES:")
    patrones = tagger.find_patterns(tag)
    
    if patrones:
        print(f"  • Total visitas: {patrones['total_visits']}")
        print(f"  • Lugares más frecuentes:")
        for loc in patrones['top_locations'][:5]:
            print(f"    - {loc['coords']}: {loc['visits']} visitas ({loc['percentage']}%)")
        
        if patrones.get('tag_coincidences'):
            print(f"  • Etiquetas que coinciden:")
            for tc in patrones['tag_coincidences'][:5]:
                print(f"    - {tc['tag']}: {tc['count']} coincidencias")

if __name__ == "__main__":
    print("🏷️ ETIQUETAS DISPONIBLES:")
    tags = tagger.get_all_tags()
    if not tags:
        print("  No hay etiquetas guardadas. Ejecuta primero 01_etiquetar.py")
    else:
        for tag in tags.keys():
            print(f"  {tag}")
    
    print("\n" + "="*50)
    tag_a_buscar = input("🔍 Escribe una etiqueta para buscar (ej. #Alex): ").strip()
    
    if tag_a_buscar:
        buscar_y_mostrar(tag_a_buscar)
    else:
        print("❌ No se ingresó ninguna etiqueta")
