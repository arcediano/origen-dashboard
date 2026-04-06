// 📁 /src/components/features/onboarding/components/steps/step-products.tsx
/**
 * @file step-products.tsx
 * @description Paso de Productos del onboarding — define hasta 5 productos iniciales
 * con nombre, descripción, precio, alérgenos EU 1169/2011 y disponibilidad.
 *
 * @diseñador-ux: mobile-first, cards expandibles in-place, alérgenos como grid táctil,
 *               botón "Añadir" sticky en mobile.
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input, Button, Textarea } from '@arcediano/ux-library';
import { FileUpload, type UploadedFile } from '@/components/shared';

import {
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Package,
  Euro,
  AlertCircle,
  CheckCircle2,
  Info,
  Camera,
  Clock,
  Calendar,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export type AllergenId =
  | 'gluten' | 'crustaceans' | 'eggs' | 'fish' | 'peanuts'
  | 'soy' | 'dairy' | 'nuts' | 'celery' | 'mustard'
  | 'sesame' | 'sulphites' | 'lupin' | 'molluscs';

export type AvailabilityType = 'year_round' | 'seasonal' | 'on_demand';

export type ProductUnit = 'kg' | 'litro' | 'docena' | 'unidad' | 'caja' | 'bote' | 'pack';

export interface OnboardingProduct {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  referencePrice: number | undefined;
  unit: ProductUnit;
  allergens: AllergenId[];
  mayContain: AllergenId[];
  noAllergens: boolean;
  availabilityType: AvailabilityType;
  activeMonths?: number[];
  leadTimeDays?: number;
  photo?: UploadedFile;
}

export interface EnhancedProductsData {
  products: OnboardingProduct[];
}

export interface EnhancedStepProductsProps {
  data: EnhancedProductsData;
  onChange: (data: EnhancedProductsData) => void;
  /** Categorías seleccionadas en paso 1 para filtrar las opciones del producto */
  producerCategories?: string[];
}

// ============================================================================
// CONSTANTES
// ============================================================================

const ALLERGENS: { id: AllergenId; label: string; emoji: string }[] = [
  { id: 'gluten',      label: 'Gluten',         emoji: '🌾' },
  { id: 'crustaceans', label: 'Crustáceos',      emoji: '🦐' },
  { id: 'eggs',        label: 'Huevos',          emoji: '🥚' },
  { id: 'fish',        label: 'Pescado',         emoji: '🐟' },
  { id: 'peanuts',     label: 'Cacahuetes',      emoji: '🥜' },
  { id: 'soy',         label: 'Soja',            emoji: '🫘' },
  { id: 'dairy',       label: 'Lácteos',         emoji: '🥛' },
  { id: 'nuts',        label: 'Fr. secos',       emoji: '🌰' },
  { id: 'celery',      label: 'Apio',            emoji: '🥬' },
  { id: 'mustard',     label: 'Mostaza',         emoji: '🌿' },
  { id: 'sesame',      label: 'Sésamo',          emoji: '⚪' },
  { id: 'sulphites',   label: 'Sulfitos',        emoji: '🍷' },
  { id: 'lupin',       label: 'Altramuces',      emoji: '🟡' },
  { id: 'molluscs',    label: 'Moluscos',        emoji: '🦑' },
];

const UNITS: { value: ProductUnit; label: string }[] = [
  { value: 'kg',     label: 'Kg' },
  { value: 'litro',  label: 'Litro' },
  { value: 'unidad', label: 'Unidad' },
  { value: 'docena', label: 'Docena' },
  { value: 'caja',   label: 'Caja' },
  { value: 'bote',   label: 'Bote' },
  { value: 'pack',   label: 'Pack' },
];

const MONTHS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const MAX_PRODUCTS = 5;

function createEmptyProduct(): OnboardingProduct {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    categoryId: '',
    referencePrice: undefined,
    unit: 'kg',
    allergens: [],
    mayContain: [],
    noAllergens: false,
    availabilityType: 'year_round',
    activeMonths: [],
    leadTimeDays: undefined,
    photo: undefined,
  };
}

// ============================================================================
// SUBCOMPONENTE: CARD DE PRODUCTO
// ============================================================================

interface ProductCardProps {
  product: OnboardingProduct;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (updated: OnboardingProduct) => void;
  onRemove: () => void;
  producerCategories?: string[];
}

