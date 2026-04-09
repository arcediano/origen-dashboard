/**
 * @page Configuración de Pagos
 * @version 1.1.0
 */

'use client';

import { useState } from 'react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Button } from '@arcediano/ux-library';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PagosPage() {
  const [isConnected] = useState(true);

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">

      {/* Cabecera canónica */}
      <PageHeader
        title="Cobros"
        description="Gestiona Stripe, el estado de tu cuenta y cómo cobras tus ventas"
        badgeIcon={CreditCard}
        badgeText="Cobros"
        tooltip="Cobros"
        tooltipDetailed="Conecta y gestiona tu cuenta de Stripe para recibir pagos, revisar verificaciones y evitar bloqueos."
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">

        <div className="mb-5 rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
              <CreditCard className="h-5 w-5 text-origen-pradera" />
            </div>
            <div>
              <p className="text-sm font-semibold text-origen-bosque leading-tight">Cobros listos para vender</p>
              <p className="mt-1 text-xs text-text-subtle sm:text-sm">Mantén activa tu integración con Stripe para recibir pagos sin fricción y con trazabilidad.</p>
            </div>
          </div>
        </div>

        <Card className="rounded-2xl border border-border-subtle shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-origen-pradera" />
              Stripe Connect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-origen-pradera" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Procesa pagos con tarjeta, transferencia y métodos locales</p>
              </div>
              {isConnected ? (
                <span className="flex items-center gap-1.5 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  Conectado
                </span>
              ) : (
                <Button variant="primary">
                  Conectar Stripe
                </Button>
              )}
            </div>

            {isConnected && (
              <div className="p-4 bg-origen-crema/30 rounded-xl border border-origen-pradera/30">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-origen-pradera" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-origen-bosque">Cuenta verificada</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Puedes recibir pagos de forma inmediata. Comisión: 1.4% + 0.25€ por transacción.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border-subtle bg-surface-alt p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-origen-hoja/20 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-4 h-4 text-origen-bosque" />
                </div>
                <div>
                  <p className="text-sm font-medium text-origen-bosque">Siguiente recomendación</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Verifica periódicamente tus datos fiscales y bancarios para evitar pausas en la liquidación.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
