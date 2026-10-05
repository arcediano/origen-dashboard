/**
 * @component TextImproverCard
 * @description Asistente de IA (F2): propone nombre y descripción a partir
 *              de lo que el productor ya ha
 *              escrito (más unas notas opcionales). La IA solo propone: nada se
 *              cambia hasta que el productor pulsa "Aplicar propuesta".
 *              Se oculta si el asistente no está disponible (apagado, sin clave
 *              o sin permiso).
 */

'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertTitle, AlertDescription, Button, Card, Textarea } from '@arcediano/ux-library';
import { PenLine, Sparkles } from 'lucide-react';
import { getAiAssistQuota, improveText } from '@/lib/api/ai-assist';
import type { AiAssistQuota } from '@/lib/ai-assist/label-proposal';
import {
  TEXT_FIELD_LABELS,
  buildTextDraft,
  hasDraftContent,
  overwrittenFields,
  type TextDraft,
  type TextImprovementResponse,
  type TextProposal,
} from '@/lib/ai-assist/text-proposal';

interface TextImproverCardProps {
  /** Clave de imputación del cupo: productId real (edición) o clave del borrador (creación). */
  assistKey: string | null;
  /** Lo que el productor ya ha escrito en el formulario. */
  current: TextDraft;
  /** Aplica la propuesta al formulario (solo tras confirmar el productor). */
  onApply: (proposal: TextProposal) => void;
  /** Avisa de que este producto ya ha consumido cupo (para el aviso al abandonar). */
  onUsed?: () => void;
  /** Edición de un producto existente: sin límite de cupo (solo aplica a la creación). */
  unlimited?: boolean;
}

export function TextImproverCard({
  assistKey,
  current,
  onApply,
  onUsed,
  unlimited = false,
}: TextImproverCardProps) {
  const [quota, setQuota] = useState<AiAssistQuota | null>(null);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<TextImprovementResponse | null>(null);

  useEffect(() => {
    if (!assistKey) return;
    let cancelled = false;
    getAiAssistQuota()
      .then((q) => !cancelled && setQuota(q))
      .catch(() => !cancelled && setQuota(null)); // sin permiso o servicio caído → se oculta
    return () => {
      cancelled = true;
    };
  }, [assistKey]);

  if (!assistKey || !quota?.enabled) return null;

  const draft = buildTextDraft({ ...current, notes });
  const canPropose = hasDraftContent(draft);

  const handlePropose = async () => {
    if (!canPropose || isLoading) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await improveText(assistKey, draft);
      onUsed?.();
      setQuota((q) => (q ? { ...q, used: result.quota.used, total: result.quota.total } : q));
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se ha podido generar la propuesta.');
    } finally {
      setIsLoading(false);
    }
  };

  const overwritten = overwrittenFields(current).map((k) => TEXT_FIELD_LABELS[k].toLowerCase());

  return (
    <Card variant="flat" className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 text-origen-bosque flex items-center justify-center shrink-0">
          <PenLine className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-origen-bosque">Redactar con IA</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escribe el nombre del producto (aunque sea provisional) y, si quieres, cuéntanos algo
            más. Te proponemos el nombre y las descripciones; tú decides si los aplicas.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {unlimited
              ? 'Al editar un producto que ya tienes guardado no hay límite de uso del asistente.'
              : `1 crédito = 1 producto. Puedes repetir en el mismo producto sin gastar más.`}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <Textarea
          aria-label="Notas para el asistente"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px]"
          placeholder="Notas opcionales: origen, cómo lo elaboras, qué lo hace especial… La IA solo usará lo que escribas."
          maxLength={2000}
          disabled={isLoading}
        />
      </div>

      <div className="mt-3">
        <Button
          type="button"
          variant="primary"
          leftIcon={<Sparkles className="w-4 h-4" aria-hidden="true" />}
          onClick={handlePropose}
          disabled={!canPropose}
          loading={isLoading}
          loadingText="Redactando…"
          className="min-h-[44px] w-full sm:w-auto"
        >
          {response ? 'Proponer de nuevo' : 'Proponer textos'}
        </Button>
        {!canPropose && (
          <p className="text-xs text-muted-foreground mt-2">
            Escribe primero el nombre del producto o unas notas.
          </p>
        )}
      </div>

      {error && (
        <Alert variant="error" className="mt-4">
          <AlertTitle>No se ha podido generar la propuesta</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {response && (
        <div className="mt-4 rounded-xl border border-border-subtle bg-white p-4 space-y-3">
          {(Object.keys(TEXT_FIELD_LABELS) as (keyof TextProposal)[]).map((key) => (
            <div key={key}>
              <p className="text-xs font-medium text-muted-foreground">{TEXT_FIELD_LABELS[key]}</p>
              <p className="text-sm text-foreground whitespace-pre-line break-words">
                {response.proposal[key]}
              </p>
            </div>
          ))}
          {response.notes && (
            <Alert variant="warning">
              <AlertDescription>{response.notes}</AlertDescription>
            </Alert>
          )}
          <p className="text-xs text-muted-foreground">
            Revisa el texto: la IA puede equivocarse y tú eres responsable de lo que publicas.
            {overwritten.length > 0 && ` Al aplicarla se sustituirá tu ${overwritten.join(', ')} actual.`}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="primary"
              className="min-h-[44px]"
              onClick={() => {
                onApply(response.proposal);
                setResponse(null);
              }}
            >
              Aplicar propuesta
            </Button>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px]"
              onClick={() => setResponse(null)}
            >
              Descartar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
