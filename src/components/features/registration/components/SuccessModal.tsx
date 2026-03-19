// ============================================================================
// COMPONENT: SuccessModal
// ============================================================================
// Modal displayed after successful form submission with tracking code

import { useRef, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  MapPin,
  Copy,
  Clock,
} from 'lucide-react';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-origen-bosque/80 backdrop-blur-sm"
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'relative w-full sm:max-w-lg',
              'bg-surface-alt sm:rounded-2xl rounded-t-2xl',
              'shadow-2xl border border-border-subtle',
              'overflow-hidden max-h-[95dvh] overflow-y-auto'
            )}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-origen-bosque via-origen-pino to-origen-hoja" />
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="p-5 sm:p-8">
              <div className="text-center mb-5">
                <div className="mx-auto mb-4 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="inline-flex items-center gap-1.5 bg-origen-crema rounded-full px-3 py-1.5 border border-origen-hoja/30 mb-3">
                  <div className="w-2 h-2 rounded-full bg-origen-hoja animate-pulse" />
                  <span className="text-xs font-bold text-origen-bosque uppercase tracking-wider">Solicitud recibida</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-origen-bosque mb-1">
                  ¡Gracias, {contactName}!
                </h2>
                <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
                  Hemos recibido tu solicitud. Nuestro equipo la revisará pronto.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-origen-crema/60 border border-origen-hoja/20 rounded-xl p-3 md:p-4 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-origen-hoja/15 flex items-center justify-center mt-0.5">
                  <Clock className="w-4 h-4 text-origen-hoja" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-origen-bosque mb-0.5">Respuesta en menos de 24 horas</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Te escribiremos a <span className="font-semibold text-origen-bosque">{email}</span>.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-origen-bosque rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Código de seguimiento</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono text-base sm:text-xl font-bold text-white tracking-wide break-all">
                    {trackingCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    aria-label="Copiar código"
                    className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-alt/10 flex items-center justify-center hover:bg-surface-alt/20 active:scale-95 transition-all border border-white/15"
                  >
                    {copied
                      ? <CheckCircle className="w-4 h-4 text-origen-hoja" />
                      : <Copy className="w-4 h-4 text-white" />}
                  </button>
                </div>
                <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                  Guarda este código para consultar el estado de tu solicitud.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-surface border border-border-subtle rounded-xl p-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-origen-hoja flex items-center justify-center flex-shrink-0 shadow">
                  <span className="text-sm font-bold text-white">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-origen-bosque truncate">{businessName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {municipio}, {provinceName}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-origen-bosque hover:border-origen-hoja/40 hover:bg-origen-crema/30 active:scale-[.98] transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
