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
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ProductFormSidebar({ tips, keyFact }: ProductFormSidebarProps) {
  return (
    <div className="hidden lg:block lg:col-span-1">
      <div className="sticky top-[260px]">
        <Card
          variant="elevated"
          className="overflow-hidden border border-border shadow-sm"
        >
          <CardHeader spacing="md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-origen-pradera" />
                </div>
                <CardTitle size="sm">Consejos útiles</CardTitle>
              </div>
              <Badge variant="leaf" size="xs">
                {tips.length} consejos
              </Badge>
            </div>
          </CardHeader>

          <CardContent spacing="md">
            <ul className="space-y-3">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <div className="w-4 h-4 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-origen-pradera" />
                  </div>
                  <span className="flex-1">{tip.description}</span>
                </li>
              ))}
            </ul>

            {keyFact && (
              <div className="mt-4 p-3 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-origen-pradera" />
                  <span className="text-xs font-medium text-origen-bosque">Dato clave</span>
                </div>
                <p className="text-xs text-muted-foreground">{keyFact}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
