/**
 * @component ImageFocusPicker
 * @description Selector del punto focal de la imagen principal. Las tarjetas del
 * catálogo recortan la foto (16:10 y 1:1); el productor marca aquí la parte que
 * no debe quedar fuera (p. ej. el sombrero de una seta) tocando o arrastrando
 * sobre la foto, o con los deslizadores. Guarda % (0-100) desde la izquierda y
 * desde arriba; 50/50 = centro (comportamiento por defecto).
 */

'use client';

import { useRef } from 'react';
import { Crosshair } from 'lucide-react';
import { Label } from '@arcediano/ux-library';
import type { ProductImage } from '@/types/product';

interface ImageFocusPickerProps {
  image: ProductImage;
  onChange: (focusX: number, focusY: number) => void;
}

const clamp = (n: number) => Math.min(100, Math.max(0, Math.round(n)));

export function ImageFocusPicker({ image, onChange }: ImageFocusPickerProps) {
  const x = image.focusX ?? 50;
  const y = image.focusY ?? 50;
  const areaRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const setFromPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    onChange(
      clamp(((e.clientX - rect.left) / rect.width) * 100),
      clamp(((e.clientY - rect.top) / rect.height) * 100),
    );
  };

  const objectPosition = `${x}% ${y}%`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Crosshair className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
        <Label className="text-sm font-medium">Encuadre de la imagen principal</Label>
      </div>
      <p className="text-sm text-muted-foreground">
        En el catálogo la foto se recorta. Toca o arrastra sobre ella para marcar la parte que debe verse siempre.
      </p>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)]">
        {/* Foto completa con marcador */}
        <div
          ref={areaRef}
          className="relative w-fit max-w-full self-start touch-none select-none overflow-hidden rounded-xl border border-border bg-origen-pastel cursor-crosshair"
          onPointerDown={(e) => {
            draggingRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            setFromPointer(e);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) setFromPointer(e);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt="Imagen principal del producto"
            draggable={false}
            className="block h-auto max-h-96 w-auto max-w-full"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-origen-bosque/40 shadow-md ring-1 ring-origen-bosque"
            style={{ left: `${x}%`, top: `${y}%` }}
          />
        </div>

        {/* Vistas previas de los recortes reales */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Tarjeta (16:10)</p>
            <div className="overflow-hidden rounded-lg border border-border" style={{ aspectRatio: '16 / 10' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" aria-hidden="true" className="h-full w-full object-cover" style={{ objectPosition }} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Catálogo (cuadrada)</p>
            <div className="overflow-hidden rounded-lg border border-border" style={{ aspectRatio: '1 / 1' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" aria-hidden="true" className="h-full w-full object-cover" style={{ objectPosition }} />
            </div>
          </div>
        </div>
      </div>

      {/* Ajuste fino accesible por teclado */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Horizontal ({x} %)</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={x}
            onChange={(e) => onChange(clamp(Number(e.target.value)), y)}
            className="block w-full accent-origen-bosque"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          <span>Vertical ({y} %)</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={y}
            onChange={(e) => onChange(x, clamp(Number(e.target.value)))}
            className="block w-full accent-origen-bosque"
          />
        </label>
      </div>
    </div>
  );
}
