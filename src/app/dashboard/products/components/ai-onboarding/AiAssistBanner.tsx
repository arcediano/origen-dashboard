/**
 * @component AiAssistBanner
 * @description Aviso destacado, al principio del alta manual de producto, que
 * explica que se puede crear el producto con ayuda de la IA en unos sencillos
 * pasos (petición del humano, 2026-11-05: sustituye al botón suelto "Probar
 * IA"). Se puede plegar a una versión compacta, pero nunca desaparece: el
 * acceso al asistente siempre queda a la vista.
 */
'use client';

import { useEffect, useState } from 'react';
import { Camera, FileText, Sparkles } from 'lucide-react';
import { Button } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import { AiCreditsPanel } from './AiCreditsPanel';

const COLLAPSED_STORAGE_KEY = 'origen-ai-assist-banner-collapsed';

interface AiAssistBannerProps {
  quota: { used: number; total: number; free?: number; purchased?: number };
  onStart: () => void;
  onRecharge: () => void;
  className?: string;
}

const BENEFITS = [
  { icon: Camera, title: 'Foto lista para vender', text: 'Fondo limpio y luz de estudio, sin cambiar tu producto.' },
  { icon: FileText, title: 'Textos que convencen', text: 'Descripción, origen y elaboración redactados por ti, con tono comercial.' },
];

export function AiAssistBanner({ quota, onStart, onRecharge, className }: AiAssistBannerProps) {
  const remaining = Math.max(0, quota.total - quota.used);
  const [collapsed, setCollapsed] = useState(false);

  // Leído en cliente tras montar para no desajustar la hidratación.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1');
    } catch {
      // Sin almacenamiento: el banner se muestra desplegado.
    }
  }, []);

  const setCollapsedPersisted = (value: boolean) => {
    setCollapsed(value);
    try {
      if (value) localStorage.setItem(COLLAPSED_STORAGE_KEY, '1');
      else localStorage.removeItem(COLLAPSED_STORAGE_KEY);
    } catch {
      // Preferencia no persistida; sigue funcionando en esta visita.
    }
  };

  if (remaining === 0) {
    return <AiCreditsPanel quota={quota} onRecharge={onRecharge} className={className} />;
  }

  if (collapsed) {
    return (
      <section
        data-testid="ai-assist-banner-compact"
        aria-label="Crear el producto con ayuda de la IA"
        className={cn(
          'flex flex-col gap-2 rounded-2xl border border-origen-pradera/30 bg-origen-pradera/10 p-3 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
        <p className="flex items-center gap-2 text-sm font-medium text-origen-bosque">
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
          ¿Prefieres que la IA te ayude a crear el producto?
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setCollapsedPersisted(false)}>
            Ver cómo funciona
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onStart}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            Crear con IA
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="ai-assist-banner"
      aria-labelledby="ai-assist-banner-title"
      // Banner hero (guía de diseño 1.3/4): rounded-[28px], card blanca con borde de acento.
      className={cn('rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-5 shadow-sm sm:p-6', className)}
    >
      <div className="flex flex-col gap-5">
        {/* Directo y orientado a vender: qué consigue el productor, no cómo funciona. */}
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-origen-pradera/15">
            <Sparkles className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id="ai-assist-banner-title" className="text-lg font-semibold leading-snug text-origen-bosque sm:text-xl">
              Una ficha mejor vende más
            </h2>
            <p className="mt-1 text-sm text-text-subtle sm:text-base">
              La foto y el texto deciden la compra. Deja que la IA los mejore en unos 5 minutos; tú revisas antes de publicar.
            </p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2" aria-label="Qué mejora la IA">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3 rounded-2xl bg-origen-pastel/40 p-3.5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-origen-bosque" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-origen-bosque">{title}</p>
                <p className="mt-0.5 text-sm text-text-subtle">{text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={onStart}
            leftIcon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
          >
            Empezar con el asistente
          </Button>
          <Button type="button" variant="ghost" onClick={() => setCollapsedPersisted(true)}>
            Prefiero rellenarlo a mano
          </Button>
        </div>

        <p className="text-xs text-text-subtle" data-testid="ai-assist-banner-credits">
          Te {remaining === 1 ? 'queda' : 'quedan'} <strong className="text-origen-bosque">{remaining}</strong>{' '}
          {remaining === 1 ? 'crédito' : 'créditos'} · 1 crédito = 1 producto, solo se usa si la ficha se crea.{' '}
          <button
            type="button"
            onClick={onRecharge}
            className="font-semibold text-origen-bosque underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
          >
            Recargar créditos
          </button>
        </p>
      </div>
    </section>
  );
}
