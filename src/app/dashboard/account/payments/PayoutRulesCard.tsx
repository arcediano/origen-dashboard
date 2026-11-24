'use client';

/**
 * @component PayoutRulesCard
 * @description Reglas de cobro a la vista del productor (petición del humano, 2026-11-24): el pago de cada
 * venta cuenta desde que el pedido figura como ENTREGADO (nunca más de 10 días), el comprador solo puede abrir
 * una disputa durante los primeros días y, mientras haya una abierta, el cobro queda retenido. Los días salen
 * de la política vigente (los edita el admin), no están escritos a mano.
 *
 * Patrón de la guía de diseño (`guia-diseno-ux.md`): Card con CardIconHeader, tokens origen-*, pasos con
 * número en círculo `bg-origen-pradera/15`; en móvil los pasos se apilan, desde `sm` van en 3 columnas.
 */

import { PackageCheck, ShieldAlert, Landmark } from 'lucide-react';
import { Alert, AlertDescription, Card, CardContent, CardHeader, CardIconHeader } from '@arcediano/ux-library';
import type { PayoutPolicyDays } from '@/lib/api/orders';

interface PayoutRulesCardProps {
  policy: PayoutPolicyDays;
}

export function PayoutRulesCard({ policy }: PayoutRulesCardProps) {
  const { payoutRetentionDays, disputeWindowDays } = policy;
  const steps = [
    {
      icon: PackageCheck,
      when: 'Día 0',
      title: 'El pedido figura como entregado',
      text: 'Todos los plazos se cuentan desde la fecha en que el pedido pasa a «Entregado».',
    },
    {
      icon: ShieldAlert,
      when: `Hasta el día ${disputeWindowDays}`,
      title: 'El comprador puede abrir una disputa',
      text: 'Pasado ese plazo ya no puede abrirla. Si la abre, tu cobro queda retenido hasta que se resuelva.',
    },
    {
      icon: Landmark,
      when: `Día ${payoutRetentionDays}`,
      title: 'Origen transfiere el importe',
      text: `El pago llega a tu cuenta de Stripe como máximo ${payoutRetentionDays} días después de la entrega.`,
    },
  ];

  return (
    <Card variant="section" className="rounded-xl sm:rounded-2xl" padding="none" data-testid="payout-rules-card">
      <CardHeader className="p-4 sm:p-5 lg:p-6 border-b border-border-subtle">
        <CardIconHeader
          icon={<Landmark className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />}
          title="Cómo y cuándo cobras cada venta"
          description="Los plazos cuentan desde que el pedido figura como entregado."
          size="md"
        />
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-5 lg:p-6">
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.when} className="flex items-start gap-3 rounded-2xl border border-border-subtle bg-surface-alt p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-origen-pradera/15">
                <step.icon className="h-4.5 w-4.5 text-hoja-tinta" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-hoja-tinta">
                  {index + 1}. {step.when}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-origen-bosque">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <Alert variant="info">
          <AlertDescription>
            <strong>Cobro retenido:</strong> si un pedido tiene una disputa o una devolución abierta, su cobro
            aparece como «Congelado» con el motivo y la fecha, y no sale hasta que se resuelve. Si se resuelve a tu
            favor, se libera y se paga; si se devuelve el dinero al comprador antes de pagarte, el pago no llega a
            ejecutarse. Si la devolución llega después de haber cobrado, el importe se descuenta de tu siguiente
            venta.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
