/**
 * @component AddCreditsModal
 * @description Compra de créditos del asistente de IA (petición del humano,
 * 2026-10-04): cuando el productor agota el cupo gratis, puede comprar más
 * con cobro REAL de tarjeta vía Stripe (Payment Element), igual que el modal
 * "Añadir créditos" de referencia — tarjetas de cantidad con descuento,
 * resumen del pedido y botón de pago. 1 crédito = 1,80 €; 15% de descuento
 * desde 3 créditos, 30% desde 5 (el backend es la autoridad de precio; aquí
 * solo se muestran los importes que él calcula).
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Check, Coins, Loader2, Sparkles } from 'lucide-react';
import {
  Alert,
  AlertDescription,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import {
  checkoutAiCredits,
  getAiCreditPurchaseStatus,
  getAiCreditsPricing,
} from '@/lib/api/ai-assist';
import {
  formatEurCents,
  type AiCreditPriceQuote,
  type AiCreditsCheckoutResult,
  type AiCreditsPricingInfo,
} from '@/lib/ai-assist/ai-credits';

const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
let stripePromise: ReturnType<typeof loadStripe> | null = null;
function getStripe() {
  if (!stripePromise) stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY ?? '');
  return stripePromise;
}

const MIN_CUSTOM_CREDITS = 2;
const MAX_CREDITS = 50;
/** Cuántas veces se consulta el estado tras confirmar el pago, antes de darlo por "en proceso". */
const STATUS_POLL_ATTEMPTS = 6;
const STATUS_POLL_DELAY_MS = 1500;

export interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tras acreditar los créditos (webhook confirmado): refresca el cupo del productor. */
  onCreditsPurchased: () => void;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Tarjeta de cantidad preconfigurada (1 / 3 / 5 créditos), con el precio ya calculado por el backend. */
function PresetCard({
  quote,
  selected,
  onSelect,
}: {
  quote: AiCreditPriceQuote;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'relative flex flex-1 flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-center transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
        selected
          ? 'border-origen-bosque bg-origen-pradera/5'
          : 'border-border-subtle bg-surface-alt hover:border-origen-pradera/60',
      )}
    >
      {selected && (
        <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-origen-bosque text-white">
          <Check className="h-3 w-3" aria-hidden="true" />
        </span>
      )}
      <span className="text-lg font-bold text-origen-bosque">
        {quote.credits} {quote.credits === 1 ? 'crédito' : 'créditos'}
      </span>
      <span className="text-sm font-semibold text-origen-oscuro">
        {formatEurCents(quote.totalCents)}
      </span>
      {quote.discountPct > 0 ? (
        <Badge variant="success" size="xs">
          -{quote.discountPct}%
        </Badge>
      ) : (
        <span className="text-xs text-text-subtle">Sin descuento</span>
      )}
    </button>
  );
}

/** Paso 2: Payment Element de Stripe ya montado sobre el `clientSecret` del checkout. */
function PaymentStep({
  checkout,
  onSucceeded,
  onBack,
}: {
  checkout: AiCreditsCheckoutResult;
  onSucceeded: () => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements || isPaying) return;
    setIsPaying(true);
    setError(null);
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });
    if (confirmError) {
      setError(confirmError.message ?? 'No se ha podido procesar el pago. Inténtalo de nuevo.');
      setIsPaying(false);
      return;
    }
    if (paymentIntent?.status === 'succeeded' || paymentIntent?.status === 'processing') {
      setIsConfirming(true);
      // El webhook de Stripe es quien acredita los créditos — se consulta el
      // estado hasta que llegue, en vez de darlo por hecho solo porque Stripe
      // confirmó el cobro desde el navegador.
      for (let attempt = 0; attempt < STATUS_POLL_ATTEMPTS; attempt += 1) {
        try {
          const status = await getAiCreditPurchaseStatus(checkout.purchaseId);
          if (status.status === 'SUCCEEDED') {
            onSucceeded();
            return;
          }
          if (status.status === 'FAILED') {
            setError('El pago no se ha podido confirmar. Inténtalo de nuevo.');
            setIsConfirming(false);
            setIsPaying(false);
            return;
          }
        } catch {
          // Reintenta en el siguiente intento; un fallo de red puntual no debe cortar el sondeo.
        }
        await sleep(STATUS_POLL_DELAY_MS);
      }
      // Pasados los intentos, el pago está confirmado por Stripe pero el
      // webhook aún no ha llegado: se cierra igualmente, los créditos
      // aparecerán en cuanto se procese (nunca se pierde el cobro).
      onSucceeded();
      return;
    }
    setError('El pago no se ha completado. Inténtalo de nuevo.');
    setIsPaying(false);
  };

  return (
    <div className="space-y-4">
      <PaymentElement />
      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <DialogFooter className="justify-between sm:justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={onBack} disabled={isPaying}>
          Atrás
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!stripe || isPaying}
          loading={isPaying}
          loadingText={isConfirming ? 'Confirmando…' : 'Procesando…'}
          onClick={() => void handlePay()}
        >
          Pagar {formatEurCents(checkout.totalCents)}
        </Button>
      </DialogFooter>
    </div>
  );
}

