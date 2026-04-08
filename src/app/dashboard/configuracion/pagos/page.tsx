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
    <div className="w-full">

      {/* Cabecera canónica */}
      <PageHeader
        title="Pagos"
        description="Gestiona tu conexión con Stripe y métodos de cobro"
        badgeIcon={CreditCard}
        badgeText="Pagos"
        tooltip="Pagos"
        tooltipDetailed="Conecta y gestiona tu cuenta de Stripe para recibir pagos de tus clientes."
      />

      <div className="px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 max-w-4xl">

        <Card>
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
              <div className="p-4 bg-origen-crema/30 rounded-lg border border-origen-pradera/30">
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
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