function ProductCard({ product, index, isExpanded, onToggle, onChange, onRemove, producerCategories }: ProductCardProps) {
  const isComplete = !!(
    product.name.trim() &&
    product.description.trim().length >= 20 &&
    product.referencePrice !== undefined &&
    (product.noAllergens || product.allergens.length > 0)
  );

  const toggleAllergen = (id: AllergenId, field: 'allergens' | 'mayContain') => {
    const current = product[field];
    const other: 'allergens' | 'mayContain' = field === 'allergens' ? 'mayContain' : 'allergens';
    const updated = current.includes(id)
      ? current.filter((a) => a !== id)
      : [...current.filter((a) => a !== id), id]; // quitar del otro campo si estaba
    onChange({
      ...product,
      [field]: updated,
      [other]: product[other].filter((a) => a !== id),
      noAllergens: false,
    });
  };

  const toggleMonth = (month: number) => {
    const months = product.activeMonths ?? [];
    onChange({
      ...product,
      activeMonths: months.includes(month)
        ? months.filter((m) => m !== month)
        : [...months, month].sort((a, b) => a - b),
    });
  };

  return (
    <div className={cn(
      'rounded-2xl border transition-all duration-200',
      isComplete ? 'border-green-200 bg-green-50/30' : 'border-border bg-surface-alt',
    )}>
      {/* ── Header compacto (siempre visible) ── */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left"
        aria-expanded={isExpanded}
      >
        {/* Miniatura foto o placeholder */}
        <div className="w-14 h-14 rounded-xl bg-origen-crema/60 border border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
          {product.photo?.preview
            ? <img src={product.photo.preview} alt="" className="w-full h-full object-cover" />
            : <Camera className="w-6 h-6 text-muted-foreground/40" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-semibold truncate',
            product.name ? 'text-origen-bosque' : 'text-muted-foreground',
          )}>
            {product.name || `Producto ${index + 1}`}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {product.referencePrice !== undefined && (
              <span className="text-xs text-muted-foreground">
                {product.referencePrice.toFixed(2)} € / {UNITS.find(u => u.value === product.unit)?.label}
              </span>
            )}
            {isComplete && (
              <span className="text-xs text-green-700 flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Completo
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isExpanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground" />
          }
        </div>
      </button>

      {/* ── Formulario expandido ── */}
      {isExpanded && (
        <div className="px-4 pb-5 space-y-5 border-t border-border pt-4">

          {/* Foto del producto */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-origen-bosque">
              Foto del producto
              <span className="text-xs text-muted-foreground font-normal ml-2">(recomendada)</span>
            </p>
            <FileUpload
              value={product.photo ? [product.photo] : []}
              onChange={(files) => onChange({ ...product, photo: files[0] ?? undefined })}
              maxFiles={1}
              accept="image/jpeg,image/png,image/webp"
              maxSize={8}
              helperText="Arrastra una foto o toca para seleccionar"
            />
          </div>

          {/* Nombre */}
          <div>
            <Input
              label="Nombre del producto"
              required
              value={product.name}
              onChange={(e) => onChange({ ...product, name: e.target.value })}
              placeholder="Queso manchego curado, Aceite de oliva virgen extra..."
              inputSize="lg"
              maxLength={60}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{product.name.length} / 60</p>
          </div>

          {/* Descripción */}
          <div>
            <Textarea
              label="Descripción corta"
              required
              value={product.description}
              onChange={(e) => onChange({ ...product, description: e.target.value })}
              placeholder="Describe brevemente el producto: qué es, cómo se produce, qué lo hace especial..."
              className={cn(
                'min-h-[80px] text-sm',
                product.description.length >= 20
                  ? 'border-green-400 focus:border-green-500'
                  : 'border-border',
              )}
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{product.description.length < 20 ? `Mínimo ${20 - product.description.length} caracteres más` : '✓ Suficiente'}</span>
              <span>{product.description.length} / 200</span>
            </div>
          </div>

          {/* Precio + Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <Euro className="absolute left-3 top-[2.35rem] w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                  label="Precio de referencia"
                  required
                  type="number"
                  value={product.referencePrice ?? ''}
                  onChange={(e) => onChange({ ...product, referencePrice: parseFloat(e.target.value) || undefined })}
                  placeholder="0.00"
                  inputSize="lg"
                  className="pl-8"
                  min={0}
                  step={0.01}
                  inputMode="decimal"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">Unidad</label>
              <div className="flex flex-wrap gap-1.5">
                {UNITS.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => onChange({ ...product, unit: u.value })}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
                      product.unit === u.value
                        ? 'bg-origen-pradera text-white border-origen-pradera'
                        : 'bg-surface text-muted-foreground border-border hover:border-origen-pradera/50',
                    )}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Alérgenos EU 1169/2011 */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              Alérgenos <span className="text-red-500">*</span>
              <span className="text-xs text-muted-foreground font-normal">(Reglamento UE 1169/2011)</span>
            </p>

            {/* No contiene alérgenos */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={product.noAllergens}
                onChange={(e) => onChange({ ...product, noAllergens: e.target.checked, allergens: [], mayContain: [] })}
                className="w-4 h-4 rounded border-border accent-origen-pradera"
              />
              <span className="text-sm text-origen-bosque">Sin alérgenos</span>
            </label>

            {!product.noAllergens && (
              <>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contiene</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {ALLERGENS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAllergen(a.id, 'allergens')}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all min-h-[44px]',
                          product.allergens.includes(a.id)
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-surface border-border text-muted-foreground hover:border-red-200',
                        )}
                      >
                        <span className="text-base leading-none">{a.emoji}</span>
                        <span className="text-[10px] font-medium leading-tight">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Puede contener (trazas)</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {ALLERGENS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleAllergen(a.id, 'mayContain')}
                        className={cn(
                          'flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all min-h-[44px]',
                          product.mayContain.includes(a.id)
                            ? 'bg-amber-50 border-amber-300 text-amber-700'
                            : 'bg-surface border-border text-muted-foreground hover:border-amber-200',
                          product.allergens.includes(a.id) && 'opacity-40 pointer-events-none',
                        )}
                      >
                        <span className="text-base leading-none">{a.emoji}</span>
                        <span className="text-[10px] font-medium leading-tight">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {!product.noAllergens && product.allergens.length === 0 && product.mayContain.length === 0 && (
              <p className="text-xs text-amber-700 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Indica los alérgenos o marca "Sin alérgenos" para continuar
              </p>
            )}
          </div>

          {/* Disponibilidad */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-origen-bosque">Disponibilidad</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'year_round', label: 'Todo el año',   icon: RefreshCw },
                { value: 'seasonal',   label: 'De temporada',  icon: Calendar },
                { value: 'on_demand',  label: 'Bajo pedido',   icon: Clock },
              ] as const).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onChange({ ...product, availabilityType: value })}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    product.availabilityType === value
                      ? 'bg-origen-pradera text-white border-origen-pradera'
                      : 'bg-surface text-muted-foreground border-border hover:border-origen-pradera/50',
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Meses activos — solo si temporada */}
            {product.availabilityType === 'seasonal' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Selecciona los meses en que está disponible</p>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                  {MONTHS.map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleMonth(i + 1)}
                      className={cn(
                        'py-1.5 rounded-lg text-xs font-medium border transition-all',
                        (product.activeMonths ?? []).includes(i + 1)
                          ? 'bg-origen-pradera text-white border-origen-pradera'
                          : 'bg-surface text-muted-foreground border-border hover:border-origen-pradera/30',
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Lead time — solo si bajo pedido */}
            {product.availabilityType === 'on_demand' && (
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  value={product.leadTimeDays ?? ''}
                  onChange={(e) => onChange({ ...product, leadTimeDays: parseInt(e.target.value) || undefined })}
                  placeholder="5"
                  inputSize="md"
                  className="w-20 font-mono text-center"
                  min={1}
                  max={30}
                  inputMode="numeric"
                />
                <span className="text-sm text-muted-foreground">días de plazo para preparar el pedido</span>
              </div>
            )}
          </div>

          {/* Botón eliminar */}
          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Eliminar producto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStepProducts({ data, onChange, producerCategories }: EnhancedStepProductsProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(
    data.products.length === 0 ? null : data.products[0].id,
  );

  const canAddMore = data.products.length < MAX_PRODUCTS;
  const hasMinimum = data.products.length >= 1;

  const handleAdd = () => {
    const newProduct = createEmptyProduct();
    onChange({ products: [...data.products, newProduct] });
    setExpandedId(newProduct.id);
  };

  const handleUpdate = (id: string, updated: OnboardingProduct) => {
    onChange({ products: data.products.map((p) => (p.id === id ? updated : p)) });
  };

  const handleRemove = (id: string) => {
    onChange({ products: data.products.filter((p) => p.id !== id) });
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-6">

      {/* Progress bar */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
            <span className="text-sm font-medium text-origen-hoja">Productos del catálogo inicial</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{data.products.length} / {MAX_PRODUCTS}</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${(data.products.length / MAX_PRODUCTS) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Añade entre 1 y 5 productos. Podrás completar el catálogo desde tu panel.
        </p>
      </div>

      {/* Aviso si no hay productos */}
      {!hasMinimum && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Añade al menos un producto para continuar</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Los compradores necesitan ver qué vendes. Define tu primer producto a continuación.
            </p>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="space-y-3">
        {data.products.map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            isExpanded={expandedId === product.id}
            onToggle={() => setExpandedId(expandedId === product.id ? null : product.id)}
            onChange={(updated) => handleUpdate(product.id, updated)}
            onRemove={() => handleRemove(product.id)}
            producerCategories={producerCategories}
          />
        ))}
      </div>

      {/* Botón añadir — full-width en mobile */}
      {canAddMore ? (
        <Button
          type="button"
          onClick={handleAdd}
          variant="outline"
          className="w-full h-12 border-dashed border-origen-pradera/40 text-origen-bosque hover:bg-origen-crema/30 hover:border-origen-pradera"
        >
          <Plus className="w-4 h-4 mr-2" />
          Añadir producto {data.products.length > 0 ? `(${data.products.length}/${MAX_PRODUCTS})` : ''}
        </Button>
      ) : (
        <div className="p-3 bg-origen-crema/40 rounded-xl border border-border text-center">
          <p className="text-xs text-muted-foreground">
            Has alcanzado el máximo de {MAX_PRODUCTS} productos para el onboarding.
            Podrás añadir más desde tu panel de productos.
          </p>
        </div>
      )}

      {/* Trust badge */}
      <div className="flex items-start gap-2 p-3 bg-origen-crema/20 rounded-xl border border-border-subtle">
        <Info className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          La información de alérgenos es obligatoria por el{' '}
          <span className="font-medium">Reglamento UE 1169/2011</span>.
          Es tu responsabilidad legal como productor declararla correctamente.
        </p>
      </div>
    </div>
  );
}

