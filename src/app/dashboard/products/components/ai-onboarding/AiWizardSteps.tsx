/**
 * @component AiWizardSteps
 * @description Pantallas del formulario guiado de Origen Assist: cada paso
 * hace una pregunta bien definida, con un ejemplo y una aclaración sobre qué
 * hará la IA con la respuesta.
 */
'use client';

import type { ReactNode } from 'react';
import {
  Camera,
  CheckCircle2,
  ClipboardList,
  Coins,
  FileText,
  Info,
  PenLine,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Input, Label, Textarea } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import {
  ASSISTED_CERTIFICATIONS,
  MAX_ANSWER_LENGTH,
  MAX_NAME_LENGTH,
  MIN_PRODUCT_DESCRIPTION,
  WIZARD_STEP_LABELS,
  type AssistedCertification,
  type AssistedTextState,
  type WizardStepId,
} from '@/lib/ai-assist/assisted-product';
import { NET_CONTENT_UNIT_LABELS } from '@/types/product';
import { NetContentField } from '../steps/NetContentField';
import { AiPhotoField } from './AiPhotoField';
import type { PhotoKey, PickedPhoto } from './useAssistedProductForm';

// ─── Piezas comunes ───────────────────────────────────────────────────────────

export function StepFrame({
  title,
  question,
  children,
}: {
  title: string;
  question: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-origen-bosque sm:text-xl">{title}</h2>
        <p className="text-sm text-text-subtle sm:text-base">{question}</p>
      </header>
      {children}
    </div>
  );
}

/** Aclaración sobre qué hará la IA con lo que el usuario escriba o suba. */
export function Disclaimer({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <div
      role="note"
      className={cn(
        'flex gap-2.5 rounded-xl border p-3 text-xs leading-5 sm:text-sm',
        tone === 'info'
          ? 'border-origen-pradera/30 bg-origen-pradera/10 text-origen-oscuro'
          : 'border-origen-mandarina/40 bg-origen-mandarina/10 text-origen-oscuro',
      )}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-origen-bosque" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function TextAnswer({
  id,
  label,
  value,
  onChange,
  placeholder,
  example,
  rows = 5,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  example: string;
  rows?: number;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_ANSWER_LENGTH}
        rows={rows}
        className="min-h-[120px] resize-y bg-white text-sm leading-6"
      />
      <div className="flex flex-wrap items-start justify-between gap-2 text-xs text-text-subtle">
        <p className="min-w-0 flex-1">
          <span className="font-medium text-origen-bosque">Ejemplo:</span> {example}
        </p>
        <span aria-hidden="true">
          {value.length}/{MAX_ANSWER_LENGTH}
        </span>
      </div>
    </div>
  );
}

// ─── 0 · Introducción ─────────────────────────────────────────────────────────

