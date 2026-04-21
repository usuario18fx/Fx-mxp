import { MapPin, Tag, MessageSquare, X } from 'lucide-react';

const Sidebar = ({ locations, onLocationClick, onRefresh, isOpen, onToggle }) => {
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-3 glass rounded-xl hover:bg-white/10 transition-smooth"
        data-testid="sidebar-toggle-button"
      >
        <MapPin className="w-6 h-6 text-[#4ADE80]" />
      </button>
    );
  }

  return (
    <div className="fixed top-4 left-4 w-80 max-h-[calc(100vh-2rem)] z-40 glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
         data-testid="sidebar">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight" data-testid="sidebar-title">
            Ubicaciones
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">
            {locations.length} guardadas
          </p>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
          data-testid="sidebar-close-button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="locations-list">
        {locations.length === 0 ? (
          <div className="text-center py-8 text-[#94A3B8]" data-testid="empty-locations">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay ubicaciones aún</p>
            <p className="text-xs mt-1">Haz clic en el mapa para agregar</p>
          </div>
        ) : (
          locations.map((location) => (
            <div
              key={location.id}
              onClick={() => onLocationClick(location)}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-smooth cursor-pointer"
              data-testid={`location-card-${location.id}`}
            >
              <h3 className="font-semibold text-base mb-2" data-testid={`location-name-${location.id}`}>
                {location.name}
              </h3>
              
              <div className="flex items-center gap-4 text-xs text-[#94A3B8] mb-2">
                <div className="flex items-center gap-1" data-testid={`location-coords-${location.id}`}>
                  <MapPin className="w-3 h-3" />
                  {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-2 text-xs text-[#94A3B8]">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {new Date(location.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {location.tags && location.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2" data-testid={`location-tags-${location.id}`}>
                  {location.tags.slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-md text-xs font-mono bg-white/10 text-white/80"
                      data-testid={`location-tag-${location.id}-${idx}`}
                    >
                      {tag}
                    </span>
                  ))}
                  {location.tags.length > 3 && (
                    <span className="px-2 py-1 rounded-md text-xs font-mono bg-white/10 text-white/80">
                      +{location.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {location.comments?.length || 0}
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {location.tags?.length || 0}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={onRefresh}
          className="w-full py-2 px-4 rounded-xl bg-[#4ADE80] hover:bg-[#4ADE80]/90 text-[#07090F] font-semibold text-sm transition-smooth"
          data-testid="refresh-locations-button"
        >
          Actualizar
        </button>
      </div>
    </div>
  );
};

export default Sidebar;