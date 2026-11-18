/**
 * @component AddCreditsModal
 * @description Compra de créditos del asistente de IA (petición del humano,
 * 2026-10-04): cuando el productor agota el cupo gratis, puede comprar más
 * con cobro REAL de tarjeta vía Stripe (Payment Element), igual que el modal
 * "Añadir créditos" de referencia — tarjetas de cantidad con descuento,
 * resumen del pedido y botón de pago. 1 crédito = 1,20 €; 10% de descuento
 * desde 5 créditos, 20% desde 10 (el backend es la autoridad de precio;
 * aquí solo se muestran los importes que él calcula, ver
 * ai-credits.pricing.ts). Cantidades fijas (1/5/10): sin cantidad libre
 * (petición del humano, 2026-10-04).
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
import { Check, Coins, CreditCard, Loader2, Sparkles } from 'lucide-react';
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
  checkoutAiCreditsWithSavedCard,
  getAiCreditCards,
  getAiCreditPurchaseStatus,
  getAiCreditsPricing,
  setAiCreditDefaultCard,
} from '@/lib/api/ai-assist';
import {
  cardBrandLabel,
  cardExpiry,
  formatEurCents,
  isCardExpired,
  type AiCreditPriceQuote,
  type AiCreditsCheckoutResult,
  type AiCreditsPricingInfo,
  type AiSavedCard,
  type AiSavedCardsInfo,
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

/** Ancho del panel en escritorio — el resto (recorte, alto máximo, scroll interno con cabecera/pie fijos) ya lo resuelve `DialogContent` desde `@arcediano/ux-library@0.29.1`. */
const DIALOG_CONTENT_CLASSNAME = 'sm:max-w-xl';
/** Espaciado/padding del contenido de cada paso — el scroll en sí (`overflow-y-auto`) ya lo aplica `DialogContent` al conjunto de sus hijos. */
const CONTENT_AREA_CLASSNAME = 'space-y-5 px-6 py-5';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * El webhook de Stripe es quien acredita los créditos: se consulta el estado hasta que llegue, en vez
 * de darlo por hecho solo porque Stripe confirmó el cobro. `TIMEOUT` = cobrado pero aún sin acreditar
 * (los créditos aparecerán en cuanto se procese; nunca se pierde el cobro).
 */
async function waitForPurchase(purchaseId: string): Promise<'SUCCEEDED' | 'FAILED' | 'TIMEOUT'> {
  for (let attempt = 0; attempt < STATUS_POLL_ATTEMPTS; attempt += 1) {
    try {
      const status = await getAiCreditPurchaseStatus(purchaseId);
      if (status.status === 'SUCCEEDED') return 'SUCCEEDED';
      if (status.status === 'FAILED') return 'FAILED';
    } catch {
      // Un fallo de red puntual no debe cortar el sondeo.
    }
    await sleep(STATUS_POLL_DELAY_MS);
  }
  return 'TIMEOUT';
}

/** Tarjeta guardada: «Visa •••• 4242 · caduca 08/30». */
function cardLabel(card: AiSavedCard): string {
  return `${cardBrandLabel(card.brand)} •••• ${card.last4}`;
}

/**
 * Pago de un clic: resumen de la tarjeta guardada con «Cambiar». El selector lista las tarjetas
 * guardadas y la opción de usar otra nueva. Nunca se muestra el número completo.
 */
