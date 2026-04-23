/**
 * @component StepPricing
 * @description Paso 3: Precios y ofertas
 */

'use client';

import { Button, Input, Badge } from '@arcediano/ux-library';
import { Alert } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Card,
  CurrencyInput,
  PercentageInput,
} from '@arcediano/ux-library';
import {
  DollarSign,
  Tag,
  Plus,
  Gift,
  CheckCircle,
  Sparkles,
  AlertCircle,
  Package,
  Edit2,
  Save,
  Zap,
  Trash2,
  Hash,
  Percent,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { z } from 'zod';
import type { PriceTier } from '@/types/product';

interface StepPricingProps {
  formData?: any;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onInputChange: (field: string, value: any) => void;
  onPriceTiersChange?: (priceTiers: PriceTier[]) => void;
  completed?: boolean;
}

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const TierSchema = z.object({
  minQuantity: z.number().min(1, 'La cantidad mínima debe ser al menos 1 unidad'),
  maxQuantity: z.number().optional(),
  type: z.enum(['percentage', 'fixed', 'bundle']),
  value: z.number().optional(),
  buyQuantity: z.number().optional(),
  payQuantity: z.number().optional(),
}).refine((data) => {
  if (data.type === 'percentage') return data.value && data.value > 0 && data.value <= 100;
  if (data.type === 'fixed') return data.value && data.value > 0;
  if (data.type === 'bundle') return data.buyQuantity && data.payQuantity && data.buyQuantity > data.payQuantity;
  return true;
}, 'Valores no válidos');

// ============================================================================
// HELPERS
// ============================================================================

function getTierValidationError(tier: Partial<PriceTier>): string {
  if (tier.type === 'percentage') {
    if (!tier.value || tier.value <= 0) return 'Introduce un porcentaje de descuento mayor que 0%';
    if (tier.value > 100) return 'El descuento no puede superar el 100%';
  }
  if (tier.type === 'fixed') {
    if (!tier.value || tier.value <= 0) return 'El precio de oferta debe ser mayor que 0€';
  }
  if (tier.type === 'bundle') {
    if (!tier.buyQuantity || !tier.payQuantity) return 'Indica cuántas unidades lleva el cliente y cuántas paga';
    if (tier.buyQuantity <= tier.payQuantity) return 'Las unidades que se llevan deben ser más que las que pagan (ej: lleva 3, paga 2)';
  }
  return 'Revisa los valores de la oferta';
}

function getTierTitle(tier: Partial<PriceTier>): string {
  switch (tier.type) {
    case 'percentage':
      return `${tier.value ?? 0}% de descuento`;
    case 'fixed':
      return `Precio especial ${(tier.value ?? 0).toFixed(2)} €`;
    case 'bundle':
      return `${tier.buyQuantity ?? 0}×${tier.payQuantity ?? 0} — lleva ${tier.buyQuantity ?? 0}, paga ${tier.payQuantity ?? 0}`;
    default:
      return 'Oferta';
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StepPricing({
  formData = { basePrice: undefined, comparePrice: undefined, priceTiers: [] },
  errors = {},
  touched = {},
  onInputChange,
  onPriceTiersChange,
  completed
}: StepPricingProps) {

  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tiers, setTiers] = useState<PriceTier[]>(formData.priceTiers || []);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Estado para nueva oferta
  const [newTier, setNewTier] = useState<Partial<PriceTier>>({
    type: 'percentage',
    minQuantity: 2,
    value: 10,
    buyQuantity: 3,
    payQuantity: 2,
  });

  const basePrice = formData.basePrice || 0;
  const hasBasePrice = basePrice > 0;
  const isStepComplete = hasBasePrice;

  // ============================================================================
  // SYNC — se llama directamente en los handlers, sin useEffect
  // ============================================================================

  const syncTiers = (newTiers: PriceTier[]) => {
    setTiers(newTiers);
    onInputChange('priceTiers', newTiers);
    onPriceTiersChange?.(newTiers);
  };

  // ============================================================================
  // FUNCIONES DE CÁLCULO
  // ============================================================================

  const calculateOfferPrice = (tier: Partial<PriceTier>): number => {
    if (!basePrice) return 0;
    switch (tier.type) {
      case 'percentage':
        return basePrice * (1 - (tier.value || 0) / 100);
      case 'fixed':
        return tier.value || 0;
      case 'bundle': {
        const buyQty = tier.buyQuantity || 1;
        const payQty = tier.payQuantity || 1;
        return (basePrice * payQty) / buyQty;
      }
      default:
        return 0;
    }
  };

  const calculateSavings = (tier: Partial<PriceTier>): number => {
    if (!basePrice) return 0;
    return Math.max(0, basePrice - calculateOfferPrice(tier));
  };

  const calculateDiscountPercent = (tier: Partial<PriceTier>): number => {
    if (!basePrice) return 0;
    return (calculateSavings(tier) / basePrice) * 100;
  };

  // ============================================================================
  // HANDLERS DE OFERTAS
  // ============================================================================

  const handleAddTier = () => {
    setValidationError(null);
    try {
      TierSchema.parse(newTier);
      const tier: PriceTier = {
        id: `tier-${Date.now()}`,
        minQuantity: newTier.minQuantity || 2,
        maxQuantity: newTier.maxQuantity,
        type: newTier.type as 'percentage' | 'fixed' | 'bundle',
        value: newTier.value,
        buyQuantity: newTier.buyQuantity,
        payQuantity: newTier.payQuantity,
        label: getTierTitle(newTier),
      };
      syncTiers([...tiers, tier]);
      resetForm();
      setShowTierForm(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(getTierValidationError(newTier));
      }
    }
  };

  const handleUpdateTier = () => {
    if (!editingTierId) return;
    try {
      TierSchema.parse(newTier);
      const updatedTiers = tiers.map(tier =>
        tier.id === editingTierId
          ? { ...tier, ...newTier, label: getTierTitle(newTier) }
          : tier
      );
      syncTiers(updatedTiers);
      resetForm();
      setShowTierForm(false);
      setEditingTierId(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(getTierValidationError(newTier));
      }
    }
  };

  const handleEditTier = (tier: PriceTier) => {
    setEditingTierId(tier.id);
    setNewTier({
      type: tier.type,
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      value: tier.value,
      buyQuantity: tier.buyQuantity,
      payQuantity: tier.payQuantity,
    });
    setShowTierForm(true);
  };

  const handleDeleteTier = (id: string) => {
    syncTiers(tiers.filter(t => t.id !== id));
  };

  const handleMoveTierUp = (id: string) => {
    const idx = tiers.findIndex(t => t.id === id);
    if (idx <= 0) return;
    const next = [...tiers];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    syncTiers(next);
  };

  const handleMoveTierDown = (id: string) => {
    const idx = tiers.findIndex(t => t.id === id);
    if (idx >= tiers.length - 1) return;
    const next = [...tiers];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    syncTiers(next);
  };

  const resetForm = () => {
    setNewTier({
      type: 'percentage',
      minQuantity: 2,
      value: 10,
      buyQuantity: 3,
      payQuantity: 2,
    });
    setValidationError(null);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" className="p-4 sm:p-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isStepComplete ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white" : "bg-origen-pradera/10 text-origen-hoja"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Precios y ofertas</h2>
              <p className="text-sm text-muted-foreground truncate">Configura el precio y promociones por cantidad</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isStepComplete ? (
              <Badge variant="success" size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completado
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Pendiente
              </Badge>
            )}
            <Badge variant="leaf" size="sm" className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Paso 3 de 7
            </Badge>
          </div>
        </div>

        {/* Precios base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Precio base */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Precio de venta
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip
                content="Precio de venta al público"
                detailed="Es el precio que verá el cliente. Todos los descuentos por cantidad se calculan sobre este valor."
                size="sm"
              />
            </div>
            <CurrencyInput
              value={basePrice}
              onChange={(value) => onInputChange('basePrice', value)}
              min={0.01}
              inputSize="lg"
              className={cn(
                "h-12 w-full rounded-xl",
                (touched?.basePrice && errors?.basePrice) && "border-feedback-danger"
              )}
              placeholder="Ej: 24,50"
            />
          </div>

          {/* Precio tachado */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Precio tachado
                <span className="text-xs font-normal text-muted-foreground ml-1">(opcional)</span>
              </span>
              <Tooltip
                content="PVP sugerido o precio anterior"
                detailed="Si es mayor que el precio de venta, se mostrará tachado junto al precio actual para destacar el ahorro. Ejemplo: precio habitual en tienda."
                size="sm"
              />
            </div>
            <CurrencyInput
              value={formData.comparePrice || 0}
              onChange={(value) => onInputChange('comparePrice', value || undefined)}
              min={0}
              inputSize="lg"
              className="h-12 w-full rounded-xl"
              placeholder="Ej: 29,90"
            />
          </div>
        </div>

        {/* Descuento calculado vs precio tachado */}
        {formData.comparePrice && formData.comparePrice > basePrice && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                El cliente ahorra un {Math.round(((formData.comparePrice - basePrice) / formData.comparePrice) * 100)}% respecto al precio tachado
              </span>
            </div>
          </div>
        )}

        {/* Sección de ofertas por cantidad */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-origen-pradera" />
              <h3 className="text-sm font-semibold text-origen-bosque">Ofertas por cantidad</h3>
              {tiers.length > 0 && (
                <Badge variant="leaf" size="sm" className="ml-2">
                  {tiers.length} {tiers.length === 1 ? 'activa' : 'activas'}
                </Badge>
              )}
            </div>
            <button
              onClick={() => {
                resetForm();
                setEditingTierId(null);
                setShowTierForm(!showTierForm);
              }}
              disabled={!hasBasePrice}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border-2 transition-all text-xs font-medium",
                hasBasePrice
                  ? "border-origen-pradera/30 hover:border-origen-pradera hover:bg-origen-pradera/5 text-origen-bosque bg-surface-alt"
                  : "border-border bg-surface text-text-subtle cursor-not-allowed"
              )}
            >
              <Plus className="w-3 h-3" />
              {showTierForm ? 'Cancelar' : 'Nueva oferta'}
            </button>
          </div>

          {/* Aviso si no hay precio base */}
          {!hasBasePrice && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              Configura primero el precio de venta para poder crear ofertas
            </Alert>
          )}

          {/* Formulario de oferta */}
          <AnimatePresence>
            {showTierForm && hasBasePrice && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 sm:p-5 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20 mb-4 space-y-4">
                  <h4 className="text-sm font-medium text-origen-bosque">
                    {editingTierId ? 'Editar oferta' : 'Nueva oferta por cantidad'}
                  </h4>

                  {/* Selector de tipo */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'percentage', icon: Percent, label: 'Porcentaje', desc: 'Descuento en % sobre el precio' },
                      { id: 'fixed', icon: DollarSign, label: 'Precio fijo', desc: 'Precio especial reducido' },
                      { id: 'bundle', icon: Gift, label: 'Pack', desc: 'Lleva más, paga menos (3×2…)' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewTier({ ...newTier, type: type.id as any })}
                        className={cn(
                          "flex flex-col items-center p-2 sm:p-3 rounded-lg border-2 transition-all",
                          newTier.type === type.id
                            ? "border-origen-pradera bg-origen-pradera/5"
                            : "border-border hover:border-border bg-surface-alt"
                        )}
                      >
                        <type.icon className={cn(
                          "w-5 h-5 mb-1",
                          newTier.type === type.id ? "text-origen-pradera" : "text-text-subtle"
                        )} />
                        <span className="text-xs font-medium text-center leading-tight">{type.label}</span>
                        <span className="text-[10px] text-text-subtle hidden sm:block text-center mt-0.5 leading-tight">{type.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Campos de cantidad + campo específico del tipo */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Cantidad mínima */}
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-origen-pradera" />
                        Cantidad mínima
                      </p>
                      <Input
                        type="number"
                        value={newTier.minQuantity}
                        onChange={(e) => setNewTier({ ...newTier, minQuantity: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="h-11"
                        placeholder="2"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">Unidades para activar la oferta</p>
                    </div>

                    {/* Cantidad máxima */}
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-origen-pradera" />
                        Cantidad máxima
                      </p>
                      <Input
                        type="number"
                        value={newTier.maxQuantity || ''}
                        onChange={(e) => setNewTier({ ...newTier, maxQuantity: parseInt(e.target.value) || undefined })}
                        min={1}
                        className="h-11"
                        placeholder="Sin límite"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">Opcional — deja vacío si no hay tope</p>
                    </div>
                  </div>

                  {/* Campo específico del tipo */}
                  {newTier.type === 'percentage' && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-origen-pradera" />
                        Porcentaje de descuento
                      </p>
                      <PercentageInput
                        value={newTier.value || 0}
                        onChange={(v) => setNewTier({ ...newTier, value: v })}
                        min={0.1}
                        max={99}
                        className="h-11"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        El precio baja este % cuando el cliente compra la cantidad mínima
                      </p>
                    </div>
                  )}

                  {newTier.type === 'fixed' && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-origen-pradera" />
                        Precio de oferta (€ por unidad)
                      </p>
                      <CurrencyInput
                        value={newTier.value || 0}
                        onChange={(v) => setNewTier({ ...newTier, value: v })}
                        min={0.01}
                        inputSize="md"
                        className="h-11"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Precio especial que pagará el cliente por unidad al comprar la cantidad mínima
                      </p>
                    </div>
                  )}

                  {newTier.type === 'bundle' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <Package className="w-3 h-3 text-origen-pradera" />
                            El cliente lleva (uds)
                          </p>
                          <Input
                            type="number"
                            value={newTier.buyQuantity}
                            onChange={(e) => setNewTier({ ...newTier, buyQuantity: parseInt(e.target.value) || 2 })}
                            min={2}
                            className="h-11"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-origen-pradera" />
                            El cliente paga solo (uds)
                          </p>
                          <Input
                            type="number"
                            value={newTier.payQuantity}
                            onChange={(e) => setNewTier({ ...newTier, payQuantity: parseInt(e.target.value) || 1 })}
                            min={1}
                            className="h-11"
                          />
                        </div>
                      </div>
                      {(newTier.buyQuantity || 0) > (newTier.payQuantity || 0) && (
                        <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                          El cliente lleva <strong>{newTier.buyQuantity}</strong> unidades pero solo paga <strong>{newTier.payQuantity}</strong> — <strong>{(newTier.buyQuantity || 0) - (newTier.payQuantity || 0)}</strong> gratis
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vista previa en tiempo real — siempre visible */}
                  {basePrice > 0 && newTier.type && (
                    <div className="p-3 sm:p-4 bg-surface-alt rounded-lg border border-origen-pradera/20 space-y-2">
                      <p className="text-xs font-medium text-origen-bosque">Vista previa del precio</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Precio normal:</span>
                        <span className="font-medium">{basePrice.toFixed(2)} €</span>
                      </div>

                      {newTier.type === 'percentage' && (newTier.value || 0) > 0 && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Precio con oferta:</span>
                            <span className="font-bold text-green-600">
                              {(basePrice * (1 - (newTier.value || 0) / 100)).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Ahorro por unidad:</span>
                            <span className="text-green-600 font-medium">{(basePrice * (newTier.value || 0) / 100).toFixed(2)} €</span>
                          </div>
                        </>
                      )}

                      {newTier.type === 'fixed' && (newTier.value || 0) > 0 && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Precio con oferta:</span>
                            <span className="font-bold text-green-600">{(newTier.value || 0).toFixed(2)} €</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Ahorro por unidad:</span>
                            <span className="text-green-600 font-medium">{Math.max(0, basePrice - (newTier.value || 0)).toFixed(2)} €</span>
                          </div>
                        </>
                      )}

                      {newTier.type === 'bundle' && (newTier.buyQuantity || 0) > (newTier.payQuantity || 0) && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Precio efectivo/ud:</span>
                            <span className="font-bold text-green-600">
                              {((basePrice * (newTier.payQuantity || 1)) / (newTier.buyQuantity || 1)).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Total pack ({newTier.buyQuantity} uds):</span>
                            <span className="font-medium">{(basePrice * (newTier.payQuantity || 1)).toFixed(2)} € (en lugar de {(basePrice * (newTier.buyQuantity || 1)).toFixed(2)} €)</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Error de validación */}
                  {validationError && (
                    <p className="text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      {validationError}
                    </p>
                  )}

                  {/* Botones */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="flex-1 sm:flex-none"
                      onClick={() => {
                        resetForm();
                        setShowTierForm(false);
                        setEditingTierId(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 sm:flex-none"
                      onClick={editingTierId ? handleUpdateTier : handleAddTier}
                      leftIcon={<Save className="w-4 h-4" />}
                    >
                      {editingTierId ? 'Actualizar' : 'Crear oferta'}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de ofertas — con botones ↑/↓ en lugar de drag */}
          {tiers.length > 0 && (
            <div className="space-y-3">
              <AnimatePresence>
                {tiers.map((tier, index) => {
                  const offerPrice = calculateOfferPrice(tier);
                  const savings = calculateSavings(tier);
                  const discount = calculateDiscountPercent(tier);

                  return (
                    <motion.div
                      key={tier.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 hover:shadow-origen transition-all"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icono del tipo */}
                        <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center shrink-0">
                          {tier.type === 'percentage' && <Percent className="w-5 h-5 text-origen-pradera" />}
                          {tier.type === 'fixed' && <DollarSign className="w-5 h-5 text-origen-hoja" />}
                          {tier.type === 'bundle' && <Gift className="w-5 h-5 text-amber-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-sm font-semibold text-origen-bosque">
                                  {getTierTitle(tier)}
                                </h4>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200 shrink-0">
                                  <Zap className="w-2.5 h-2.5" />
                                  -{discount.toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Desde {tier.minQuantity} {tier.minQuantity === 1 ? 'unidad' : 'unidades'}
                                {tier.maxQuantity && ` · hasta ${tier.maxQuantity}`}
                              </p>
                            </div>

                            {/* Acciones */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              {/* Reordenar */}
                              <div className="flex flex-col">
                                <button
                                  onClick={() => handleMoveTierUp(tier.id)}
                                  disabled={index === 0}
                                  className="p-1.5 rounded-md text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Subir"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleMoveTierDown(tier.id)}
                                  disabled={index === tiers.length - 1}
                                  className="p-1.5 rounded-md text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Bajar"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                onClick={() => handleEditTier(tier)}
                                className="p-2 rounded-md text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTier(tier.id)}
                                className="p-2 rounded-md text-text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Resumen de precios */}
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            <div className="p-2 bg-surface rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Normal</p>
                              <p className="text-sm font-medium">{basePrice.toFixed(2)} €</p>
                            </div>
                            <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                              <p className="text-[10px] text-muted-foreground">Oferta</p>
                              <p className="text-sm font-bold text-green-700">{offerPrice.toFixed(2)} €</p>
                            </div>
                            <div className="p-2 bg-amber-50 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Ahorro</p>
                              <p className="text-sm font-bold text-amber-700">{savings.toFixed(2)} €</p>
                            </div>
                          </div>

                          {tier.type === 'bundle' && (
                            <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                              {tier.buyQuantity! - tier.payQuantity!} unidad{((tier.buyQuantity! - tier.payQuantity!) !== 1) ? 'es' : ''} gratis
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Estado vacío */}
          {tiers.length === 0 && !showTierForm && (
            <div className="text-center py-8 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
              <Gift className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">Sin ofertas configuradas</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
                Las ofertas por cantidad ayudan a aumentar el ticket medio y fidelizar clientes
              </p>
              {hasBasePrice ? (
                <Button
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowTierForm(true)}
                  leftIcon={<Plus className="w-3 h-3" />}
                >
                  Crear primera oferta
                </Button>
              ) : (
                <div className="mt-4 text-xs text-amber-600">
                  Configura primero el precio de venta
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
