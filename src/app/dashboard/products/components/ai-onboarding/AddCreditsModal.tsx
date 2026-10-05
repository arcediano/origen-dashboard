/**
 * @component AddCreditsModal
 * @description Compra de créditos del asistente de IA (petición del humano,
 * 2026-10-04): cuando el productor agota el cupo gratis, puede comprar más
 * con cobro REAL de tarjeta vía Stripe (Payment Element), igual que el modal
 * "Añadir créditos" de referencia — tarjetas de cantidad con descuento,
 * resumen del pedido y botón de pago. 1 crédito = 1,80 €; 15% de descuento
 * desde 3 créditos, 30% desde 5 (el backend es la autoridad de precio; aquí
 * solo se muestran los importes que él calcula). Cantidades fijas (1/3/5):
 * sin cantidad libre (petición del humano, 2026-10-04).
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

/** Cuántas veces se consulta el estado tras confirmar el pago, antes de darlo por "en proceso". */
const STATUS_POLL_ATTEMPTS = 6;
const STATUS_POLL_DELAY_MS = 1500;

/**
 * `DialogContent` (ver `@arcediano/ux-library`) no recorta su propio
 * contenido en escritorio (`overflow` sin fijar) ni limita su alto —
 * `DialogHeader` queda con esquinas rectas por encima del `rounded-2xl` del
 * panel, y un contenido alto (el Payment Element de Stripe con sus campos)
 * puede no caber en pantalla sin forma de hacer scroll. Se corrige aquí,
 * igual que ya hace la propia librería en su variante móvil (panel con
 * `overflow-hidden` + `flex flex-col`, y un único hijo intermedio con
 * `overflow-y-auto` entre cabecera y pie, ambos fijos): cabecera y pie
 * quedan fijos, solo el contenido intermedio hace scroll.
 */
const DIALOG_CONTENT_CLASSNAME = 'flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-xl';
const SCROLL_AREA_CLASSNAME = 'min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-6 py-5';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Tarjeta de cantidad (1 / 3 / 5 créditos), con el precio ya calculado por el backend. */
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
        'relative flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-4 text-center transition-colors',
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
    <>
      <div className={SCROLL_AREA_CLASSNAME}>
        {/* Solo tarjeta: el PaymentIntent del backend admite únicamente `card`; sin Link ni guardar datos para pagos rápidos. */}
        <PaymentElement options={{ wallets: { applePay: 'never', googlePay: 'never', link: 'never' } }} />
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
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
    </>
  );
}

export interface AddCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tras acreditar los créditos (webhook confirmado): refresca el cupo del productor. */
  onCreditsPurchased: () => void;
}

export function AddCreditsModal({ open, onOpenChange, onCreditsPurchased }: AddCreditsModalProps) {
  const [pricing, setPricing] = useState<AiCreditsPricingInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCredits, setSelectedCredits] = useState<number | null>(null);
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
    setCheckout(null);
    setCheckoutError(null);
    setSucceeded(false);
    getAiCreditsPricing()
      .then(setPricing)
      .catch(() => setLoadError('No se han podido cargar los precios. Inténtalo de nuevo.'));
  }, [open]);

  const handleStartCheckout = async () => {
    if (!selectedCredits || isStartingCheckout) return;
    setIsStartingCheckout(true);
    setCheckoutError(null);
    try {
      const result = await checkoutAiCredits(selectedCredits);
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
      <DialogContent className={DIALOG_CONTENT_CLASSNAME}>
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

        {succeeded ? (
          <div className={cn(SCROLL_AREA_CLASSNAME, 'flex flex-col items-center py-4 text-center')}>
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
          <div className={SCROLL_AREA_CLASSNAME}>
            <Alert variant="error">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          </div>
        ) : !pricing ? (
          <div className={cn(SCROLL_AREA_CLASSNAME, 'flex items-center justify-center py-10')}>
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
            <div className={SCROLL_AREA_CLASSNAME}>
              <div className="grid grid-cols-3 gap-2">
                {pricing.presets.map((quote) => (
                  <PresetCard
                    key={quote.credits}
                    quote={quote}
                    selected={selectedCredits === quote.credits}
                    onSelect={() => setSelectedCredits(quote.credits)}
                  />
                ))}
              </div>

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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="primary"
                size="sm"
                fullWidth
                disabled={!selectedCredits}
                loading={isStartingCheckout}
                onClick={() => void handleStartCheckout()}
              >
                Continuar al pago
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
