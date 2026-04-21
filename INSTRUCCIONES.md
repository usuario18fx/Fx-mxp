# Mapa Personal 3D - Instrucciones de Uso

## 🚀 Acceso a la Aplicación

Tu aplicación está desplegada y lista para usar en:
**URL**: https://tagged-location-feed.preview.emergentagent.com

### ⚠️ Nota Importante sobre la Pantalla Negra
Si ves una pantalla negra en lugar del mapa, es porque el agente de Emergent está en modo "sleep". Para activarlo:

1. Ve a https://app.emergent.sh
2. El agente se despertará automáticamente
3. Refresca tu aplicación y verás el mapa 3D funcionando correctamente

## 📱 Funcionalidades Implementadas

### 1. **Mapa 3D Interactivo**
- Vista isométrica con edificios en 3D y terreno elevado
- Navegación con mouse (arrastrar para mover, scroll para zoom, click derecho + arrastrar para rotar)
- Controles de navegación en la esquina superior derecha

### 2. **Selector de Hora del Día** (arriba centro)
- **Amanecer**: Tonos cálidos naranjas
- **Día**: Iluminación clara y brillante
- **Atardecer**: Tonos rojizos/rosados (predeterminado)
- **Noche**: Ambiente oscuro nocturno

### 3. **Gestión de Ubicaciones**
- **Agregar ubicación**: Haz clic en cualquier parte del mapa y escribe un nombre
- **Ver ubicaciones**: Usa el panel lateral izquierdo (botón con ícono de pin)
- **Seleccionar ubicación**: Click en el nombre en el sidebar o click en el marcador verde en el mapa

### 4. **Panel de Detalles de Ubicación** (se abre al hacer click en una ubicación)
Tiene 3 pestañas:

#### **Pestaña "Info"**
- **Etiquetas**: Agrega tags para categorizar (ej: "arquitectura", "histórico", "restaurante")
  - Escribe en el campo y presiona Enter o click en el ícono de etiqueta
  - Elimina tags pasando el mouse sobre ellos y haciendo click en la X
- **Comentarios**: Agrega notas y observaciones sobre la ubicación
  - Escribe tu comentario y presiona Enter o click en el ícono de mensaje

#### **Pestaña "Imágenes"**
- **Subir fotos**: Arrastra una imagen al área punteada o haz click para seleccionar
- Formatos soportados: JPG, PNG, WEBP, GIF
- Las imágenes se almacenan en object storage de Emergent

#### **Pestaña "IA"**
- Haz click en "Analizar con IA"
- La IA (GPT-5.2) analizará la ubicación y encontrará:
  - Relaciones con otras ubicaciones guardadas
  - Patrones en tus tags y comentarios
  - Insights interesantes sobre tus lugares

### 5. **Botón de Emergencias** (botón rojo pulsante, abajo derecha)
- Click para abrir el diálogo de emergencia
- Ingresa nombre y teléfono de tu contacto de emergencia
- Escribe un mensaje opcional
- Al enviar, se captura tu ubicación GPS actual y se prepara para envío

⚠️ **Nota**: Actualmente el envío de emergencias está en modo simulado (no envía SMS real). Para producción, se puede integrar con Twilio o WhatsApp.

## 🎨 Diseño

- **Tema oscuro** minimalista con efectos glassmorphism
- **Colores**: Fondo #07090F, superficies con transparencia y blur
- **Tipografía**: Chivo (títulos), IBM Plex Sans (texto)
- **Botones animados** con transiciones suaves

## 🔑 Credenciales y APIs

Tu aplicación ya tiene configuradas:
- ✅ Mapbox Access Token (tu token personal)
- ✅ Universal LLM Key de Emergent (para IA)
- ✅ Object Storage de Emergent (para imágenes)
- ✅ MongoDB (base de datos)

**No necesitas configurar nada adicional** - todo está listo para usar.

## 📊 Datos de Ejemplo

Ya hay una ubicación de prueba creada:
- **Torre Latinoamericana** (Ciudad de México)
- Con comentario: "Vista increíble desde el mirador"
- Con tags: "arquitectura", "histórico"

Puedes hacer click en ella en el sidebar para ver cómo funciona el panel de detalles.

## 🐛 Solución de Problemas

### Problema: Veo pantalla negra
**Solución**: Visita app.emergent.sh para despertar el agente

### Problema: No aparece el mapa
**Solución**: 
1. Verifica que estés usando un navegador moderno (Chrome, Firefox, Safari, Edge)
2. Asegúrate de tener WebGL habilitado
3. Refresca la página

### Problema: No puedo subir imágenes
**Solución**: Verifica que la imagen sea JPG, PNG o WEBP y menor a 10MB

### Problema: El análisis IA no responde
**Solución**: Esto puede tomar unos segundos, espera un momento y verás el resultado

## 💡 Próximas Mejoras Sugeridas

1. **Alertas reales**: Integrar Twilio para enviar SMS de emergencia reales
2. **Exportar datos**: Descargar todas tus ubicaciones como KML/GeoJSON
3. **Compartir**: Generar link para compartir ubicaciones específicas
4. **Rutas**: Calcular rutas entre ubicaciones guardadas
5. **Filtros**: Filtrar ubicaciones por tags
6. **Búsqueda**: Buscar ubicaciones por nombre o descripción

## 📞 Soporte

Si tienes dudas o problemas, contacta al equipo de Emergent en app.emergent.sh

---

¡Disfruta tu mapa personal 3D! 🗺️✨
