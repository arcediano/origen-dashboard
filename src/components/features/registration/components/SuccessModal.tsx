// ============================================================================
// COMPONENT: SuccessModal
// ============================================================================
// Modal displayed after successful form submission with tracking code

import { useState } from 'react';
import { Dialog, DialogContent } from '@arcediano/ux-library';
import { CheckCircle, MapPin, Copy, Clock } from 'lucide-react';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';

export interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  contactName: string;
  email: string;
  municipio: string;
  province: string;
  trackingCode: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen, onClose, businessName, contactName, email, municipio, province, trackingCode
}) => {
  const [copied, setCopied] = useState(false);

  const initial = businessName?.charAt(0).toUpperCase() || 'O';
  const provinceName = PROVINCIAS_ESPANA.find(
    p => p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === province
  ) || province;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        showCloseButton={false}
        closeOnOutsideClick
        className="sm:max-w-md overflow-hidden p-0"
      >
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-origen-bosque via-origen-pino to-origen-hoja" />

        <div className="p-4 sm:p-6 flex flex-col gap-3">

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-2 w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-lg">
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div className="inline-flex items-center gap-1.5 bg-origen-crema rounded-full px-3 py-1 border border-origen-hoja/30 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-origen-hoja animate-pulse" />
              <span className="text-[10px] font-bold text-origen-bosque uppercase tracking-wider">Solicitud recibida</span>
            </div>
            <h2 className="text-base sm:text-xl font-bold text-origen-bosque leading-tight">
              ¡Gracias, {contactName}!
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Te escribiremos a{' '}
              <span className="font-semibold text-origen-bosque">{email}</span>
              {' '}en menos de 24h.
            </p>
          </div>

          {/* Tracking code */}
          <div className="bg-gradient-to-br from-gray-900 to-origen-bosque rounded-xl p-3 sm:p-4">
            <p className="text-[10px] font-medium text-white/50 uppercase tracking-widest mb-1.5">Código de seguimiento</p>
            <div className="flex items-center justify-between gap-3">
              <code className="font-mono text-sm sm:text-lg font-bold text-white tracking-wide break-all">
                {trackingCode}
              </code>
              <button
                onClick={handleCopyCode}
                aria-label="Copiar código"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-surface-alt/10 flex items-center justify-center hover:bg-surface-alt/20 active:scale-95 transition-all border border-white/15"
              >
                {copied
                  ? <CheckCircle className="w-3.5 h-3.5 text-origen-hoja" />
                  : <Copy className="w-3.5 h-3.5 text-white" />}
              </button>
            </div>
            <p className="text-[10px] text-white/40 mt-1.5">
              Guarda este código para consultar el estado de tu solicitud.
            </p>
          </div>

          {/* Business info + response time */}
          <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-origen-hoja flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-xs font-bold text-white">{initial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-origen-bosque truncate">{businessName}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {municipio}, {provinceName}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>24h</span>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-origen-bosque hover:border-origen-hoja/40 hover:bg-origen-crema/30 active:scale-[.98] transition-all"
          >
            Cerrar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
