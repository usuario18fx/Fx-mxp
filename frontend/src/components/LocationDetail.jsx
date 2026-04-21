import { useState } from 'react';
import { X, MessageSquare, Tag, Image as ImageIcon, Sparkles, Loader2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LocationDetail = ({ location, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [comment, setComment] = useState('');
  const [tag, setTag] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setUploading(true);
    const file = acceptedFiles[0];
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      await axios.post(`${API}/locations/${location.id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Imagen subida exitosamente');
      onUpdate();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1
  });

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    
    try {
      await axios.post(`${API}/locations/${location.id}/comments`, {
        text: comment
      });
      setComment('');
      toast.success('Comentario agregado');
      onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    }
  };

  const handleAddTag = async () => {
    if (!tag.trim()) return;
    
    try {
      await axios.post(`${API}/locations/${location.id}/tags`, {
        tag: tag.trim()
      });
      setTag('');
      toast.success('Etiqueta agregada');
      onUpdate();
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('Error al agregar etiqueta');
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    try {
      await axios.delete(`${API}/locations/${location.id}/tags/${encodeURIComponent(tagToRemove)}`);
      toast.success('Etiqueta eliminada');
      onUpdate();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('Error al eliminar etiqueta');
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await axios.post(`${API}/ai/analyze`, {
        location_id: location.id
      });
      setAnalysis(res.data.analysis);
      setActiveTab('ai');
    } catch (error) {
      console.error('Error analyzing:', error);
      toast.error('Error al analizar');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteLocation = async () => {
    if (!window.confirm('¿Estás seguro de eliminar esta ubicación?')) return;
    
    try {
      await axios.delete(`${API}/locations/${location.id}`);
      toast.success('Ubicación eliminada');
      onClose();
      onUpdate();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Error al eliminar ubicación');
    }
  };

  return (
    <div className="fixed right-4 top-4 w-96 max-h-[calc(100vh-2rem)] z-50 glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
         data-testid="location-detail-panel">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-start justify-between mb-2">
          <h2 className="text-2xl font-bold tracking-tight" data-testid="location-detail-name">
            {location.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
            data-testid="location-detail-close-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-[#94A3B8]" data-testid="location-detail-coords">
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 bg-white/5">
        {['info', 'images', 'ai'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium transition-smooth ${
              activeTab === tab
                ? 'text-[#4ADE80] border-b-2 border-[#4ADE80]'
                : 'text-[#94A3B8] hover:text-white'
            }`}
            data-testid={`tab-${tab}`}
          >
            {tab === 'info' && 'Info'}
            {tab === 'images' && 'Imágenes'}
            {tab === 'ai' && 'IA'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6" data-testid="location-detail-content">
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Tags */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-3 block">
                Etiquetas
              </label>
              <div className="flex flex-wrap gap-2 mb-3" data-testid="tags-container">
                {location.tags && location.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-md text-xs font-mono bg-white/10 text-white/80 flex items-center gap-2 group"
                    data-testid={`tag-${idx}`}
                  >
                    {t}
                    <button
                      onClick={() => handleRemoveTag(t)}
                      className="opacity-0 group-hover:opacity-100 transition-smooth"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  placeholder="Nueva etiqueta"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#4ADE80] transition-smooth"
                  data-testid="tag-input"
                />
                <button
                  onClick={handleAddTag}
                  className="p-2 rounded-xl bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-[#07090F] transition-smooth"
                  data-testid="add-tag-button"
                >
                  <Tag className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-3 block">
                Comentarios
              </label>
              <div className="space-y-3 mb-3" data-testid="comments-container">
                {location.comments && location.comments.map((c, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                    data-testid={`comment-${idx}`}
                  >
                    <p className="text-sm text-white leading-relaxed">{c.text}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-[#94A3B8]">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {new Date(c.created_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-white/30">•</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {new Date(c.created_at).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {(!location.comments || location.comments.length === 0) && (
                  <p className="text-sm text-[#94A3B8] text-center py-4" data-testid="no-comments">
                    No hay comentarios aún
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Nuevo comentario"
                  className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#4ADE80] transition-smooth"
                  data-testid="comment-input"
                />
                <button
                  onClick={handleAddComment}
                  className="p-2 rounded-xl bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-[#07090F] transition-smooth"
                  data-testid="add-comment-button"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-4">
            {/* Upload area */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-smooth ${
                isDragActive
                  ? 'border-[#4ADE80] bg-[#4ADE80]/10'
                  : 'border-white/20 hover:border-white/40'
              }`}
              data-testid="image-upload-area"
            >
              <input {...getInputProps()} data-testid="image-upload-input" />
              {uploading ? (
                <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-[#4ADE80]" />
              ) : (
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-[#94A3B8]" />
              )}
              <p className="text-sm text-[#94A3B8]">
                {uploading
                  ? 'Subiendo...'
                  : isDragActive
                  ? 'Suelta la imagen aquí'
                  : 'Arrastra una imagen o haz clic para seleccionar'}
              </p>
            </div>

            {/* Images grid */}
            <div className="grid grid-cols-2 gap-3" data-testid="images-grid">
              {location.images && location.images.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-xl overflow-hidden bg-white/5 border border-white/10"
                  data-testid={`image-${idx}`}
                >
                  <img
                    src={`${API}/images/${img.storage_path}`}
                    alt={img.original_filename}
                    className="w-full h-full object-cover"
                    data-testid={`image-preview-${idx}`}
                  />
                </div>
              ))}
              {(!location.images || location.images.length === 0) && (
                <div className="col-span-2 text-center py-8 text-[#94A3B8]" data-testid="no-images">
                  <p className="text-sm">No hay imágenes aún</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            {!analysis && (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-[#F59E0B]" />
                <p className="text-sm text-[#94A3B8] mb-4">
                  Analiza esta ubicación con IA para encontrar relaciones y patrones
                </p>
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-6 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white font-semibold text-sm transition-smooth disabled:opacity-50 flex items-center gap-2 mx-auto"
                  data-testid="analyze-button"
                >
                  {analyzing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {analyzing ? 'Analizando...' : 'Analizar con IA'}
                </button>
              </div>
            )}

            {analysis && (
              <div className="space-y-4" data-testid="ai-analysis-result">
                <div className="p-4 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-[#F59E0B]" />
                    <h3 className="font-semibold text-sm">Análisis IA</h3>
                  </div>
                  <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                    {analysis}
                  </p>
                </div>
                <button
                  onClick={() => setAnalysis('')}
                  className="w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A3B8] font-medium text-sm transition-smooth"
                  data-testid="clear-analysis-button"
                >
                  Limpiar análisis
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleDeleteLocation}
          className="w-full py-2 px-4 rounded-xl bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] font-medium text-sm transition-smooth flex items-center justify-center gap-2"
          data-testid="delete-location-button"
        >
          <Trash2 className="w-4 h-4" />
          Eliminar ubicación
        </button>
      </div>
    </div>
  );
};

export default LocationDetail;