function SavedCardPicker({
  cards,
  selectedId,
  disabled,
  onSelect,
  onUseNewCard,
}: {
  cards: AiSavedCardsInfo;
  selectedId: string | null;
  disabled: boolean;
  onSelect: (id: string) => void;
  onUseNewCard: () => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = cards.methods.find((m) => m.id === selectedId) ?? cards.methods[0];
  if (!selected) return null;
  const expired = isCardExpired(selected);
  return (
    <section
      aria-label="Método de pago"
      className="rounded-xl border border-border-subtle bg-surface-alt p-3"
      data-testid="saved-card"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-origen-pradera/10 text-origen-bosque">
          <CreditCard className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-origen-oscuro">{cardLabel(selected)}</p>
          <p className={cn('text-xs', expired ? 'text-feedback-danger-text' : 'text-text-subtle')}>
            {expired ? 'Caducada' : 'Caduca'} {cardExpiry(selected)}
          </p>
        </div>
        <div className="shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!w-auto"
            disabled={disabled}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            data-testid="change-card"
          >
            Cambiar
          </Button>
        </div>
      </div>
      {expired && (
        <p className="mt-2 text-xs text-feedback-danger-text" role="alert">
          Esta tarjeta ha caducado. Elige otra o usa una nueva.
        </p>
      )}
      {open && (
        <ul role="radiogroup" aria-label="Tarjetas guardadas" className="mt-3 space-y-1.5">
          {cards.methods.map((card) => {
            const checked = card.id === selected.id;
            return (
              <li key={card.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={checked}
                  onClick={() => {
                    onSelect(card.id);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm',
                    checked
                      ? 'border-origen-bosque bg-origen-pradera/5 text-origen-oscuro'
                      : 'border-border-subtle bg-surface text-origen-oscuro hover:border-origen-pradera/60',
                  )}
                >
                  <span>{cardLabel(card)}</span>
                  <span className="text-xs text-text-subtle">{cardExpiry(card)}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onUseNewCard();
              }}
              className="w-full rounded-lg border border-dashed border-border-subtle px-3 py-2 text-left text-sm font-medium text-hoja-tinta hover:border-origen-pradera/60"
              data-testid="use-new-card"
            >
              Usar otra tarjeta
            </button>
          </li>
        </ul>
      )}
    </section>
  );
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
      // La tarjeta nueva queda como predeterminada para que la próxima compra sea de un clic.
      if (typeof paymentIntent.payment_method === 'string') {
        void setAiCreditDefaultCard(paymentIntent.payment_method).catch(() => undefined);
      }
      const outcome = await waitForPurchase(checkout.purchaseId);
      if (outcome === 'FAILED') {
        setError('El pago no se ha podido confirmar. Inténtalo de nuevo.');
        setIsConfirming(false);
        setIsPaying(false);
        return;
      }
      onSucceeded();
      return;
    }
    setError('El pago no se ha completado. Inténtalo de nuevo.');
    setIsPaying(false);
  };

  return (
    <>
      <div className={CONTENT_AREA_CLASSNAME}>
        {/* Tarjeta + Stripe Link (petición del humano, 2026-11-09: pago más
            rápido, sin volver a introducir la tarjeta en compras
            siguientes) -- el PaymentIntent del backend ya admite `link`.
            Sin Apple/Google Pay. */}
        <PaymentElement options={{ wallets: { applePay: 'never', googlePay: 'never' } }} />
        <p className="text-xs text-text-subtle">
          Guardaremos tu tarjeta de forma segura en Stripe para que la próxima compra sea de un clic.
          Podrás cambiarla cuando quieras.
        </p>
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
  // Pago de un clic con la tarjeta guardada.
  const [cards, setCards] = useState<AiSavedCardsInfo | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [useNewCard, setUseNewCard] = useState(false);
  const [isPayingSaved, setIsPayingSaved] = useState(false);
  const [savedError, setSavedError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // Cada apertura empieza de cero: no arrastrar la selección/pago de una compra anterior.
    setPricing(null);
    setLoadError(null);
    setSelectedCredits(null);
    setCheckout(null);
    setCheckoutError(null);
    setSucceeded(false);
    setCards(null);
    setCardId(null);
    setUseNewCard(false);
    setSavedError(null);
    getAiCreditsPricing()
      .then(setPricing)
      .catch(() => setLoadError('No se han podido cargar los precios. Inténtalo de nuevo.'));
    // Sin tarjetas guardadas (o si falla la consulta) se paga con tarjeta nueva, como siempre.
    getAiCreditCards()
      .then((info) => {
        setCards(info);
        setCardId(info.defaultId);
      })
      .catch(() => setCards({ defaultId: null, methods: [] }));
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

  const savedCard = cards?.methods.find((m) => m.id === cardId) ?? cards?.methods[0] ?? null;
  const oneClick = !useNewCard && savedCard !== null;
  const selectedQuote = pricing?.presets.find((q) => q.credits === selectedCredits) ?? null;

  const handleSelectCard = (id: string) => {
    setCardId(id);
    setSavedError(null);
    // La elegida pasa a ser la predeterminada de las próximas compras (si falla no bloquea el pago).
    void setAiCreditDefaultCard(id).catch(() => undefined);
  };

  /** Pago de un clic: cobra la tarjeta guardada en el servidor; solo pide algo si el banco exige 3D Secure. */
  const handlePaySaved = async () => {
    if (!selectedCredits || !savedCard || isPayingSaved) return;
    setIsPayingSaved(true);
    setSavedError(null);
    try {
      const result = await checkoutAiCreditsWithSavedCard(selectedCredits, savedCard.id);
      if (result.status === 'requires_action' && result.clientSecret) {
        const stripe = await getStripe();
        if (!stripe) throw new Error('No se ha podido cargar el pago seguro. Inténtalo de nuevo.');
        const { error } = await stripe.handleNextAction({ clientSecret: result.clientSecret });
        if (error) {
          throw new Error(error.message ?? 'No se ha podido autenticar el pago con tu banco.');
        }
      } else if (result.status === 'succeeded') {
        handleSucceeded();
        return;
      }
      const outcome = await waitForPurchase(result.purchaseId);
      if (outcome === 'FAILED') {
        throw new Error('El pago no se ha podido confirmar. Prueba con otra tarjeta.');
      }
      handleSucceeded();
    } catch (err) {
      setSavedError(
        err instanceof Error ? err.message : 'No se ha podido procesar el pago. Inténtalo de nuevo.',
      );
    } finally {
      setIsPayingSaved(false);
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
              // Genérico (petición del humano, 2026-11-08): "1 crédito" ya no es
              // solo "1 producto más" -- este mismo modal se reutiliza también
              // para revisar el perfil comercial con IA.
              : 'Cada crédito te permite un uso más del asistente de IA.'}
          </DialogDescription>
        </DialogHeader>

        {succeeded ? (
          <div className={cn(CONTENT_AREA_CLASSNAME, 'flex flex-col items-center py-4 text-center')}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-origen-pradera/10 text-origen-bosque">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm text-origen-oscuro">
              Ya puedes seguir usando el asistente de IA.
            </p>
            <Button type="button" variant="primary" size="sm" onClick={() => onOpenChange(false)}>
              Continuar
            </Button>
          </div>
        ) : loadError ? (
          <div className={CONTENT_AREA_CLASSNAME}>
            <Alert variant="error">
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          </div>
        ) : !pricing ? (
          <div className={cn(CONTENT_AREA_CLASSNAME, 'flex items-center justify-center py-10')}>
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
            <div className={CONTENT_AREA_CLASSNAME}>
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

              {cards && oneClick && (
                <SavedCardPicker
                  cards={cards}
                  selectedId={savedCard?.id ?? null}
                  disabled={isPayingSaved}
                  onSelect={handleSelectCard}
                  onUseNewCard={() => {
                    setUseNewCard(true);
                    setSavedError(null);
                  }}
                />
              )}
              {cards && !oneClick && cards.methods.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUseNewCard(false)}
                  className="text-sm font-medium text-hoja-tinta underline underline-offset-2"
                >
                  Usar mi tarjeta guardada
                </button>
              )}

              {(oneClick ? savedError : checkoutError) && (
                <Alert variant="error">
                  <AlertDescription>{oneClick ? savedError : checkoutError}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              {oneClick ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  fullWidth
                  disabled={!selectedCredits || (savedCard !== null && isCardExpired(savedCard))}
                  loading={isPayingSaved}
                  loadingText="Procesando pago…"
                  onClick={() => void handlePaySaved()}
                  data-testid="pay-saved"
                >
                  {selectedQuote ? `Pagar ${formatEurCents(selectedQuote.totalCents)}` : 'Elige una cantidad'}
                </Button>
              ) : (
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
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
