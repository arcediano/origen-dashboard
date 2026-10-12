/**
 * @component ProductFormSidebar
 * @description Tips card sidebar — shared between create and edit pages.
 */

'use client';

import { Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Badge } from '@arcediano/ux-library';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProductFormSidebarProps {
  tips: Array<{ description: string; category?: string }>;
  keyFact?: string;
  /**
   * Para componerlo junto al panel de pasos dentro de un único contenedor
   * `sticky` del propio page (petición del humano, 2026-10-08: el panel de
   * pasos debe quedar encima de "Consejos útiles" y los dos siempre
   * visibles al hacer scroll). Sin esto, cada uno con su propio `sticky`
   * independiente nunca alinea bien sus offsets porque el panel de pasos
   * cambia de alto al condensarse con el scroll. En `embedded`: sin el
   * wrapper `hidden lg:block lg:col-span-1` + `sticky top-[260px]` propio
   * — el padre ya aplica la columna y el `sticky`.
   */
  embedded?: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductFormSidebar({ tips, keyFact, embedded }: ProductFormSidebarProps) {
  const card = (
        <Card
          variant="elevated"
          className="overflow-hidden border border-border shadow-sm"
        >
          <CardHeader spacing="md">
            {/* flex-wrap + items-start evita que, en tablets grandes justo en
                el breakpoint lg (~1024-1112px, ej. iPad Pro en horizontal),
                la columna del sidebar sea tan estrecha que el badge de
                conteo -- antes centrado verticalmente con items-center --
                quede solapado sobre "Consejos útiles" al saltar éste a una
                segunda línea. Con flex-wrap el badge simplemente baja a su
                propia línea en vez de invadir el título. */}
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-hoja-tinta" />
                </div>
                <CardTitle size="sm">Consejos útiles</CardTitle>
              </div>
              <Badge variant="leaf" size="xs" className="shrink-0 whitespace-nowrap">
                {tips.length} consejos
              </Badge>
            </div>
          </CardHeader>

          <CardContent spacing="md">
            <ul className="space-y-3">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-origen-pradera/10 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-origen-pradera" />
                  </div>
                  <span className="flex-1">{tip.description}</span>
                </li>
              ))}
            </ul>

            {keyFact && (
              <div className="mt-4 p-3 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-hoja-tinta" />
                  <span className="text-xs font-medium text-origen-bosque">Dato clave</span>
                </div>
                <p className="text-xs text-muted-foreground">{keyFact}</p>
              </div>
            )}
          </CardContent>
        </Card>
  );

  if (embedded) return card;

  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-[260px]">
        {card}
      </div>
    </div>
  );
}

