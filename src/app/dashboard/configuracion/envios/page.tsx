/**
 * @page Logística y Envíos
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Plus, Save, Store, Truck, Zap } from 'lucide-react';

export default function EnviosPage() {
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      <PageHeader
        title="Logística"
        description="Organiza métodos de entrega, zonas activas y la experiencia de envío para tus clientes"
        badgeIcon={Truck}
        badgeText="Logística"
        tooltip="Logística"
        tooltipDetailed="Configura cómo entregas tus productos y qué zonas mantienes activas para la venta."
        actions={
          <div className="hidden lg:block">
            <Button onClick={() => setIsSaving(true)} disabled={isSaving}>
              <span className="inline-flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
              </span>
            </Button>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 space-y-6">
        <div className="rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <Truck className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Entrega sin fricción</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Agrupa aquí todo lo relacionado con métodos de envío, recogida y cobertura geográfica.</p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border border-border-subtle shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg text-origen-bosque">Opciones de envío</CardTitle>
            <Button variant="outline" size="sm">
              <span className="inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Añadir método</span>
              </span>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-origen-bosque">Envío estándar</h3>
                  <p className="text-xs text-muted-foreground">Entrega en 2-3 días laborables</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-origen-pradera">5.90€</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg bg-origen-crema/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-origen-pradera" />
                </div>
                <div>
                  <h3 className="font-medium text-origen-bosque">Envío exprés</h3>
                  <p className="text-xs text-muted-foreground">Entrega en 24 horas</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-origen-pradera">8.90€</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-origen-bosque">Recogida en local</h3>
                  <p className="text-xs text-muted-foreground">Sin coste de envío</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-origen-pradera">0.00€</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border-subtle shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-origen-bosque">Zonas de entrega</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="flex flex-wrap gap-2">
            {['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Toledo'].map((city) => (
              <Badge key={city} variant="leaf" size="sm">{city}</Badge>
            ))}
            <Button variant="outline" size="sm">
              <span className="inline-flex items-center gap-1">
                <Plus className="w-3 h-3" />
                <span>Añadir provincia</span>
              </span>
            </Button>
          </div>
          </CardContent>
        </Card>

        <div className="lg:hidden">
          <Button onClick={() => setIsSaving(true)} disabled={isSaving} className="w-full">
            <span className="inline-flex items-center gap-2">
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