export function AddCreditsModal({ open, onOpenChange, onCreditsPurchased }: AddCreditsModalProps) {
  const [pricing, setPricing] = useState<AiCreditsPricingInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
  const [customCredits, setCustomCredits] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [checkout, setCheckout] = useState<AiCreditsCheckoutResult | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    if (!open) return;
    // Cada apertura empieza de cero: no arrastrar la selección/pago de una compra anterior.
    setPricing(null);
    setLoadError(null);
    setSelectedCredits(null);
    setCustomCredits('');
    setIsCustom(false);
    setCheckout(null);
    setCheckoutError(null);
    setSucceeded(false);
    getAiCreditsPricing()
      .then(setPricing)
      .catch(() => setLoadError('No se han podido cargar los precios. Inténtalo de nuevo.'));
  }, [open]);

  const customValue = Number(customCredits);
  const customValid =
    customCredits.trim().length > 0 &&
    Number.isInteger(customValue) &&
    customValue >= MIN_CUSTOM_CREDITS &&
    customValue <= MAX_CREDITS;

  const creditsToBuy = isCustom ? (customValid ? customValue : null) : selectedCredits;

  const handleStartCheckout = async () => {
    if (!creditsToBuy || isStartingCheckout) return;
    setIsStartingCheckout(true);
    setCheckoutError(null);
    try {
      const result = await checkoutAiCredits(creditsToBuy);
      setCheckout(result);
    } catch (err) {
      setCheckoutError(
        err instanceof Error ? err.message : 'No se ha podido iniciar la compra. Inténtalo de nuevo.',
      );
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const handleSucceeded = () => {
    setSucceeded(true);
    onCreditsPurchased();
  };

  const stripeOptions = useMemo(
    () => (checkout ? { clientSecret: checkout.clientSecret } : undefined),
    [checkout],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-hoja-tinta" aria-hidden="true" />
            <DialogTitle>Añadir créditos</DialogTitle>
          </div>
          <DialogDescription>
            {succeeded
              ? 'Créditos añadidos a tu cuenta.'
              : 'Cada crédito te permite crear un producto más con el asistente de IA.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          {succeeded ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-origen-pradera/10 text-origen-bosque">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="text-sm text-origen-oscuro">
                Ya puedes seguir creando productos con el asistente de IA.
              </p>
              <Button type="button" variant="primary" size="sm" onClick={() => onOpenChange(false)}>
                Seguir creando
              </Button>
            </div>
          ) : loadError ? (
            <Alert variant="error">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          ) : !pricing ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-origen-bosque" aria-hidden="true" />
            </div>
          ) : checkout ? (
            <Elements stripe={getStripe()} options={stripeOptions}>
              <PaymentStep
                checkout={checkout}
                onSucceeded={handleSucceeded}
                onBack={() => setCheckout(null)}
              />
            </Elements>
          ) : (
            <>
              <div className="flex gap-2">
                {pricing.presets.map((quote) => (
                  <PresetCard
                    key={quote.credits}
                    quote={quote}
                    selected={!isCustom && selectedCredits === quote.credits}
                    onSelect={() => {
                      setIsCustom(false);
                      setSelectedCredits(quote.credits);
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setIsCustom(true);
                    setSelectedCredits(null);
                  }}
                  className={cn(
                    'relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-3 py-4 text-center transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
                    isCustom
                      ? 'border-origen-bosque bg-origen-pradera/5'
                      : 'border-border-subtle bg-surface-alt hover:border-origen-pradera/60',
                  )}
                >
                  {isCustom && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-origen-bosque text-white">
                      <Check className="h-3 w-3" aria-hidden="true" />
                    </span>
                  )}
                  <span className="text-sm font-semibold text-origen-bosque">Otros</span>
                  <span className="text-xs text-text-subtle">Elige la cantidad</span>
                </button>
              </div>

              {isCustom && (
                <Input
                  type="number"
                  inputMode="numeric"
                  min={MIN_CUSTOM_CREDITS}
                  max={MAX_CREDITS}
                  value={customCredits}
                  onChange={(e) => setCustomCredits(e.target.value)}
                  placeholder={`Entre ${MIN_CUSTOM_CREDITS} y ${MAX_CREDITS} créditos`}
                  error={
                    customCredits.trim().length > 0 && !customValid
                      ? `Indica un número entero entre ${MIN_CUSTOM_CREDITS} y ${MAX_CREDITS}.`
                      : undefined
                  }
                  helperText="A partir de 3 créditos tienes descuento, y desde 5, el máximo."
                />
              )}

              {pricing.purchasedCredits > 0 && (
                <p className="text-xs text-text-subtle">
                  Ya tienes {pricing.purchasedCredits} crédito{pricing.purchasedCredits === 1 ? '' : 's'} comprado
                  {pricing.purchasedCredits === 1 ? '' : 's'} disponible{pricing.purchasedCredits === 1 ? '' : 's'}.
                </p>
              )}

              {checkoutError && (
                <Alert variant="error">
                  <AlertDescription>{checkoutError}</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!creditsToBuy}
                  loading={isStartingCheckout}
                  onClick={() => void handleStartCheckout()}
                >
                  Continuar al pago
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
