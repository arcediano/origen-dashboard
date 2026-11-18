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
import { Camera, ClipboardList, FileCheck2, Sparkles } from 'lucide-react';
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

const HOW_IT_WORKS = [
  { icon: Camera, text: 'Sube una foto de tu producto' },
  { icon: ClipboardList, text: 'Responde unas preguntas con frases sencillas' },
  { icon: FileCheck2, text: 'Revisa la ficha que la IA redacta por ti' },
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
      className={cn(
        // Mismo patrón que el resto de banners hero de ancho completo
        // (OnboardingProgressBanner, dashboard/page.tsx): rounded-[28px],
        // card blanca (bg-surface-alt) con borde de acento, nunca un
        // gradiente ad-hoc -- hallazgo del humano, 2026-11-06: este banner
        // usaba rounded-2xl + bg-gradient-to-br propio, ninguno de los dos
        // en la guía de diseño (sección 1.3 prohíbe gradientes fuera de los
        // ya definidos; sección 4 reserva rounded-[28px] para estos bloques).
        'rounded-[28px] border border-origen-pradera/25 bg-surface-alt p-4 shadow-sm sm:p-6',
        className,
      )}
    >
      <div className="space-y-4">
        {/* Cabecera + CTA en fila a partir de lg -- el paso a paso vive en
            su PROPIA fila a continuación (ver más abajo), no aquí al lado
            de los botones: 3 columnas compitiendo con la columna de
            botones por el ancho del header dejaba cada paso con ~180px,
            demasiado estrecho para su texto (se partía palabra por
            palabra -- hallazgo del humano, 2026-11-06, captura de
            escritorio). Con el ancho completo de la card, cada paso tiene
            sitio de sobra. */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-origen-pradera/15">
              <Sparkles className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="ai-assist-banner-title" className="text-base font-semibold text-origen-bosque sm:text-lg">
                Crea tu producto con ayuda de la IA en unos sencillos pasos
              </h2>
              <p className="mt-1 text-sm text-text-subtle">
                Origen Assist te guía con preguntas claras y redacta por ti la descripción, el origen y la elaboración con un
                tono comercial y cuidado. Tú lo revisas antes de publicar.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
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
        </div>

        <ol className="grid gap-2 sm:grid-cols-3" aria-label="Cómo funciona">
          {HOW_IT_WORKS.map(({ icon: Icon, text }, index) => (
            <li key={text} className="flex items-center gap-2 rounded-xl bg-origen-pastel/40 p-2.5 text-xs text-origen-oscuro sm:text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-origen-bosque text-[11px] font-semibold text-white">
                {index + 1}
              </span>
              <Icon className="h-4 w-4 shrink-0 text-origen-bosque" aria-hidden="true" />
              <span>{text}</span>
            </li>
          ))}
        </ol>

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
