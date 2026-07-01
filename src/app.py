from flask import Flask, request, jsonify, send_from_directory
from location_tagger import LocationTagger
import os

app = Flask(__name__)

tagger = LocationTagger('../data/location-history.json')
tagger.load_tags('../tags_data.json')

# Página principal con HTML simple (sin problemas de escape)
@app.route('/')
def index():
    html = '''
<!DOCTYPE html>
<html>
<head>
    <title>🔍 Buscador de Ubicaciones</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
        .tag { display: inline-block; padding: 5px 12px; margin: 5px; border-radius: 15px; cursor: pointer; border: 2px solid #ccc; }
        .tag:hover { border-color: #333; }
        .result { border: 1px solid #ddd; padding: 10px; margin: 10px 0; border-radius: 5px; }
        .badge { background: #e0e0e0; padding: 2px 8px; border-radius: 10px; font-size: 12px; margin: 2px; }
        .search-box { display: flex; gap: 10px; margin: 20px 0; }
        .search-box input { flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-size: 16px; }
        .search-box button { padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; }
        .search-box button:hover { background: #45a049; }
        .color-dot { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 5px; }
        .stat-box { display: inline-block; background: #f5f5f5; padding: 10px 20px; margin: 5px; border-radius: 5px; }
        .stat-number { font-size: 20px; font-weight: bold; color: #4CAF50; }
        .patterns { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>🔍 Buscador de Ubicaciones</h1>
    
    <div id="tags-container">
        <p>Cargando etiquetas...</p>
    </div>
    
    <div class="search-box">
        <input type="text" id="searchInput" placeholder="Escribe #etiqueta (ej. #Alex)" />
        <button onclick="searchTag()">🔍 Buscar</button>
    </div>
    
    <div id="results">
        <p>Los resultados aparecerán aquí...</p>
    </div>
    
    <div id="patterns" style="display:none;"></div>

    <script>
        async function loadTags() {
            try {
                const response = await fetch('/api/tags');
                const tags = await response.json();
                const container = document.getElementById('tags-container');
                container.innerHTML = '';
                for (const [tag, data] of Object.entries(tags)) {
                    const div = document.createElement('span');
                    div.className = 'tag';
                    div.style.borderColor = data.color;
                    div.innerHTML = '<span class="color-dot" style="background-color:' + data.color + '"></span>' + tag + ' <span class="badge">' + data.locations + ' lugares</span>';
                    div.onclick = function() {
                        document.getElementById('searchInput').value = tag;
                        searchTag();
                    };
                    container.appendChild(div);
                }
            } catch (e) {
                document.getElementById('tags-container').innerHTML = '<p>Error cargando etiquetas</p>';
            }
        }

        async function searchTag() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query || !query.startsWith('#')) {
                alert('Escribe una etiqueta que comience con #');
                return;
            }

            const resultsDiv = document.getElementById('results');
            const patternsDiv = document.getElementById('patterns');
            resultsDiv.innerHTML = '<p>🔍 Buscando...</p>';
            patternsDiv.style.display = 'none';

            try {
                const response = await fetch('/api/tags/' + query);
                const data = await response.json();

                if (!data || data.length === 0) {
                    resultsDiv.innerHTML = '<p>❌ No se encontraron ubicaciones</p>';
                    return;
                }

                let html = '<h3>📍 ' + data.length + ' ubicaciones encontradas:</h3>';
                html += '<div><span class="stat-box"><span class="stat-number">' + data.length + '</span> ubicaciones</span>';
                html += '<span class="stat-box"><span class="stat-number">' + data.reduce((s, l) => s + l.total_visits, 0) + '</span> visitas totales</span></div>';
                
                data.slice(0, 10).forEach(function(loc, i) {
                    html += '<div class="result"><strong>' + (i+1) + '.</strong> ';
                    html += '<span class="color-dot" style="background-color:' + loc.color + '"></span>';
                    html += 'Lat: ' + loc.lat.toFixed(6) + ', Lng: ' + loc.lng.toFixed(6);
                    html += ' <span class="badge">' + loc.total_visits + ' visitas</span>';
                    if (loc.last_visit) {
                        html += '<div style="font-size:12px;color:#666;">Última visita: ' + loc.last_visit + '</div>';
                    }
                    html += '</div>';
                });
                if (data.length > 10) {
                    html += '<p>... y ' + (data.length - 10) + ' más</p>';
                }
                resultsDiv.innerHTML = html;

                const patternsResponse = await fetch('/api/tags/' + query + '/patterns');
                const patterns = await patternsResponse.json();

                if (patterns && Object.keys(patterns).length > 0) {
                    patternsDiv.style.display = 'block';
                    let phtml = '<div class="patterns"><h3>📊 Patrones y coincidencias</h3>';
                    phtml += '<p>Total visitas: ' + patterns.total_visits + '</p>';
                    if (patterns.top_locations) {
                        phtml += '<p><strong>Lugares más frecuentes:</strong></p><ul>';
                        patterns.top_locations.slice(0, 5).forEach(function(loc) {
                            phtml += '<li>' + loc.coords + ' - ' + loc.visits + ' visitas (' + loc.percentage + '%)</li>';
                        });
                        phtml += '</ul>';
                    }
                    if (patterns.tag_coincidences && patterns.tag_coincidences.length > 0) {
                        phtml += '<p><strong>🏷️ Etiquetas que coinciden:</strong></p><ul>';
                        patterns.tag_coincidences.slice(0, 5).forEach(function(tc) {
                            phtml += '<li>' + tc.tag + ' (' + tc.count + ' coincidencias)</li>';
                        });
                        phtml += '</ul>';
                    }
                    if (patterns.time_patterns && patterns.time_patterns.peak_hours) {
                        phtml += '<p><strong>⏰ Horarios más frecuentes:</strong></p><ul>';
                        patterns.time_patterns.peak_hours.forEach(function(h) {
                            phtml += '<li>' + h[0] + ':00 - ' + h[1] + ' veces</li>';
                        });
                        phtml += '</ul>';
                    }
                    phtml += '</div>';
                    patternsDiv.innerHTML = phtml;
                }

            } catch (e) {
                resultsDiv.innerHTML = '<p>❌ Error al buscar</p>';
            }
        }

        document.getElementById('searchInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') searchTag();
        });

        loadTags();
    </script>
</body>
</html>
    '''
    return html

@app.route('/api/tags', methods=['GET'])
def get_tags():
    return jsonify(tagger.get_all_tags())

@app.route('/api/tags/<tag>', methods=['GET'])
def search_tag(tag):
    return jsonify(tagger.search_by_tag(tag))

@app.route('/api/tags/<tag>/patterns', methods=['GET'])
def get_patterns(tag):
    return jsonify(tagger.find_patterns(tag))

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 SERVIDOR INICIADO!")
    print("📍 Visita: http://localhost:5000")
    print("📡 API: http://localhost:5000/api/tags")
    print("="*50 + "\n")
    app.run(debug=True, host='0.0.0.0', port=5000)
