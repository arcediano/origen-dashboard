/**
 * @file step-location.tsx
 * @description Paso 1 del onboarding: ubicación e identidad legal.
 * Pide lo que necesitamos para verificar la cuenta, facturar y, con el código
 * postal de producción, decidir en el paso 3 si Origen puede recoger los pedidos.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Alert, CheckboxWithLabel, Input, InputAffixField } from '@arcediano/ux-library';
import { FileUpload } from '@/components/shared';
import { CategoryCard } from '@/components/shared';
import { IMAGE_QUALITY_PRESETS, getImageQualityHint } from '@/lib/validations/image-quality';
import { validateSpanishTaxId, type TaxIdType } from '@/lib/utils/tax-id';
import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { getProvinciaFromCP } from '@/constants/cp-provincias';
import { ENTITY_TYPE_LABELS, type EntityType, type LocationData } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';
import { Building2, Camera, ChevronDown, FileText, Home, Info, Store } from 'lucide-react';
import { FieldError, OptionalBadge, SelectField } from '../FormBits';
import { StepSection } from '../StepSection';

export type { LocationData as EnhancedLocationData, EntityType };

export interface EnhancedStep1LocationProps {
  data: LocationData;
  onChange: (data: LocationData) => void;
  /** Nombre del negocio (viene del registro; solo lectura). */
  businessName?: string;
  /** Errores de validación por `id` de campo (se muestran tras intentar continuar). */
  errors?: Record<string, string>;
}

const ENTITY_OPTIONS = (Object.entries(ENTITY_TYPE_LABELS) as [EntityType, string][]).map(([value, label]) => ({
  value,
  label,
}));

const capitalizeWords = (str: string) =>
  str.trim().toLowerCase().replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());

