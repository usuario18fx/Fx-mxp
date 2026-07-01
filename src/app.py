from flask import Flask, request, jsonify, send_from_directory
from location_tagger import LocationTagger
import os

app = Flask(__name__)

tagger = LocationTagger('../data/location-history.json')
tagger.load_tags('../tags_data.json')

# Servir el HTML
@app.route('/')
def index():
    # Lee tu archivo HTML desde un archivo externo
    with open('../web/index.html', 'r', encoding='utf-8') as f:
        return f.read()

# API para obtener etiquetas
@app.route('/api/tags', methods=['GET'])
def get_tags():
    return jsonify(tagger.get_all_tags())

# API para buscar por etiqueta
@app.route('/api/tags/<tag>', methods=['GET'])
def search_tag(tag):
    results = tagger.search_by_tag(tag)
    return jsonify(results)

# API para obtener patrones
@app.route('/api/tags/<tag>/patterns', methods=['GET'])
def get_patterns(tag):
    patterns = tagger.find_patterns(tag)
    return jsonify(patterns)

# API para guardar ubicación desde el mapa
@app.route('/api/places', methods=['POST'])
def save_place():
    data = request.json
    # Guardar la ubicación con etiquetas
    # Aquí conectas con LocationTagger
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)