export function IntroStep({ remainingCredits }: { remainingCredits: number | null }) {
  const items = [
    { icon: ClipboardList, text: 'Te haremos unas preguntas sencillas, paso a paso. Responde con frases simples, como hablarías con un cliente.' },
    { icon: Camera, text: 'Si subes fotos de las etiquetas, la IA lee ingredientes, alérgenos y tabla nutricional por ti.' },
    { icon: Sparkles, text: 'La IA redacta la descripción, la historia y la elaboración con un tono comercial y cuidado, ampliando tus frases.' },
    { icon: FileText, text: 'Crearemos tu producto como borrador: tú lo revisas, lo ajustas y decides cuándo publicarlo.' },
  ];
  return (
    <StepFrame
      title="Crea tu producto con ayuda de la IA"
      question="Son unos 5 minutos. Tú cuentas lo básico y Origen Assist se encarga de que la ficha quede profesional."
    >
      <ul className="space-y-3">
        {items.map(({ icon: Icon, text }) => (
          <li key={text} className="flex gap-3 rounded-2xl border border-border-subtle bg-white p-3 shadow-sm">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-origen-pastel text-origen-bosque">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm leading-6 text-origen-oscuro">{text}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-3">
        <Disclaimer>
          <p className="flex items-center gap-1.5 font-semibold">
            <Coins className="h-4 w-4" aria-hidden="true" /> 1 crédito = 1 producto
          </p>
          <p>
            {remainingCredits !== null && <>Ahora te quedan {remainingCredits}. </>}
            El crédito solo se descuenta cuando tu ficha se crea correctamente; si algo falla, no se cobra nada.
          </p>
        </Disclaimer>
        <Disclaimer>
          <p className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" /> La IA solo usa lo que tú le cuentas
          </p>
          <p>
            Mejora la redacción, pero no inventa datos (premios, años, ingredientes…). Revisa siempre el resultado antes
            de publicar.
          </p>
        </Disclaimer>
      </div>
    </StepFrame>
  );
}

// ─── 1 · Foto y nombre ────────────────────────────────────────────────────────

export function PhotoStep({
  photo,
  name,
  recoveredAnswers,
  onPick,
  onRemove,
  onName,
}: {
  photo?: PickedPhoto;
  name: string;
  recoveredAnswers: boolean;
  onPick: (file: File) => string | null;
  onRemove: () => void;
  onName: (value: string) => void;
}) {
  return (
    <StepFrame title="Foto y nombre" question="Empecemos por lo que se ve: la foto principal de tu producto.">
      {recoveredAnswers && !photo && (
        <Disclaimer tone="warning">
          Hemos recuperado tus respuestas anteriores. Por seguridad las fotos no se guardan: vuelve a subirlas.
        </Disclaimer>
      )}
      <AiPhotoField
        label="Foto del producto"
        hint="Con buena luz y en la que se vea bien el envase, la marca y el nombre. Si lo deseas, podrás mejorarla con fondo blanco al final."
        photo={photo}
        required
        testId="photo-product"
        onPick={onPick}
        onRemove={onRemove}
      />
      <div className="space-y-2">
        <Label htmlFor="ai-name">Nombre del producto (opcional)</Label>
        <Input
          id="ai-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={MAX_NAME_LENGTH}
          placeholder="Ej: Queso curado de oveja El Pastor"
          inputSize="lg"
        />
        <p className="text-xs text-text-subtle">
          Si lo dejas vacío, la IA lo leerá de la foto. Si lo escribes, lo respetaremos tal cual.
        </p>
      </div>
    </StepFrame>
  );
}

// ─── 2-4 · Preguntas de texto ─────────────────────────────────────────────────

export function ProductStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <StepFrame title="Tu producto" question="¿Qué es y cómo es? Cuéntalo con tus palabras.">
      <TextAnswer
        id="ai-product-description"
        label="Describe tu producto"
        value={value}
        onChange={onChange}
        placeholder="Qué es, cómo sabe, qué textura tiene, para qué se usa…"
        example="Queso curado de oveja, sabor intenso y textura cremosa. Va muy bien con vino tinto."
      />
      <p className="text-xs text-text-subtle">Mínimo {MIN_PRODUCT_DESCRIPTION} caracteres. Con una o dos frases basta.</p>
      <Disclaimer>
        La IA convertirá tus frases en una descripción comercial y cuidada, sin añadir datos que no hayas contado.
      </Disclaimer>
    </StepFrame>
  );
}

export function OriginStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <StepFrame title="Origen" question="¿De dónde viene y quién lo hace?">
      <TextAnswer
        id="ai-origin"
        label="Origen e historia"
        value={value}
        onChange={onChange}
        placeholder="Zona, materia prima, tu historia o la de tu familia…"
        example="Lo hacemos en la Sierra de Gredos con leche de nuestras ovejas. Mi familia lo elabora desde hace tres generaciones."
      />
      <Disclaimer>
        Tu comunidad autónoma y municipio se rellenan solos con los datos de tu perfil. Aquí cuéntanos la historia: la IA
        redactará la sección de origen <strong>solo con lo que escribas</strong>. Si lo dejas en blanco, no se creará.
      </Disclaimer>
    </StepFrame>
  );
}

export function ProductionStep({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <StepFrame title="Elaboración" question="¿Cómo lo elaboras?">
      <TextAnswer
        id="ai-production"
        label="Proceso de elaboración"
        value={value}
        onChange={onChange}
        placeholder="Método, tiempos, cuidados, cómo lo envasas…"
        example="Leche cruda, cuajado natural y maduración de 6 meses en cueva. Todo se hace a mano."
      />
      <Disclaimer>
        La IA describirá el proceso con un tono artesano y elegante, <strong>sin inventar pasos ni tiempos</strong>. Si
        lo dejas en blanco, la ficha no incluirá esta sección.
      </Disclaimer>
    </StepFrame>
  );
}

// ─── 5 · Etiquetas ────────────────────────────────────────────────────────────