export function EnhancedStep1Location({ data, onChange, businessName, errors = {} }: EnhancedStep1LocationProps) {
  const billingSame = data.billingAddressSameAsProduction ?? true;
  const [photosExpanded, setPhotosExpanded] = React.useState((data.locationImages?.length ?? 0) > 0);
  const [phoneTouched, setPhoneTouched] = React.useState(false);
  const [taxIdTouched, setTaxIdTouched] = React.useState(false);

  const update = (patch: Partial<LocationData>) => onChange({ ...data, billingAddressSameAsProduction: billingSame, ...patch });
  const updateBilling = (patch: Partial<NonNullable<LocationData['billingAddress']>>) =>
    update({
      billingAddress: {
        street: '', streetNumber: '', city: '', province: '', postalCode: '',
        ...data.billingAddress,
        ...patch,
      },
    });

  const cpError = React.useMemo(() => {
    const cp = data.postalCode || '';
    if (cp.length < 5) return undefined;
    const expected = getProvinciaFromCP(cp);
    if (expected === null) return 'No reconocemos este código postal.';
    return undefined;
  }, [data.postalCode]);

  const phoneError =
    data.businessPhone && !/^[6789]\d{8}$/.test(data.businessPhone)
      ? 'Introduce un teléfono español válido (9 dígitos, empieza por 6, 7, 8 o 9).'
      : undefined;

  const taxIdValidation = React.useMemo(
    () => (data.taxId ? validateSpanishTaxId(data.taxId) : { valid: false as const }),
    [data.taxId],
  );
  const taxIdLocalError = taxIdTouched && data.taxId && !taxIdValidation.valid
    ? ('error' in taxIdValidation && taxIdValidation.error) || 'Introduce un NIF, NIE o CIF válido.'
    : undefined;
  const taxIdBadge: Record<TaxIdType, string> = { NIF: 'NIF', NIE: 'NIE', CIF: 'CIF' };

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    const expected = value.length === 5 ? getProvinciaFromCP(value) : null;
    update({ postalCode: value, ...(expected !== null ? { province: expected } : value.length < 5 ? { province: '' } : {}) });
  };

  const handleCategorySelect = (categoryId: string) => {
    const isSelected = data.categories.includes(categoryId);
    update({
      categories: isSelected ? data.categories.filter((id) => id !== categoryId) : [...data.categories, categoryId],
    });
  };

  const nameTooShort = (businessName ?? '').trim().length < 3;

  return (
    <div className="space-y-4">
      {/* ── Identidad legal ─────────────────────────────────────────────── */}
      <StepSection
        icon={<Building2 className="h-5 w-5" />}
        title="Identidad legal"
        description="Necesario para verificar tu cuenta y emitir facturas."
      >
        <div className="space-y-4">
          {nameTooShort ? (
            <Alert variant="warning">
              Falta el nombre de tu negocio (mínimo 3 caracteres). Podrás completarlo en{' '}
              <Link href="/dashboard/profile/business" className="font-medium underline underline-offset-2">
                Perfil comercial
              </Link>
              ; es obligatorio para publicar.
            </Alert>
          ) : (
            <div className="rounded-xl border border-border-subtle bg-origen-crema/30 px-3 py-2.5">
              <p className="text-xs text-text-subtle">Nombre de tu negocio</p>
              <p className="text-sm font-semibold text-origen-bosque" data-testid="onb-business-name">{businessName}</p>
              <p className="mt-0.5 text-xs text-text-subtle">Viene de tu registro. Puedes cambiarlo en Perfil comercial.</p>
            </div>
          )}

          <SelectField
            id="onb-entity-type"
            label="Forma jurídica"
            required
            value={data.entityType ?? ''}
            onValueChange={(v) => update({ entityType: v as EntityType })}
            options={ENTITY_OPTIONS}
            placeholder="Selecciona tu forma jurídica"
            error={errors['onb-entity-type']}
          />

          {data.entityType && data.entityType !== 'autonomo' && (
            <Input
              id="onb-legal-rep"
              label="Representante legal"
              value={data.legalRepresentativeName || ''}
              onChange={(e) => update({ legalRepresentativeName: e.target.value })}
              placeholder="Nombre y apellidos"
              helperText="Opcional. Persona con poderes de representación de la entidad."
            />
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Input
                id="onb-tax-id"
                label="NIF / CIF / NIE"
                required
                value={data.taxId || ''}
                onChange={(e) => update({ taxId: e.target.value.toUpperCase().replace(/[\s-]/g, '') })}
                onBlur={() => setTaxIdTouched(true)}
                placeholder="12345678A"
                className="font-mono uppercase"
                maxLength={9}
                error={taxIdLocalError ?? errors['onb-tax-id']}
                helperText={
                  taxIdValidation.valid && 'type' in taxIdValidation && taxIdValidation.type
                    ? `${taxIdBadge[taxIdValidation.type]} válido`
                    : 'NIF, NIE o CIF'
                }
              />
            </div>
            <InputAffixField
              id="onb-phone"
              label="Teléfono del negocio"
              required
              value={data.businessPhone || ''}
              onChange={(e) => update({ businessPhone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
              onBlur={() => setPhoneTouched(true)}
              placeholder="600 000 000"
              inputMode="tel"
              affixLeft="+34"
              error={(phoneTouched ? phoneError : undefined) ?? errors['onb-phone']}
              helperText="Solo lo usa Origen, no es público."
            />
          </div>
        </div>
      </StepSection>

      {/* ── Dirección de producción ─────────────────────────────────────── */}
      <StepSection
        icon={<Home className="h-5 w-5" />}
        title="Dirección de producción"
        description="Desde aquí se recogen tus pedidos."
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2 rounded-lg border border-origen-pradera/20 bg-origen-crema/40 p-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-hoja-tinta" aria-hidden="true" />
            <p className="text-xs text-text-subtle">
              Con tu código postal comprobaremos en el paso de envíos si Origen puede recoger tus pedidos o si los gestionas tú.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              id="onb-postal-code"
              label="Código postal"
              required
              value={data.postalCode || ''}
              onChange={handlePostalCodeChange}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={5}
              className="font-mono"
              error={cpError ?? errors['onb-postal-code']}
            />
            <Input
              id="onb-province"
              label="Provincia"
              value={data.province || ''}
              readOnly
              tabIndex={-1}
              placeholder="Se rellena con el código postal"
              className="bg-surface text-text-subtle"
            />
            <Input
              id="onb-city"
              label="Ciudad / municipio"
              required
              value={data.city || ''}
              onChange={(e) => update({ city: e.target.value })}
              onBlur={() => data.city && update({ city: capitalizeWords(data.city) })}
              autoComplete="address-level2"
              error={errors['onb-city']}
            />
          </div>

          <Input
            id="onb-street"
            label="Nombre de la vía"
            required
            value={data.street || ''}
            onChange={(e) => update({ street: e.target.value })}
            onBlur={() => data.street && update({ street: capitalizeWords(data.street) })}
            placeholder="Calle Mayor, Av. de la Constitución"
            autoComplete="address-line1"
            error={errors['onb-street']}
          />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Input
              id="onb-street-number"
              label="Número"
              required
              value={data.streetNumber || ''}
              onChange={(e) => update({ streetNumber: e.target.value })}
              className="font-mono"
              error={errors['onb-street-number']}
            />
            <div className="sm:col-span-2">
              <Input
                id="onb-street-complement"
                label="Piso / puerta"
                value={data.streetComplement || ''}
                onChange={(e) => update({ streetComplement: e.target.value })}
                placeholder="3º A, Bajo"
                helperText="Opcional."
              />
            </div>
          </div>
        </div>
      </StepSection>

      {/* ── Dirección de facturación ────────────────────────────────────── */}
      <StepSection
        icon={<FileText className="h-5 w-5" />}
        title="Dirección de facturación"
        description="Aparece en tus facturas."
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-border-subtle bg-origen-crema/30 p-3">
            <CheckboxWithLabel
              id="onb-billing-same"
              label="Es la misma que la dirección de producción"
              checked={billingSame}
              onCheckedChange={(same) => {
                const isSame = same === true;
                onChange({ ...data, billingAddressSameAsProduction: isSame, billingAddress: isSame ? undefined : data.billingAddress });
              }}
              variant="seed"
            />
          </div>

          {!billingSame && (
            <div className="space-y-3">
              <Input
                id="onb-billing-street"
                label="Nombre de la vía"
                required
                value={data.billingAddress?.street || ''}
                onChange={(e) => updateBilling({ street: e.target.value })}
                placeholder="Calle Mayor"
                error={errors['onb-billing-street']}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <Input
                  id="onb-billing-street-number"
                  label="Número"
                  required
                  value={data.billingAddress?.streetNumber || ''}
                  onChange={(e) => updateBilling({ streetNumber: e.target.value })}
                  className="font-mono"
                  error={errors['onb-billing-street-number']}
                />
                <div className="sm:col-span-2">
                  <Input
                    id="onb-billing-complement"
                    label="Piso / puerta"
                    value={data.billingAddress?.streetComplement || ''}
                    onChange={(e) => updateBilling({ streetComplement: e.target.value })}
                    placeholder="3º A"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Input
                  id="onb-billing-postal-code"
                  label="Código postal"
                  required
                  value={data.billingAddress?.postalCode || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    const province = value.length === 5 ? getProvinciaFromCP(value) ?? data.billingAddress?.province ?? '' : data.billingAddress?.province ?? '';
                    updateBilling({ postalCode: value, province });
                  }}
                  inputMode="numeric"
                  maxLength={5}
                  className="font-mono"
                  error={errors['onb-billing-postal-code']}
                />
                <Input
                  id="onb-billing-province"
                  label="Provincia"
                  value={data.billingAddress?.province || ''}
                  readOnly
                  tabIndex={-1}
                  placeholder="Se rellena con el código postal"
                  className="bg-surface text-text-subtle"
                />
                <Input
                  id="onb-billing-city"
                  label="Ciudad"
                  required
                  value={data.billingAddress?.city || ''}
                  onChange={(e) => updateBilling({ city: e.target.value })}
                  error={errors['onb-billing-city']}
                />
              </div>
            </div>
          )}
        </div>
      </StepSection>

      {/* ── Categorías ──────────────────────────────────────────────────── */}
      <StepSection
        icon={<Store className="h-5 w-5" />}
        title="¿Qué productos vendes?"
        description="Elige una o varias categorías para que los clientes te encuentren."
        id="onb-categories"
      >
        <div
          role="group"
          aria-label="Categorías de productos"
          className="grid grid-cols-2 gap-2.5 lg:grid-cols-3"
        >
          {PRODUCER_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={data.categories.includes(category.id)}
              onSelect={handleCategorySelect}
            />
          ))}
        </div>
        <FieldError>{errors['onb-categories']}</FieldError>
      </StepSection>

      {/* ── Fotos del entorno (opcional) ────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface-alt shadow-xs">
        <button
          type="button"
          onClick={() => setPhotosExpanded((e) => !e)}
          aria-expanded={photosExpanded}
          aria-controls="onb-location-photos"
          className="flex min-h-11 w-full items-center justify-between gap-3 p-4 text-left sm:p-5"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-origen-pradera/20 to-origen-hoja/20 text-hoja-tinta">
              <Camera className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold leading-tight text-origen-bosque">Fotos del entorno</span>
                <OptionalBadge />
              </span>
              <span className="block text-xs text-text-subtle sm:text-sm">Tu huerta, taller o establecimiento.</span>
            </span>
          </span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-text-subtle transition-transform', photosExpanded && 'rotate-180')} />
        </button>
        {photosExpanded && (
          <div id="onb-location-photos" className="border-t border-border-subtle p-4 sm:p-5">
            <FileUpload
              value={data.locationImages || []}
              onChange={(files) => update({ locationImages: files })}
              helperText="Arrastra imágenes o toca para subir"
              accept="image/*"
              multiple
              maxFiles={10}
              maxSize={5}
              qualityRequirement={IMAGE_QUALITY_PRESETS.profileGallery}
              dimensionsHint={getImageQualityHint(IMAGE_QUALITY_PRESETS.profileGallery)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

EnhancedStep1Location.displayName = 'EnhancedStep1Location';

export default EnhancedStep1Location;
