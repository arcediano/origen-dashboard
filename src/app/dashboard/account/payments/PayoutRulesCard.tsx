'use client';

/**
 * @component PayoutRulesCard
 * @description Reglas de cobro a la vista del productor (petición del humano, 2026-11-24): el pago de cada
 * venta sale SIEMPRE el mismo número de días después de que el pedido figure como ENTREGADO (15 por defecto), sea
 * cual sea el producto, y nunca antes de que el comprador pueda reclamar. En pedidos solo de perecederos (sin
 * desistimiento) la disputa es corta; si hay algún producto que admite desistimiento, disputa y desistimiento se
 * igualan para todo el pedido. Mientras haya una disputa o devolución abierta el cobro queda retenido y Origen lo
 * comprueba justo antes de pagar. Los días salen de la política vigente (los edita el admin).
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
  const { payoutRetentionDays, disputeWindowDays, returnWindowDays } = policy;
  const steps = [
    {
      icon: PackageCheck,
      when: 'Día 0',
      title: 'El pedido figura como entregado',
      text: 'Todos los plazos se cuentan desde la fecha en que el pedido pasa a «Entregado».',
    },
    {
      icon: ShieldAlert,
      when: `Hasta el día ${disputeWindowDays} o ${returnWindowDays}`,
      title: 'El comprador aún puede reclamar',
      text: `Si el pedido solo tiene productos perecederos (sin desistimiento), puede abrir una disputa hasta el día ${disputeWindowDays}. Si incluye algún producto que admite desistimiento, disputa y devolución se igualan hasta el día ${returnWindowDays} para todo el pedido.`,
    },
    {
      icon: Landmark,
      when: `Día ${payoutRetentionDays}`,
      title: 'Origen transfiere el importe',
      text: `Siempre ${payoutRetentionDays} días después de la entrega, sea cual sea el producto: nunca sale antes de que el comprador pueda reclamar.`,
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
            <strong>Cobro retenido:</strong> si un pedido tiene una disputa o una devolución abierta (completa o
            parcial), su cobro aparece como «Congelado» con el motivo y la fecha, y no sale hasta que se resuelve.
            Origen lo comprueba de nuevo justo antes de cada pago. Si se resuelve a tu favor, se libera y se paga; si
            se devuelve el dinero al comprador antes de pagarte, el pago no llega a ejecutarse.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