export function LabelsStep({
  photos,
  onPick,
  onRemove,
}: {
  photos: Partial<Record<PhotoKey, PickedPhoto>>;
  onPick: (key: PhotoKey, file: File) => string | null;
  onRemove: (key: PhotoKey) => void;
}) {
  return (
    <StepFrame
      title="Etiquetas"
      question="Si tienes las etiquetas a mano, súbelas y la IA leerá los datos por ti. Todo es opcional."
    >
      <AiPhotoField
        label="Tabla nutricional"
        hint="Foto de frente, sin reflejos y con el texto bien legible."
        photo={photos.nutrition}
        testId="photo-nutrition"
        onPick={(file) => onPick('nutrition', file)}
        onRemove={() => onRemove('nutrition')}
      />
      <AiPhotoField
        label="Ingredientes y alérgenos"
        hint="La lista de ingredientes y los alérgenos marcados en el envase."
        photo={photos.ingredients}
        testId="photo-ingredients"
        onPick={(file) => onPick('ingredients', file)}
        onRemove={() => onRemove('ingredients')}
      />
      <AiPhotoField
        label="Conservación"
        hint="Instrucciones de conservación y fecha de caducidad o consumo preferente."
        photo={photos.conservation}
        testId="photo-conservation"
        onPick={(file) => onPick('conservation', file)}
        onRemove={() => onRemove('conservation')}
      />
      <Disclaimer>
        La IA <strong>transcribe lo que se lee</strong> en la foto, no lo calcula ni lo estima. Lo que no suba o no se
        lea con seguridad quedará vacío y podrás completarlo después en la ficha.
      </Disclaimer>
      {!photos.nutrition && (
        <Disclaimer>
          <p className="font-semibold">Sin foto de la tabla nutricional</p>
          <p>
            Buscaremos valores <strong>orientativos por 100 g</strong> de un alimento equivalente en la base de datos
            pública de USDA (EE. UU.). Son aproximados, no los de tu producto: revísalos en la ficha antes de publicar o
            sube la foto de la tabla para usar tus datos reales.
          </p>
        </Disclaimer>
      )}
    </StepFrame>
  );
}

// ─── 6 · Detalles de venta ────────────────────────────────────────────────────

export function DetailsStep({
  state,
  onChange,
}: {
  state: AssistedTextState;
  onChange: <K extends keyof AssistedTextState>(key: K, value: AssistedTextState[K]) => void;
}) {
  const toggle = (certification: AssistedCertification) =>
    onChange(
      'certifications',
      state.certifications.includes(certification)
        ? state.certifications.filter((c) => c !== certification)
        : [...state.certifications, certification],
    );

  return (
    <StepFrame title="Detalles de venta" question="Certificados, formato de venta y algo más que quieras contar.">
      <div className="space-y-2">
        <p className="text-sm font-semibold text-origen-bosque">¿Tiene algún certificado o característica?</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Certificados y características">
          {ASSISTED_CERTIFICATIONS.map((certification) => {
            const active = state.certifications.includes(certification);
            return (
              <button
                key={certification}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(certification)}
                className={cn(
                  'rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera',
                  active
                    ? 'border-origen-pradera bg-origen-pradera/10 text-origen-bosque'
                    : 'border-border-subtle bg-surface-alt text-text-subtle hover:border-origen-pradera/60',
                )}
              >
                {active && <CheckCircle2 className="mr-1.5 inline h-4 w-4" aria-hidden="true" />}
                {certification}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-text-subtle">Si no tiene ninguno, déjalo sin marcar.</p>
      </div>

      <NetContentField
        netContent={state.netContent}
        netContentUnit={state.netContentUnit}
        onChange={(field, value) =>
          field === 'netContent'
            ? onChange('netContent', value as number | undefined)
            : onChange('netContentUnit', value as AssistedTextState['netContentUnit'])
        }
      />

      <TextAnswer
        id="ai-extra"
        label="¿Algo más que quieras contar? (opcional)"
        value={state.extraInfo}
        onChange={(value) => onChange('extraInfo', value)}
        placeholder="Premios, forma de consumirlo, maridajes, un detalle especial…"
        example="Medalla de plata en un concurso regional en 2023. Ideal para tabla de quesos."
        rows={4}
      />
      <Disclaimer>
        Solo incluiremos premios, cifras o fechas si los escribes tú aquí.
      </Disclaimer>
    </StepFrame>
  );
}

// ─── 7 · Resumen ──────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  step,
  onEdit,
  children,
}: {
  label: string;
  step: WizardStepId;
  onEdit: (step: WizardStepId) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-border-subtle bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-origen-bosque/70">{label}</p>
        <div className="mt-1 break-words text-sm text-origen-oscuro">{children}</div>
      </div>
      <button
        type="button"
        onClick={() => onEdit(step)}
        aria-label={`Editar ${WIZARD_STEP_LABELS[step].toLowerCase()}`}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-origen-bosque hover:bg-origen-pastel/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera"
      >
        <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
        Editar
      </button>
    </div>
  );
}

const clip = (value: string, max = 140) => (value.length > max ? `${value.slice(0, max).trimEnd()}…` : value);
const EMPTY = <span className="text-text-subtle">Sin rellenar</span>;

export function ReviewStep({
  state,
  photos,
  remainingCredits,
  onEdit,
  onImprovePhoto,
}: {
  state: AssistedTextState;
  photos: Partial<Record<PhotoKey, PickedPhoto>>;
  remainingCredits: number | null;
  onEdit: (step: WizardStepId) => void;
  onImprovePhoto: (value: boolean) => void;
}) {
  const labelPhotos = [
    photos.nutrition && 'tabla nutricional',
    photos.ingredients && 'ingredientes',
    photos.conservation && 'conservación',
  ].filter(Boolean) as string[];

  return (
    <StepFrame title="Resumen" question="Revisa lo que le vas a dar a la IA. Podrás ajustar el resultado en la ficha.">
      <div className="space-y-2.5">
        <SummaryRow label="Foto y nombre" step="photo" onEdit={onEdit}>
          <div className="flex items-center gap-3">
            {photos.product && (
              <img src={photos.product.previewUrl} alt="Foto del producto" className="h-12 w-12 rounded-lg object-cover" />
            )}
            <span>{state.name.trim() || 'La IA lo leerá de la foto'}</span>
          </div>
        </SummaryRow>
        <SummaryRow label="Tu producto" step="product" onEdit={onEdit}>
          {clip(state.productDescription) || EMPTY}
        </SummaryRow>
        <SummaryRow label="Origen" step="origin" onEdit={onEdit}>
          {clip(state.originStory) || EMPTY}
        </SummaryRow>
        <SummaryRow label="Elaboración" step="production" onEdit={onEdit}>
          {clip(state.productionProcess) || EMPTY}
        </SummaryRow>
        <SummaryRow label="Etiquetas" step="labels" onEdit={onEdit}>
          {labelPhotos.length ? labelPhotos.join(', ') : EMPTY}
          {!photos.nutrition && (
            <p className="mt-1 text-xs text-text-subtle">
              Sin tabla nutricional: se usarán valores orientativos de USDA (a revisar).
            </p>
          )}
        </SummaryRow>
        <SummaryRow label="Detalles de venta" step="details" onEdit={onEdit}>
          <p>
            {state.certifications.length ? state.certifications.join(', ') : 'Sin certificados'}
            {' · '}
            {state.netContent
              ? `${state.netContent} ${NET_CONTENT_UNIT_LABELS[state.netContentUnit ?? 'g']}`
              : 'Formato sin indicar'}
          </p>
          {state.extraInfo.trim() && <p className="mt-1 text-text-subtle">{clip(state.extraInfo, 100)}</p>}
        </SummaryRow>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border-subtle bg-surface-alt/60 p-3">
        <input
          type="checkbox"
          checked={state.improvePhoto}
          onChange={(e) => onImprovePhoto(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-origen-pradera"
        />
        <span className="text-sm">
          <span className="font-semibold text-origen-bosque">Mejorar mi foto con IA (fondo blanco)</span>
          <span className="mt-0.5 block text-xs text-text-subtle">
            Recortamos tu foto sobre un fondo blanco y en formato cuadrado, al estilo catálogo. No verás una vista previa:
            podrás cambiar la imagen después en la ficha.
          </span>
        </span>
      </label>

      <Disclaimer>
        <p className="font-semibold">Al pulsar «Crear mi producto con IA»</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          <li>Se usará 1 crédito{remainingCredits !== null ? ` (te quedan ${remainingCredits})` : ''}, solo si la ficha se crea.</li>
          <li>Se creará un borrador: no se publica nada hasta que tú lo decidas.</li>
          <li>Tarda entre 30 y 90 segundos. No cierres esta página.</li>
        </ul>
      </Disclaimer>
    </StepFrame>
  );
}
