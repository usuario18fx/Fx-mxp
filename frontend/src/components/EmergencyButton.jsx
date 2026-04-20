import { useState } from 'react';
import { AlertTriangle, X, Phone, User, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EmergencyButton = () => {
  const [showDialog, setShowDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [message, setMessage] = useState('Necesito ayuda urgente');

  const handleSend = async () => {
    if (!contactName || !contactPhone) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setSending(true);
    
    try {
      // Get current location
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            await axios.post(`${API}/emergency/send`, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              message,
              contact: {
                name: contactName,
                phone: contactPhone
              }
            });
            
            toast.success(`Alerta enviada a ${contactName}`);
            setShowDialog(false);
            setContactName('');
            setContactPhone('');
            setMessage('Necesito ayuda urgente');
          } catch (error) {
            console.error('Error sending emergency:', error);
            toast.error('Error al enviar alerta');
          } finally {
            setSending(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('No se pudo obtener la ubicación');
          setSending(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al enviar alerta');
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-[#EF4444] hover:bg-[#EF4444]/90 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] pulse transition-smooth flex items-center justify-center"
        data-testid="emergency-button"
      >
        <AlertTriangle className="w-8 h-8" />
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
             data-testid="emergency-dialog">
          <div className="w-full max-w-md mx-4 glass rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
                </div>
                <h2 className="text-xl font-bold" data-testid="emergency-dialog-title">
                  Alerta de Emergencia
                </h2>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-smooth"
                data-testid="emergency-dialog-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#94A3B8]">
                Se enviará tu ubicación actual y toda la información de tus ubicaciones guardadas al contacto especificado.
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-2">
                  Nombre del contacto
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej: Mamá"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#4ADE80] transition-smooth"
                    data-testid="emergency-contact-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-2">
                  Teléfono del contacto
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+52 555 123 4567"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#4ADE80] transition-smooth"
                    data-testid="emergency-contact-phone"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-2">
                  Mensaje
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe la situación..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-[#4ADE80] transition-smooth resize-none"
                  data-testid="emergency-message"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                disabled={sending}
                className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A3B8] font-medium text-sm transition-smooth disabled:opacity-50"
                data-testid="emergency-cancel-button"
              >
                Cancelar
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 py-3 px-4 rounded-xl bg-[#EF4444] hover:bg-[#EF4444]/90 text-white font-semibold text-sm transition-smooth disabled:opacity-50 flex items-center justify-center gap-2"
                data-testid="emergency-send-button"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                {sending ? 'Enviando...' : 'Enviar Alerta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencyButton;