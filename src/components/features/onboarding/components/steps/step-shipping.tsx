/**
 * @file step-shipping.tsx
 * @description Paso 3 del onboarding: envíos.
 *
 * Con el código postal de producción (paso 1) el backend dice si Origen cubre la
 * zona (`GET onboarding/shipping-coverage`). La UI se adapta:
 *   - COVERED: el productor elige entre delegar en Origen (recomendado) o gestionarlo él.
 *   - NOT_COVERED: solo puede gestionarlo él (se explica por qué).
 *   - MISSING_POSTAL_CODE: se le lleva a completar la ubicación.
 */

'use client';

import * as React from 'react';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Input,
  InputAffixField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectableCard,
} from '@arcediano/ux-library';
import {
  formatEstimatedDelivery,
  DELIVERY_TIME_UNIT_OPTIONS,
  type DeliveryTimeUnit,
} from '@/lib/format-estimated-delivery';
import { getShippingUiMode, reconcileDeliveryChoice } from '@/lib/onboarding/shipping';
import { isDeliveryOptionComplete } from '@/lib/onboarding/shipping';
import { nextLocalId } from '@/lib/onboarding/zones';
import type {
  DeliveryChoice,
  DeliveryOption,
  ShippingCoverage,
  ShippingData,
  ShippingZone,
} from '@/lib/onboarding/types';
import {
  Check,
  Clock,
  Compass,
  Euro,
  MapPin,
  Package,
  Pencil,
  Plus,
  Recycle,
  Route,
  Truck,
  X,
  Zap,
} from 'lucide-react';
import { FieldError, OptionalBadge } from '../FormBits';
import { StepSection } from '../StepSection';
import { ZoneEditor } from '../ZoneEditor';

export type { ShippingData as EnhancedShippingData };

export function pickDeliveryIcon(option: Pick<DeliveryOption, 'estimatedDaysValue' | 'estimatedDaysUnit'>) {
  if (option.estimatedDaysUnit === 'HOURS' || (option.estimatedDaysUnit === 'DAYS' && (option.estimatedDaysValue ?? 0) <= 1)) return Zap;
  return Truck;
}

export interface EnhancedStep3ShippingProps {
  data: ShippingData;
  onChange: (data: ShippingData) => void;
  coverage: ShippingCoverage | null;
  coverageLoading: boolean;
  coverageError: boolean;
  onRetryCoverage: () => void;
  /** Lleva al productor a otro paso (p. ej. al 1 si falta el código postal). */
  onGoToStep: (stepId: number) => void;
  /** Provincia de producción (paso 1), para el atajo de zonas. */
  homeProvince?: string;
  errors?: Record<string, string>;
}

export function EnhancedStep3Shipping({
  data,
  onChange,
  coverage,
  coverageLoading,
  coverageError,
  onRetryCoverage,
  onGoToStep,
  homeProvince,
  errors = {},
}: EnhancedStep3ShippingProps) {
  const [editingOption, setEditingOption] = React.useState<string | null>(null);
  const mode = getShippingUiMode(coverage, { loading: coverageLoading, error: coverageError });

  const update = (patch: Partial<ShippingData>) => onChange({ ...data, ...patch });

  // Sin cobertura solo es válido "own": se adapta una elección previa "delegated".
  React.useEffect(() => {
    const reconciled = reconcileDeliveryChoice(data.deliveryChoice, coverage);
    if (reconciled !== data.deliveryChoice) onChange({ ...data, deliveryChoice: reconciled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverage]);

  const choice = data.deliveryChoice;
  const showOptions = choice === 'own';

  const updateOption = (id: string, patch: Partial<DeliveryOption>) =>
    update({ deliveryOptions: data.deliveryOptions.map((o) => (o.id === id ? { ...o, ...patch } : o)) });

  const addOption = () => {
    const option: DeliveryOption = {
      id: nextLocalId('option'),
      name: '',
      description: '',
      price: 0,
      estimatedDaysValue: null,
      estimatedDaysUnit: 'DAYS',
    };
    update({ deliveryOptions: [...data.deliveryOptions, option] });
    setEditingOption(option.id);
  };

  const removeOption = (id: string) => {
    update({ deliveryOptions: data.deliveryOptions.filter((o) => o.id !== id) });
    if (editingOption === id) setEditingOption(null);
  };

  const minOrderError =
    data.minOrderAmount !== 0 && data.minOrderAmount <= 0 ? 'El pedido mínimo debe ser mayor que 0 €.' : undefined;

  const choose = (c: DeliveryChoice) => update({ deliveryChoice: c });

  return (
    <div className="space-y-4">
      {/* ── ¿Quién entrega? ─────────────────────────────────────────────── */}
      <StepSection
        icon={<Compass className="h-5 w-5" />}
        title="¿Quién entrega tus pedidos?"
        description={
          coverage?.postalCode
            ? `Lo hemos comprobado con el código postal de tu negocio (${coverage.postalCode}).`
            : 'Lo comprobamos con el código postal de tu negocio.'
        }
        id="onb-delivery-choice"
      >
        {mode === 'loading' && (
          <div className="space-y-3" role="status" aria-label="Comprobando cobertura de Origen">
            <div className="h-20 animate-pulse rounded-xl bg-origen-pastel/60" />
            <div className="h-20 animate-pulse rounded-xl bg-origen-pastel/60" />
          </div>
        )}

        {mode === 'error' && (
          <Alert variant="error">
            <p>No hemos podido comprobar si Origen cubre tu zona. Inténtalo de nuevo.</p>
            <Button type="button" size="sm" variant="outline" onClick={onRetryCoverage} className="mt-3">
              Reintentar
            </Button>
          </Alert>
        )}

        {mode === 'missing-location' && (
          <Alert variant="warning">
            <p>
              Completa primero la ubicación de tu negocio (paso 1): necesitamos tu código postal para saber si Origen puede recoger tus pedidos.
            </p>
            <Button type="button" size="sm" variant="outline" onClick={() => onGoToStep(1)} className="mt-3">
              Ir a ubicación
            </Button>
          </Alert>
        )}

        {mode === 'own-only' && coverage && (
          <div className="space-y-3">
            <Alert variant="info">
              <p className="font-medium">
                Origen aún no tiene cobertura en tu código postal{coverage.postalCode ? ` (${coverage.postalCode})` : ''}.
              </p>
              <p className="mt-1 text-sm">
                {coverage.reason ?? 'Tendrás que gestionar tú el envío de tus pedidos.'} Te avisaremos si ampliamos la cobertura.
              </p>
            </Alert>
            <SelectableCard
              layout="detailed"
              icon={<Package className="h-5 w-5" />}
              label="Lo gestiono yo"
              description="Defines tus métodos de envío, precios y zonas de entrega. Es la única opción disponible en tu zona."
              selected
              onSelect={() => choose('own')}
              className="w-full"
            />
          </div>
        )}

        {mode === 'choose' && coverage && (
          <div className="space-y-3" role="group" aria-label="Cómo gestionas el envío" id="onb-delivery-choice-options">
            <SelectableCard
              layout="detailed"
              icon={<Route className="h-5 w-5" />}
              label="Delegar en Origen (recomendado)"
              description="Origen recoge tus pedidos en tu negocio y se encarga de la entrega. Tú solo preparas el pedido: sin configurar tarifas ni repartos."
              selected={choice === 'delegated'}
              onSelect={() => choose('delegated')}
              className="w-full"
            />
            {choice === 'delegated' && coverage.pickupRoute && (
              <div className="rounded-xl border border-origen-pradera/30 bg-origen-crema/30 p-3 text-sm" data-testid="pickup-route">
                <p className="flex items-center gap-2 font-medium text-origen-bosque">
                  <Route className="h-4 w-4 text-hoja-tinta" aria-hidden="true" />
                  Ruta de recogida: {coverage.pickupRoute.name}
                </p>
                {coverage.pickupRoute.warehouseName && (
                  <p className="mt-0.5 pl-6 text-xs text-text-subtle">Almacén: {coverage.pickupRoute.warehouseName}</p>
                )}
              </div>
            )}
            <SelectableCard
              layout="detailed"
              icon={<Package className="h-5 w-5" />}
              label="Lo gestiono yo"
              description="Entregas tú mismo o con tu transportista: defines tus métodos de envío, precios y zonas."
              selected={choice === 'own'}
              onSelect={() => choose('own')}
              className="w-full"
            />
          </div>
        )}
        <FieldError>{errors['onb-delivery-choice']}</FieldError>
      </StepSection>

      {/* ── Métodos de envío (solo si los gestiona el productor) ─────────── */}
      {showOptions && (
        <StepSection
          icon={<Truck className="h-5 w-5" />}
          title="Tus métodos de envío"
          description="Precio y plazo de cada forma de entrega que ofreces."
          id="onb-delivery-options"
        >
          <div className="space-y-3">
            {data.deliveryOptions.map((option) => {
              const Icon = pickDeliveryIcon(option);
              const isEditing = editingOption === option.id;
              const incomplete = !isDeliveryOptionComplete(option);
              const idBase = `onb-opt-${option.id}`;
              return (
                <div key={option.id} className="rounded-xl border-2 border-border bg-surface-alt p-3 sm:p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-origen-pradera/10 text-hoja-tinta">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            id={`${idBase}-name`}
                            label="Nombre"
                            value={option.name}
                            onChange={(e) => updateOption(option.id, { name: e.target.value })}
                            placeholder="Ej.: Envío estándar"
                            maxLength={150}
                          />
                          <Input
                            id={`${idBase}-description`}
                            label="Descripción"
                            value={option.description}
                            onChange={(e) => updateOption(option.id, { description: e.target.value })}
                            placeholder="Ej.: Entrega en 2-3 días laborables"
                            maxLength={500}
                          />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <InputAffixField
                              id={`${idBase}-price`}
                              label="Precio"
                              type="number"
                              inputMode="decimal"
                              value={option.price > 0 ? option.price : ''}
                              onChange={(e) => updateOption(option.id, { price: parseFloat(e.target.value) || 0 })}
                              min={0}
                              step={0.5}
                              placeholder="0,00"
                              affixLeft="€"
                            />
                            <div className="flex items-end gap-2">
                              <Input
                                id={`${idBase}-time`}
                                label="Plazo estimado"
                                type="number"
                                inputMode="numeric"
                                value={option.estimatedDaysValue !== null ? option.estimatedDaysValue : ''}
                                onChange={(e) =>
                                  updateOption(option.id, {
                                    estimatedDaysValue: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value, 10) || 0),
                                  })
                                }
                                min={0}
                                step={1}
                                placeholder="2"
                                containerClassName="flex-1"
                              />
                              <Select
                                value={option.estimatedDaysUnit}
                                onValueChange={(v) => updateOption(option.id, { estimatedDaysUnit: v as DeliveryTimeUnit })}
                              >
                                <SelectTrigger className="flex-1" aria-label="Unidad del plazo estimado">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DELIVERY_TIME_UNIT_OPTIONS.map((u) => (
                                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {incomplete && (
                            <FieldError>Completa nombre, descripción, precio (mayor que 0 €) y plazo.</FieldError>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold text-origen-bosque">{option.name || 'Sin nombre'}</h3>
                              {option.estimatedDaysValue !== null && (
                                <Badge variant="leaf" size="sm" icon={<Clock className="h-3 w-3" />}>
                                  {formatEstimatedDelivery(option.estimatedDaysValue, option.estimatedDaysUnit)}
                                </Badge>
                              )}
                              {incomplete && <Badge variant="warning" size="xs">Incompleto</Badge>}
                            </div>
                            <span className="text-lg font-bold text-hoja-tinta">{option.price.toFixed(2)} €</span>
                          </div>
                          <p className="mt-1 text-sm text-text-subtle">{option.description}</p>
                        </>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={() => setEditingOption(isEditing ? null : option.id)}
                        aria-label={isEditing ? 'Confirmar cambios del método de envío' : `Editar el método de envío ${option.name}`}
                        className={`flex h-11 w-11 items-center justify-center rounded-xl transition-colors ${
                          isEditing ? 'bg-origen-bosque text-white hover:bg-origen-pino' : 'text-text-subtle hover:bg-surface hover:text-origen-bosque'
                        }`}
                      >
                        {isEditing ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOption(option.id)}
                        aria-label={`Eliminar el método de envío ${option.name}`}
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-text-subtle transition-colors hover:bg-feedback-danger-subtle hover:text-feedback-danger"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {data.deliveryOptions.length === 0 && (
            <p className="mb-3 rounded-xl border-2 border-dashed border-border bg-origen-crema/30 p-4 text-center text-sm text-text-subtle">
              Aún no has añadido ningún método de envío.
            </p>
          )}
          <Button
            type="button"
            variant="secondary"
            onClick={addOption}
            disabled={editingOption !== null}
            className="mt-3 w-full justify-center sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" /> Añadir método de envío
          </Button>
          <div className="mt-2"><FieldError>{errors['onb-delivery-options']}</FieldError></div>
        </StepSection>
      )}

      {/* ── Zonas de entrega ────────────────────────────────────────────── */}
      <StepSection
        icon={<MapPin className="h-5 w-5" />}
        title="Zonas de entrega"
        description={
          choice === 'delegated'
            ? 'Indica dónde se venden tus productos. La recogida y el reparto los organiza Origen.'
            : 'Indica a qué provincias o códigos postales llegas.'
        }
      >
        <ZoneEditor
          zones={data.includedZones}
          onAdd={(zones: ShippingZone[]) => update({ includedZones: [...data.includedZones, ...zones] })}
          onRemove={(id) => update({ includedZones: data.includedZones.filter((z) => z.id !== id) })}
          homeProvince={homeProvince}
          error={errors['onb-zone-value']}
        />
      </StepSection>

      {/* ── Pedido mínimo ───────────────────────────────────────────────── */}
      <StepSection
        icon={<Euro className="h-5 w-5" />}
        title="Pedido mínimo"
        description="Importe mínimo que debe alcanzar un pedido. Recomendado: 20–30 €."
      >
        <div className="max-w-xs">
          <InputAffixField
            id="onb-min-order"
            aria-label="Pedido mínimo"
            type="number"
            inputMode="decimal"
            value={data.minOrderAmount || ''}
            onChange={(e) => update({ minOrderAmount: parseFloat(e.target.value) || 0 })}
            min={1}
            step={5}
            affixLeft="€"
            placeholder="25"
            error={minOrderError ?? errors['onb-min-order']}
          />
        </div>
      </StepSection>

      {/* ── Packaging sostenible ────────────────────────────────────────── */}
      <StepSection
        icon={<Recycle className="h-5 w-5" />}
        title="Packaging sostenible"
        description="Se muestra en tu tienda. Los clientes valoran el embalaje ecológico."
        badge={<OptionalBadge>Recomendado</OptionalBadge>}
      >
        <div className="space-y-3">
          <label
            htmlFor="onb-sustainable"
            className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border-subtle bg-origen-crema/30 p-3"
          >
            <Checkbox
              id="onb-sustainable"
              checked={data.sustainablePackaging}
              onCheckedChange={(c) => update({ sustainablePackaging: c === true })}
              variant="seed"
            />
            <span className="text-sm font-medium text-origen-bosque">Uso packaging sostenible</span>
          </label>
          {data.sustainablePackaging && (
            <Input
              id="onb-packaging-description"
              label="Describe tu packaging"
              required
              value={data.packagingDescription}
              onChange={(e) => update({ packagingDescription: e.target.value })}
              placeholder="Cajas de cartón 100 % reciclado, papel kraft…"
              maxLength={1000}
              error={errors['onb-packaging-description']}
            />
          )}
        </div>
      </StepSection>
    </div>
  );
}

EnhancedStep3Shipping.displayName = 'EnhancedStep3Shipping';

export default EnhancedStep3Shipping;
