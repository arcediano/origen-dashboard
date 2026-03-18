/**
 * @page Configuración de Pagos
 * @version 1.0.0
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/atoms/button';
import { Card } from '@/components/ui/atoms/card';
import { ArrowLeft, Save, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PagosPage() {
  const [isConnected] = useState(true);

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/configuracion">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-origen-bosque">Configuración de pagos</h1>
            <p className="text-sm text-gray-500">Gestiona tu conexión con Stripe</p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-origen-pradera/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-origen-pradera" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-origen-bosque">Stripe Connect</h2>
            <p className="text-sm text-gray-500">Procesa pagos con tarjeta, transferencia y métodos locales</p>
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
          <div className="mt-4 p-4 bg-origen-crema/30 rounded-lg border border-origen-pradera/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-origen-pradera" />
              </div>
              <div>
                <p className="text-sm font-medium text-origen-bosque">Cuenta verificada</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  Puedes recibir pagos de forma inmediata. Comisión: 1.4% + 0.25€ por transacción.
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}