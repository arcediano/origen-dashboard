// 📁 /src/components/onboarding/steps/EnhancedStep1Location.tsx
/**
 * @file EnhancedStep1Location.tsx
 * @description Paso 1: Ubicación + Confianza inicial
 * @version 8.0.0 - CORREGIDO: Imports de select, tipos locales
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { IMAGE_QUALITY_PRESETS, getImageQualityHint } from '@/lib/validations/image-quality';

import { Input, InputAffixField } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile, CategoryCard } from '@/components/shared';
import { validateSpanishTaxId, type TaxIdType } from '@/lib/utils/tax-id';

import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { getProvinciaFromCP } from '@/constants/cp-provincias';

import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Home,
  Store,
  Info,
  ChevronDown,
  FileText,
  Building2,
} from 'lucide-react';

// ============================================================================
// SELECT PERSONALIZADO - Sin dependencias de ui/select
// ============================================================================

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder,
  className,
  searchable = false,
  disabled = false,
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const selectRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!isOpen) setSearchQuery('');
  }, [isOpen, searchable]);

  // Buscar la label del valor seleccionado
  React.useEffect(() => {
    if (value) {
      const option = React.Children.toArray(children).find(
        (child: any) => child.props?.value === value
      );
      if (option && React.isValidElement(option)) {
        setSelectedLabel(option.props.children as string);
      }
    } else {
      setSelectedLabel('');
    }
  }, [value, children]);

  const filteredChildren = searchable && searchQuery
    ? React.Children.toArray(children).filter((child: any) => {
        const label = typeof child.props?.children === 'string' ? child.props.children : '';
        return label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .includes(searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      })
    : React.Children.toArray(children);

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border bg-surface-alt px-4 py-3 text-left transition-all",
          "border-border hover:border-origen-pradera focus:border-origen-pradera focus:outline-none focus:ring-2 focus:ring-origen-pradera/20",
          disabled && "cursor-not-allowed opacity-50 bg-surface hover:border-border",
          className
        )}
      >
        <span className={cn(
          "text-base",
          value ? "text-origen-oscuro" : "text-text-subtle"
        )}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-surface-alt shadow-lg animate-in fade-in-0 zoom-in-95">
          {searchable && (
            <div className="p-2 border-b border-border-subtle">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar provincia..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-origen-pradera"
              />
            </div>
          )}
          <div className="max-h-56 overflow-auto p-1">
            {filteredChildren.length === 0 && (
              <p className="px-3 py-2.5 text-sm text-text-subtle text-center">Sin resultados</p>
            )}
            {filteredChildren.map((child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  onSelect: (v: string) => {
                    onValueChange(v);
                    setIsOpen(false);
                  },
                  isSelected: (child as React.ReactElement<any>).props.value === value
                });
              }
              return child;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  isSelected?: boolean;
}

const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  onSelect,
  isSelected
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors",
        "hover:bg-origen-crema hover:text-origen-bosque",
        "focus:bg-origen-crema focus:text-origen-bosque",
        isSelected && "bg-origen-pradera/10 font-medium text-origen-bosque"
      )}
    >
      <span className="flex-1 text-left">{children}</span>
      {isSelected && (
        <CheckCircle2 className="h-4 w-4 text-origen-pradera" />
      )}
    </button>
  );
};

// ============================================================================
// TIPOS
// ============================================================================

export interface AddressFields {
  street: string;
  streetNumber: string;
  streetComplement?: string;
  city: string;
  province: string;
  postalCode: string;
}

export type EntityType =
  | 'autonomo'
  | 'sl'
  | 'sa'
  | 'cooperativa'
  | 'comunidad_bienes'
  | 'asociacion'
  | 'otro';

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  autonomo: 'Autónomo / Empresario individual',
  sl: 'Sociedad Limitada (SL)',
  sa: 'Sociedad Anónima (SA)',
  cooperativa: 'Cooperativa',
  comunidad_bienes: 'Comunidad de Bienes',
  asociacion: 'Asociación / Fundación',
  otro: 'Otra forma jurídica',
};

export interface EnhancedLocationData {
  // Identidad legal
  entityType?: EntityType;
  legalRepresentativeName?: string;
  businessPhone?: string;

  // Dirección de producción (punto de recogida de pedidos)
  street: string;
  streetNumber: string;
  streetComplement?: string;
  city: string;
  province: string;
  postalCode: string;

  // Dirección de facturación
  billingAddress?: AddressFields;
  billingAddressSameAsProduction: boolean;

  categories: string[];
  locationImages: UploadedFile[];

  // Confianza inicial
  foundedYear?: number;
  teamSize?: '1-2' | '3-5' | '6-10' | '11+';
  taxId?: string;
}

export interface EnhancedStep1LocationProps {
  data: EnhancedLocationData;
  onChange: (data: EnhancedLocationData) => void;
}

// CategoryCard importado de @/components/shared — componente canónico

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep1Location({ data, onChange }: EnhancedStep1LocationProps) {
  const billingAddressSameAsProduction = data.billingAddressSameAsProduction ?? true;
  
  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const hasBasicInfo = Boolean(
    data.street?.trim() &&
    data.streetNumber?.trim() &&
    data.city?.trim() &&
    data.province &&
    data.postalCode?.trim()
  );

  const cpError = React.useMemo(() => {
    const cp = data.postalCode || '';
    if (cp.length < 5 || !data.province) return undefined;
    const expected = getProvinciaFromCP(cp);
    if (expected === null) return undefined;
    // Both values are now the capitalized PROVINCIAS_ESPANA name — direct comparison
    if (expected === data.province) return undefined;
    return `Este código postal corresponde a ${expected}, no a ${data.province}.`;
  }, [data.postalCode, data.province]);

  const hasCategories = data.categories?.length > 0;
  const hasYear = Boolean(data.foundedYear && data.foundedYear >= 1900 && data.foundedYear <= new Date().getFullYear());
  const hasTeamSize = Boolean(data.teamSize);

  // Validación teléfono — solo tras perder el foco
  const [phoneTouched, setPhoneTouched] = React.useState(false);
  const phoneError = React.useMemo(() => {
    if (!data.businessPhone?.trim()) return undefined; // no mostrar hasta que se toque
    if (!/^[6789]\d{8}$/.test(data.businessPhone.trim())) {
      return 'Introduce un teléfono español válido (9 dígitos, comenzando por 6, 7, 8 o 9)';
    }
    return undefined;
  }, [data.businessPhone]);

  // Validación NIF/CIF/NIE — solo tras perder el foco
  const [taxIdTouched, setTaxIdTouched] = React.useState(false);
  const taxIdValidation = React.useMemo(
    () => (data.taxId ? validateSpanishTaxId(data.taxId) : { valid: false }),
    [data.taxId],
  );
  const taxIdError = taxIdTouched && !taxIdValidation.valid ? taxIdValidation.error : undefined;
  const taxIdBadge: Record<TaxIdType, string> = { NIF: 'NIF', NIE: 'NIE', CIF: 'CIF' };

  const totalSteps = 4;
  const completedSteps = [hasBasicInfo, hasCategories, hasYear, hasTeamSize].filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleInputChange = (field: keyof EnhancedLocationData, value: any) => {
    onChange({ ...data, billingAddressSameAsProduction, [field]: value });
  };

  const capitalizeWords = (str: string) =>
    str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    if (value.length === 5) {
      const expected = getProvinciaFromCP(value);
      if (expected !== null) {
        onChange({ ...data, postalCode: value, province: expected });
        return;
      }
    }
    handleInputChange('postalCode', value);
  };

  const handleCityBlur = () => {
    if (data.city) handleInputChange('city', capitalizeWords(data.city));
  };

  const handleStreetBlur = () => {
    if (data.street) handleInputChange('street', capitalizeWords(data.street));
  };

  const handleCategorySelect = (categoryId: string) => {
    const isSelected = data.categories?.includes(categoryId);
    const newCategories = isSelected
      ? data.categories.filter(id => id !== categoryId)
      : [...(data.categories || []), categoryId];
    handleInputChange('categories', newCategories);
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="space-y-6">
      
      {/* ====================================================================
          PROGRESS BAR
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
            <span className="text-sm font-medium text-origen-hoja">Información del negocio</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{completedSteps}/{totalSteps}</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Completa tu ubicación y cuéntanos tu trayectoria
        </p>
      </div>

      {/* ====================================================================
          CARD 0: IDENTIDAD LEGAL
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Identidad legal</h2>
            <p className="text-sm text-muted-foreground">Necesario para la verificación de tu cuenta y la emisión de facturas</p>
          </div>
        </div>

        <div className="space-y-5">

          {/* Tipo de entidad — pills scrollables en mobile */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              Forma jurídica <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(ENTITY_TYPE_LABELS) as [EntityType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleInputChange('entityType', key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    data.entityType === key
                      ? 'bg-origen-pradera text-white border-origen-pradera shadow-sm'
                      : 'bg-surface text-muted-foreground border-border hover:border-origen-pradera/50 hover:text-origen-bosque',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre del representante legal — solo si no es autónomo */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300',
              data.entityType && data.entityType !== 'autonomo' ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0',
            )}
          >
            <div className="pt-1">
              <Input
                label="Nombre del representante legal"
                required
                value={data.legalRepresentativeName || ''}
                onChange={(e) => handleInputChange('legalRepresentativeName', e.target.value)}
                placeholder="Nombre y apellidos del representante"
                inputSize="lg"
                helperText="Persona física con poderes de representación de la entidad."
              />
            </div>
          </div>

          {/* NIF / CIF — movido aquí desde la card de ubicación */}
          <div>
            {taxIdValidation.valid && taxIdValidation.type && (
              <div className="flex justify-end mb-1">
                <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  {taxIdBadge[taxIdValidation.type]} ✓
                </span>
              </div>
            )}
            <Input
              label="NIF / CIF / NIE"
              required
              value={data.taxId || ''}
              onChange={(e) => handleInputChange('taxId', e.target.value.toUpperCase().replace(/[\s\-]/g, ''))}
              onBlur={() => setTaxIdTouched(true)}
              placeholder="12345678A · X1234567L · B12345678"
              inputSize="lg"
              className="font-mono uppercase"
              maxLength={9}
              error={taxIdError}
              helperText={!taxIdError ? 'NIF (personas físicas), NIE (extranjeros) o CIF (personas jurídicas).' : undefined}
            />
          </div>

          {/* Teléfono de negocio */}
          <div>
            <InputAffixField
              label="Teléfono de contacto del negocio"
              required
              value={data.businessPhone || ''}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                handleInputChange('businessPhone', digits);
              }}
              onBlur={() => setPhoneTouched(true)}
              placeholder="600 000 000"
              inputMode="tel"
              inputSize="lg"
              affixLeft="+34"
              error={phoneTouched ? phoneError : undefined}
              helperText={!phoneTouched || !phoneError ? 'Para coordinación de pedidos y entregas. No se mostrará públicamente.' : undefined}
            />
          </div>

        </div>
      </div>

      {/* ====================================================================
          CARD 1: UBICACIÓN + AÑO FUNDACIÓN + EQUIPO
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Home className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Dirección de producción</h2>
            <p className="text-sm text-muted-foreground">Aquí se recogerán tus pedidos. Debe ser la dirección real de tu producción o almacén.</p>
          </div>
        </div>

        {/* Helper contextual */}
        <div className="flex items-start gap-2 p-3 bg-origen-crema/40 rounded-xl border border-origen-pradera/20 mb-6">
          <Info className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Esta información nos ayuda a conectarte con compradores de tu zona y a verificar tu identidad como productor.
          </p>
        </div>

        <div className="space-y-5">
          {/* Nombre de la vía */}
          <Input
            label="Nombre de la vía"
            required
            value={data.street || ''}
            onChange={(e) => handleInputChange('street', e.target.value)}
            onBlur={handleStreetBlur}
            placeholder="Calle Mayor, Av. de la Constitución"
            inputSize="lg"
          />

          {/* Número + Piso/Puerta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Input
              label="Número"
              required
              value={data.streetNumber || ''}
              onChange={(e) => handleInputChange('streetNumber', e.target.value)}
              inputSize="lg"
              className="font-mono"
            />
            <div className="sm:col-span-2">
              <Input
                label="Piso / Puerta"
                value={data.streetComplement || ''}
                onChange={(e) => handleInputChange('streetComplement', e.target.value)}
                placeholder="3º A, Local 1, Bajo"
                inputSize="lg"
              />
            </div>
          </div>

          {/* CP + Provincia + Ciudad/Municipio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Input
              label="Código Postal"
              required
              value={data.postalCode || ''}
              onChange={handlePostalCodeChange}
              maxLength={5}
              inputSize="lg"
              className="font-mono"
              error={cpError}
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Provincia <span className="text-red-500">*</span>
              </label>
              <Select
                value={data.province || ''}
                onValueChange={(value) => handleInputChange('province', value)}
                placeholder="Autodetectada"
                disabled
              >
                {PROVINCIAS_ESPANA.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <Input
              label="Ciudad / Municipio"
              required
              value={data.city || ''}
              onChange={(e) => handleInputChange('city', e.target.value)}
              onBlur={handleCityBlur}
              inputSize="lg"
            />
          </div>

          {/* Año de fundación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-border-subtle">
            <div>
              <Input
                label="Año de fundación"
                type="number"
                value={data.foundedYear || ''}
                onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || undefined)}
                min={1900}
                max={new Date().getFullYear()}
                inputSize="lg"
              />
              {data.foundedYear && (
                <p className="text-xs text-origen-pradera mt-1">
                  {new Date().getFullYear() - data.foundedYear} años de experiencia
                </p>
              )}
            </div>

            {/* Tamaño del equipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
                Tamaño del equipo
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Select
                value={data.teamSize || ''}
                onValueChange={(value) => handleInputChange('teamSize', value as any)}
                placeholder="Selecciona tamaño"
              >
                <SelectItem value="1-2">Emprendedor individual (1-2 personas)</SelectItem>
                <SelectItem value="3-5">Pequeño equipo (3-5 personas)</SelectItem>
                <SelectItem value="6-10">Equipo mediano (6-10 personas)</SelectItem>
                <SelectItem value="11+">Gran equipo (más de 11 personas)</SelectItem>
              </Select>
              <p className="text-xs text-muted-foreground">Humaniza tu negocio</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 1b: DIRECCIÓN DE FACTURACIÓN
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-bosque/10 to-origen-hoja/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Dirección de facturación</h2>
            <p className="text-sm text-muted-foreground">Datos fiscales para emitir facturas a tus compradores</p>
          </div>
        </div>

        {/* Checkbox "igual a la de producción" */}
        <div className="p-3 bg-origen-crema/30 rounded-xl border border-border-subtle hover:bg-origen-crema/50 transition-colors mb-5">
          <label
            htmlFor="billing-address-same-as-production"
            className="flex cursor-pointer items-start gap-3"
          >
            <input
              id="billing-address-same-as-production"
              type="checkbox"
              checked={billingAddressSameAsProduction}
              onChange={(event) => {
                const same = event.target.checked;
                onChange({
                  ...data,
                  billingAddressSameAsProduction: same,
                  billingAddress: same ? undefined : data.billingAddress,
                });
              }}
              className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 border-origen-pradera/50 text-origen-pradera focus:ring-2 focus:ring-origen-pradera/50"
            />

            <span className="text-sm font-medium text-origen-bosque">
              La dirección de facturación es la misma que la de producción
            </span>
          </label>
        </div>

        {/* Campos de facturación — solo si son distintas */}
        {!billingAddressSameAsProduction && (
          <div className="space-y-5">
            <Input
              label="Nombre de la vía"
              required
              value={data.billingAddress?.street || ''}
              onChange={(e) => handleInputChange('billingAddress', { ...data.billingAddress, street: e.target.value })}
              placeholder="Calle Mayor, Av. de la Constitución"
              inputSize="lg"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Input
                label="Número"
                required
                value={data.billingAddress?.streetNumber || ''}
                onChange={(e) => handleInputChange('billingAddress', { ...data.billingAddress, streetNumber: e.target.value })}
                inputSize="lg"
                className="font-mono"
              />
              <div className="sm:col-span-2">
                <Input
                  label="Piso / Puerta"
                  value={data.billingAddress?.streetComplement || ''}
                  onChange={(e) => handleInputChange('billingAddress', { ...data.billingAddress, streetComplement: e.target.value })}
                  placeholder="3º A, Local 1"
                  inputSize="lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Código Postal"
                required
                value={data.billingAddress?.postalCode || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  const province = value.length === 5 ? (getProvinciaFromCP(value) ?? data.billingAddress?.province ?? '') : (data.billingAddress?.province ?? '');
                  handleInputChange('billingAddress', { ...data.billingAddress, postalCode: value, province });
                }}
                maxLength={5}
                inputSize="lg"
                className="font-mono"
              />
              <Input
                label="Provincia"
                required
                value={data.billingAddress?.province || ''}
                disabled
                placeholder="Autodetectada"
                inputSize="lg"
                className="bg-surface text-muted-foreground"
              />
              <Input
                label="Ciudad"
                required
                value={data.billingAddress?.city || ''}
                onChange={(e) => handleInputChange('billingAddress', { ...data.billingAddress, city: e.target.value })}
                inputSize="lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 2: CATEGORÍAS
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">¿Qué productos vendes?</h2>
            <p className="text-sm text-muted-foreground">Selecciona tu categoría principal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCER_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={data.categories?.includes(category.id) || false}
              onSelect={handleCategorySelect}
            />
          ))}
        </div>

        {!hasCategories && (
          <div className="mt-6 p-4 bg-feedback-danger-subtle/50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-feedback-danger flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Selecciona al menos una categoría
              </p>
              <p className="text-xs text-red-600 mt-1">
                Necesitamos saber qué productos vendes para personalizar tu experiencia.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 3: FOTOS DEL ENTORNO (OPCIONAL)
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Camera className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Fotos del entorno</h2>
            <p className="text-sm text-muted-foreground">Muestra tu huerta, taller o establecimiento</p>
          </div>
        </div>

        <FileUpload
          value={data.locationImages || []}
          onChange={(files) => handleInputChange('locationImages', files)}
          helperText="Arrastra imágenes o haz clic para subir"
          accept="image/*"
          multiple={true}
          maxSize={5}
          qualityRequirement={IMAGE_QUALITY_PRESETS.profileGallery}
          dimensionsHint={getImageQualityHint(IMAGE_QUALITY_PRESETS.profileGallery)}
        />
        
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2 bg-origen-crema/50 p-3 rounded-lg">
          <Leaf className="w-4 h-4 text-origen-pradera flex-shrink-0" />
          <span>Formatos: JPG, PNG, WEBP. Usa fotos amplias y bien iluminadas para que tu perfil publico no se vea pixelado.</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep1Location.displayName = 'EnhancedStep1Location';

export default EnhancedStep1Location;

