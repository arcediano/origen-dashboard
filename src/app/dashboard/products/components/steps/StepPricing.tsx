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
  X,
  Edit2,
  Save,
  Eye,
  Zap,
  Trash2,
  Hash,
  Percent,
  GripVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useState, useEffect } from 'react';
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
  minQuantity: z.number().min(1, 'Mínimo 1 unidad'),
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
}, 'Valores de oferta no válidos');

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
  const [showPreview, setShowPreview] = useState(false);
  
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

  // Validar si el paso está completo
  const isStepComplete = hasBasePrice && basePrice > 0;

  // Actualizar tiers en formData cuando cambien
  useEffect(() => {
    onInputChange('priceTiers', tiers);
    if (onPriceTiersChange) {
      onPriceTiersChange(tiers);
    }
  }, [tiers, onInputChange, onPriceTiersChange]);

  // ============================================================================
  // FUNCIONES DE CÁLCULO
  // ============================================================================

  const calculateOfferPrice = (tier: PriceTier): number => {
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

  const calculateSavings = (tier: PriceTier): number => {
    if (!basePrice) return 0;
    const offerPrice = calculateOfferPrice(tier);
    return Math.max(0, basePrice - offerPrice);
  };

  const calculateDiscountPercent = (tier: PriceTier): number => {
    if (!basePrice) return 0;
    const savings = calculateSavings(tier);
    return (savings / basePrice) * 100;
  };

  const getTierLabel = (tier: Partial<PriceTier>): string => {
    switch (tier.type) {
      case 'percentage':
        return `${tier.value}% dto`;
      case 'fixed':
        return `${tier.value}€`;
      case 'bundle':
        return `${tier.buyQuantity}x${tier.payQuantity}`;
      default:
        return '';
    }
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
        label: getTierLabel(newTier),
      };
      
      tier.savings = calculateSavings(tier);
      
      setTiers([...tiers, tier]);
      resetForm();
      setShowTierForm(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0]?.message || 'Error de validación');
      }
    }
  };

  const handleUpdateTier = () => {
    if (!editingTierId) return;
    
    try {
      TierSchema.parse(newTier);
      
      const updatedTiers = tiers.map(tier => 
        tier.id === editingTierId 
          ? { 
              ...tier, 
              ...newTier,
              label: getTierLabel(newTier),
              savings: calculateSavings({ ...tier, ...newTier } as PriceTier)
            }
          : tier
      );
      
      setTiers(updatedTiers);
      resetForm();
      setShowTierForm(false);
      setEditingTierId(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.errors[0]?.message || 'Error de validación');
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
    setTiers(tiers.filter(t => t.id !== id));
  };

  const handleReorderTiers = (newOrder: PriceTier[]) => {
    setTiers(newOrder);
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
              Paso 3 de 8
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
                Precio base
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip 
                content="Precio de venta al público"
                detailed="Todos los descuentos se calculan sobre este valor. Debe ser mayor que 0."
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

          {/* Precio de referencia */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Precio de referencia
              </span>
              <Tooltip 
                content="Precio original para destacar el descuento"
                detailed="Debe ser mayor que el precio base para mostrar el ahorro. Ejemplo: PVP recomendado."
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

        {/* Descuento calculado */}
        {formData.comparePrice && formData.comparePrice > basePrice && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {Math.round(((formData.comparePrice - basePrice) / formData.comparePrice) * 100)}% de descuento respecto al precio de referencia
              </span>
            </div>
          </div>
        )}

        {/* Sección de ofertas */}
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

          {/* Mensaje si no hay precio base */}
          {!hasBasePrice && (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="w-4 h-4 mr-2" />
              Necesitas configurar un precio base antes de crear ofertas
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
                <div className="p-5 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20 mb-4">
                  <h4 className="text-sm font-medium text-origen-bosque mb-4">
                    {editingTierId ? 'Editar oferta' : 'Nueva oferta por cantidad'}
                  </h4>

                  {/* Selector de tipo */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                    {[
                      { id: 'percentage', icon: Percent, label: 'Porcentaje', desc: '% de descuento' },
                      { id: 'fixed', icon: DollarSign, label: 'Precio fijo', desc: 'Precio especial' },
                      { id: 'bundle', icon: Gift, label: 'Pack', desc: 'Lleva X paga Y' }
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setNewTier({ ...newTier, type: type.id as any })}
                        className={cn(
                          "flex flex-col items-center p-3 rounded-lg border-2 transition-all",
                          newTier.type === type.id
                            ? "border-origen-pradera bg-origen-pradera/5"
                            : "border-border hover:border-border bg-surface-alt"
                        )}
                      >
                        <type.icon className={cn(
                          "w-5 h-5 mb-1",
                          newTier.type === type.id ? "text-origen-pradera" : "text-text-subtle"
                        )} />
                        <span className="text-xs font-medium">{type.label}</span>
                        <span className="text-[10px] text-text-subtle hidden sm:block">{type.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* Campos según tipo */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-origen-pradera" />
                        Mínimo
                      </p>
                      <Input
                        type="number"
                        value={newTier.minQuantity}
                        onChange={(e) => setNewTier({ ...newTier, minQuantity: parseInt(e.target.value) || 1 })}
                        min={1}
                        className="h-10"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                        <Hash className="w-3 h-3 text-origen-pradera" />
                        Máximo
                      </p>
                      <Input
                        type="number"
                        value={newTier.maxQuantity || ''}
                        onChange={(e) => setNewTier({ ...newTier, maxQuantity: parseInt(e.target.value) || undefined })}
                        min={1}
                        className="h-10"
                        placeholder="Sin límite"
                      />
                    </div>

                    {newTier.type === 'percentage' && (
                      <div className="lg:col-span-2">
                        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                          <Percent className="w-3 h-3 text-origen-pradera" />
                          Descuento
                        </p>
                        <PercentageInput
                          value={newTier.value || 0}
                          onChange={(v) => setNewTier({ ...newTier, value: v })}
                          min={0.1}
                          max={100}
                          className="h-10"
                        />
                      </div>
                    )}

                    {newTier.type === 'fixed' && (
                      <div className="lg:col-span-2">
                        <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-origen-pradera" />
                          Precio oferta
                        </p>
                        <CurrencyInput
                          value={newTier.value || 0}
                          onChange={(v) => setNewTier({ ...newTier, value: v })}
                          min={0.01}
                          inputSize="md"
                          className="h-10"
                        />
                      </div>
                    )}

                    {newTier.type === 'bundle' && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <Package className="w-3 h-3 text-origen-pradera" />
                            Lleva
                          </p>
                          <Input
                            type="number"
                            value={newTier.buyQuantity}
                            onChange={(e) => setNewTier({ ...newTier, buyQuantity: parseInt(e.target.value) || 2 })}
                            min={2}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                            <Gift className="w-3 h-3 text-origen-pradera" />
                            Paga
                          </p>
                          <Input
                            type="number"
                            value={newTier.payQuantity}
                            onChange={(e) => setNewTier({ ...newTier, payQuantity: parseInt(e.target.value) || 1 })}
                            min={1}
                            className="h-10"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Vista previa en tiempo real */}
                  {basePrice > 0 && newTier.type && (
                    <div className="mt-4 p-4 bg-surface-alt rounded-lg border border-origen-pradera/20">
                      <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="flex items-center gap-2 text-xs font-medium text-origen-bosque mb-2"
                      >
                        <Eye className="w-4 h-4 text-origen-pradera" />
                        {showPreview ? 'Ocultar vista previa' : 'Ver vista previa'}
                      </button>
                      
                      <AnimatePresence>
                        {showPreview && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Precio base:</span>
                              <span className="font-medium">{basePrice.toFixed(2)} €</span>
                            </div>
                            
                            {newTier.type === 'percentage' && newTier.value && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Precio oferta:</span>
                                <span className="font-bold text-green-600">
                                  {(basePrice * (1 - newTier.value / 100)).toFixed(2)} €
                                </span>
                              </div>
                            )}
                            
                            {newTier.type === 'fixed' && newTier.value && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Precio oferta:</span>
                                <span className="font-bold text-green-600">
                                  {newTier.value.toFixed(2)} €
                                </span>
                              </div>
                            )}
                            
                            {newTier.type === 'bundle' && newTier.buyQuantity && newTier.payQuantity && (
                              <>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Precio por unidad:</span>
                                  <span className="font-bold text-green-600">
                                    {((basePrice * newTier.payQuantity) / newTier.buyQuantity).toFixed(2)} €
                                  </span>
                                </div>
                                <div className="p-2 bg-amber-50 rounded-lg text-xs text-amber-700">
                                  Llevas {newTier.buyQuantity}, pagas {newTier.payQuantity} 
                                  ({newTier.buyQuantity - newTier.payQuantity} gratis)
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Mensaje de error */}
                  {validationError && (
                    <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validationError}
                    </p>
                  )}

                  {/* Botones */}
                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="secondary"
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

          {/* Lista de ofertas */}
          {tiers.length > 0 && (
            <Reorder.Group
              axis="y"
              values={tiers}
              onReorder={handleReorderTiers}
              className="space-y-3"
            >
              <AnimatePresence>
                {tiers.map((tier) => {
                  const offerPrice = calculateOfferPrice(tier);
                  const savings = calculateSavings(tier);
                  const discount = calculateDiscountPercent(tier);
                  
                  return (
                    <Reorder.Item
                      key={tier.id}
                      value={tier}
                      className="relative"
                    >
                      <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-4 bg-surface-alt rounded-xl border border-border hover:border-origen-pradera/30 hover:shadow-origen transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center shrink-0">
                            {tier.type === 'percentage' && <Percent className="w-5 h-5 text-origen-pradera" />}
                            {tier.type === 'fixed' && <DollarSign className="w-5 h-5 text-origen-hoja" />}
                            {tier.type === 'bundle' && <Gift className="w-5 h-5 text-amber-500" />}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold text-origen-bosque">
                                    {tier.label}
                                  </h4>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-700 border border-green-200">
                                    <Zap className="w-2.5 h-2.5" />
                                    -{discount.toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Desde {tier.minQuantity} {tier.minQuantity === 1 ? 'unidad' : 'unidades'}
                                  {tier.maxQuantity && ` · hasta ${tier.maxQuantity}`}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleEditTier(tier)}
                                  className="p-1.5 rounded-md text-text-subtle hover:text-origen-pradera hover:bg-origen-pradera/10 transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTier(tier.id)}
                                  className="p-1.5 rounded-md text-text-subtle hover:text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <div className="p-2 bg-surface rounded-lg">
                                <p className="text-[10px] text-muted-foreground">Precio normal</p>
                                <p className="text-sm font-medium">{basePrice.toFixed(2)} €</p>
                              </div>
                              <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-[10px] text-muted-foreground">Oferta</p>
                                <p className="text-sm font-bold text-green-700">{offerPrice.toFixed(2)} €</p>
                              </div>
                              <div className="p-2 bg-amber-50 rounded-lg col-span-2 sm:col-span-1">
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

                        {/* Asa para arrastrar */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                          <GripVertical className="w-4 h-4 text-text-subtle" />
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  );
                })}
              </AnimatePresence>
            </Reorder.Group>
          )}

          {/* Estado vacío */}
          {tiers.length === 0 && !showTierForm && (
            <div className="text-center py-8 bg-origen-crema/20 rounded-xl border-2 border-dashed border-origen-pradera/30">
              <Gift className="w-12 h-12 text-origen-pradera/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No hay ofertas configuradas</p>
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
                  Configura primero el precio base
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}


