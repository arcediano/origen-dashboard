/**
 * @component StepNutritional
 * @description Paso 4: Información nutricional
 */

'use client';

import { Button } from '@/components/ui/atoms/button';
import { Card } from '@/components/ui/atoms/card';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/atoms/select';
import { Checkbox } from '@/components/ui/atoms/checkbox';
import { Badge } from '@/components/ui/atoms/badge';
import { Tooltip } from '@/components/ui/atoms/tooltip';
import { 
  FlaskConical, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  Scale,
  Droplet,
  Wheat,
  Bean,
  Leaf,
  Sprout,
  Beef,
  Milk,
  Egg,
  Fish,
  Shell,
  Nut,
  Zap,
  Flame,
  Clock,
  Package,
  X,
  Award,
  AlertTriangle,
  FileText,
  Heart,
  Ban,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLERGENS } from '@/types/product';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import type { NutritionalInfo } from '@/types/product';

interface StepNutritionalProps {
  nutritionalInfo?: NutritionalInfo;
  onNestedChange: (section: string, field: string, value: any) => void;
  completed?: boolean;
}

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const NutritionalSchema = z.object({
  servingSizeValue: z.number().min(1, 'El tamaño de ración debe ser mayor que 0'),
  ingredients: z.array(z.string()).min(1, 'Debe incluir al menos un ingrediente'),
});

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const getAllergenIcon = (allergen: string) => {
  const icons: Record<string, any> = {
    'Gluten': Wheat,
    'Crustáceos': Shell,
    'Huevos': Egg,
    'Pescado': Fish,
    'Cacahuetes': Nut,
    'Soja': Bean,
    'Lácteos': Milk,
    'Frutos de cáscara': Nut,
    'Apio': Leaf,
    'Mostaza': Leaf,
    'Sésamo': Sprout,
    'Sulfitos': Droplet,
    'Altramuces': Bean,
    'Moluscos': Shell,
  };
  return icons[allergen] || AlertCircle;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StepNutritional({ 
  nutritionalInfo = {
    servingSize: '100g',
    servingSizeValue: 100,
    servingSizeUnit: 'g',
    vitamins: [],
    allergens: [],
    mayContain: [],
    ingredients: [],
    preparationInstructions: '',
    storageInstructions: '',
    isGlutenFree: false,
    isLactoseFree: false,
    isVegan: false,
    isVegetarian: false,
    isNutFree: false,
    isEggFree: false,
    isSoyFree: false,
  },
  onNestedChange,
  completed 
}: StepNutritionalProps) {
  
  const [ingredientInput, setIngredientInput] = useState('');
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState('basicos');

  // Validar si el paso está completo
  const hasRequiredFields = 
    nutritionalInfo.servingSizeValue > 0 && 
    nutritionalInfo.ingredients.length > 0;

  const isStepComplete = hasRequiredFields;

  const handleChange = (field: string, value: any) => {
    onNestedChange('nutritionalInfo', field, value);
    setTouched(prev => ({ ...prev, [field]: true }));
    
    if (field === 'servingSizeValue' && value <= 0) {
      setLocalErrors(prev => ({ ...prev, servingSizeValue: 'Debe ser mayor que 0' }));
    } else {
      setLocalErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      const newIngredients = [...(nutritionalInfo.ingredients || []), ingredientInput.trim()];
      handleChange('ingredients', newIngredients);
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    const newIngredients = nutritionalInfo.ingredients.filter((_, i) => i !== index);
    handleChange('ingredients', newIngredients);
  };

  const absenceOptions = [
    { id: 'isGlutenFree', label: 'Sin gluten', icon: <Ban className="w-4 h-4" /> },
    { id: 'isLactoseFree', label: 'Sin lactosa', icon: <Milk className="w-4 h-4" /> },
    { id: 'isVegan', label: 'Vegano', icon: <Sprout className="w-4 h-4" /> },
    { id: 'isVegetarian', label: 'Vegetariano', icon: <Leaf className="w-4 h-4" /> },
    { id: 'isNutFree', label: 'Sin frutos secos', icon: <Nut className="w-4 h-4" /> },
    { id: 'isEggFree', label: 'Sin huevo', icon: <Egg className="w-4 h-4" /> },
    { id: 'isSoyFree', label: 'Sin soja', icon: <Bean className="w-4 h-4" /> },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card variant="elevated" hoverEffect="organic" className="p-4 sm:p-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isStepComplete ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white" : "bg-origen-pradera/10 text-origen-hoja"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Información nutricional</h2>
              <p className="text-sm text-muted-foreground truncate">Obligatorio para productos alimenticios</p>
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
              Paso 4 de 8
            </Badge>
          </div>
        </div>

        {/* Pestañas de navegación */}
        <div className="mb-6 border-b border-border overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {[
              { id: 'basicos', label: 'Básicos', icon: <Scale className="w-4 h-4" /> },
              { id: 'nutrientes', label: 'Nutrientes', icon: <Beef className="w-4 h-4" /> },
              { id: 'alergenos', label: 'Alérgenos', icon: <AlertCircle className="w-4 h-4" /> },
              { id: 'ausencias', label: 'Ausencias', icon: <Ban className="w-4 h-4" /> },
              { id: 'ingredientes', label: 'Ingredientes', icon: <FileText className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium transition-colors relative flex items-center gap-2",
                  activeTab === tab.id 
                    ? 'text-origen-pradera border-b-2 border-origen-pradera' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* TAB 1: BÁSICOS */}
          {activeTab === 'basicos' && (
            <motion.div
              key="basicos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Tamaño de ración */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Tamaño de ración
                      <span className="text-red-500 ml-1">*</span>
                    </span>
                    <Tooltip 
                      content="Cantidad de referencia"
                      detailed="Indica la cantidad por ración. Normalmente 100g para sólidos y 100ml para líquidos."
                      size="sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={nutritionalInfo.servingSizeValue}
                      onChange={(e) => handleChange('servingSizeValue', parseFloat(e.target.value) || 100)}
                      className={cn(
                        "h-12 flex-1 rounded-xl",
                        (touched.servingSizeValue && localErrors.servingSizeValue) && "border-feedback-danger"
                      )}
                      min={1}
                      step={1}
                    />
                    <Select
                      value={nutritionalInfo.servingSizeUnit}
                      onValueChange={(v) => handleChange('servingSizeUnit', v as 'g' | 'ml')}
                    >
                      <SelectTrigger className="h-12 w-24 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Calorías (kcal)
                    </span>
                    <Tooltip 
                      content="Energía por ración"
                      size="sm"
                    />
                  </div>
                  <Input
                    type="number"
                    value={nutritionalInfo.calories || ''}
                    onChange={(e) => handleChange('calories', parseFloat(e.target.value) || undefined)}
                    className="h-12 rounded-xl"
                    placeholder="Ej: 250"
                    min={0}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: NUTRIENTES */}
          {activeTab === 'nutrientes' && (
            <motion.div
              key="nutrientes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Macros principales */}
              <div>
                <h3 className="text-sm font-medium text-origen-bosque mb-3">Macronutrientes (g)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Proteínas</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.protein || ''}
                      onChange={(e) => handleChange('protein', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Grasas totales</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.totalFat || ''}
                      onChange={(e) => handleChange('totalFat', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Carbohidratos</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.carbohydrates || ''}
                      onChange={(e) => handleChange('carbohydrates', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Desglose de grasas */}
              <div>
                <h3 className="text-sm font-medium text-origen-bosque mb-3">Desglose de grasas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Saturadas (g)</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.saturatedFat || ''}
                      onChange={(e) => handleChange('saturatedFat', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Trans (g)</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.transFat || ''}
                      onChange={(e) => handleChange('transFat', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Colesterol (mg)</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.cholesterol || ''}
                      onChange={(e) => handleChange('cholesterol', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>

              {/* Otros nutrientes */}
              <div>
                <h3 className="text-sm font-medium text-origen-bosque mb-3">Otros nutrientes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Fibra (g)</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.dietaryFiber || ''}
                      onChange={(e) => handleChange('dietaryFiber', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Azúcares (g)</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.sugars || ''}
                      onChange={(e) => handleChange('sugars', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Sodio (mg)</p>
                    <Input
                      type="number"
                      value={nutritionalInfo.sodium || ''}
                      onChange={(e) => handleChange('sodium', parseFloat(e.target.value) || undefined)}
                      className="h-11 rounded-xl"
                      placeholder="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ALÉRGENOS */}
          {activeTab === 'alergenos' && (
            <motion.div
              key="alergenos"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Contiene
                    </span>
                    <Tooltip 
                      content="Alérgenos presentes"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2 border border-border rounded-xl p-3">
                    {ALLERGENS.map(allergen => {
                      const Icon = getAllergenIcon(allergen);
                      return (
                        <label key={allergen} className="flex items-center gap-3 p-2 hover:bg-origen-crema/30 rounded-lg cursor-pointer">
                          <Checkbox
                            checked={nutritionalInfo.allergens.includes(allergen)}
                            onCheckedChange={(checked) => {
                              const updated = checked
                                ? [...nutritionalInfo.allergens, allergen]
                                : nutritionalInfo.allergens.filter((a: string) => a !== allergen);
                              handleChange('allergens', updated);
                            }}
                            className="data-[state=checked]:bg-origen-pradera"
                          />
                          <Icon className="w-4 h-4 text-text-subtle" />
                          <span className="text-sm">{allergen}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Puede contener
                    </span>
                    <Tooltip 
                      content="Trazas"
                      size="sm"
                    />
                  </div>
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-2 border border-border rounded-xl p-3">
                    {ALLERGENS.map(allergen => {
                      const Icon = getAllergenIcon(allergen);
                      return (
                        <label key={allergen} className="flex items-center gap-3 p-2 hover:bg-origen-crema/30 rounded-lg cursor-pointer">
                          <Checkbox
                            checked={nutritionalInfo.mayContain?.includes(allergen) || false}
                            onCheckedChange={(checked) => {
                              const current = nutritionalInfo.mayContain || [];
                              const updated = checked
                                ? [...current, allergen]
                                : current.filter((a: string) => a !== allergen);
                              handleChange('mayContain', updated);
                            }}
                            className="data-[state=checked]:bg-origen-pradera"
                          />
                          <Icon className="w-4 h-4 text-text-subtle" />
                          <span className="text-sm">{allergen}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: AUSENCIAS */}
          {activeTab === 'ausencias' && (
            <motion.div
              key="ausencias"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Ban className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    Declaraciones de ausencia
                  </span>
                  <Tooltip 
                    content="Indica qué alérgenos NO contiene"
                    detailed="Marca las casillas para indicar que el producto NO contiene estos alérgenos o es apto para estas dietas."
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {absenceOptions.map((option) => (
                    <div
                      key={option.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-origen-pradera/30 transition-all bg-surface-alt"
                    >
                      <Checkbox
                        id={option.id}
                        checked={nutritionalInfo[option.id as keyof NutritionalInfo] as boolean}
                        onCheckedChange={(checked) => handleChange(option.id, checked)}
                        className="data-[state=checked]:bg-origen-pradera"
                      />
                      <label htmlFor={option.id} className="flex items-center gap-2 flex-1 cursor-pointer">
                        <span className="text-origen-pradera">{option.icon}</span>
                        <span className="text-sm font-medium">{option.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Estas declaraciones aparecerán como badges en la ficha del producto, ayudando a clientes con necesidades específicas.
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 5: INGREDIENTES E INSTRUCCIONES */}
          {activeTab === 'ingredientes' && (
            <motion.div
              key="ingredientes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Ingredientes */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    Ingredientes
                    <span className="text-red-500 ml-1">*</span>
                  </span>
                  <Tooltip 
                    content="Lista en orden descendente"
                    size="sm"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      placeholder="Ej: Leche de oveja pasteurizada"
                      className="h-11 flex-1 rounded-xl"
                      onKeyDown={(e) => e.key === 'Enter' && addIngredient()}
                    />
                    <Button
                      onClick={addIngredient}
                      disabled={!ingredientInput.trim()}
                      className="shrink-0"
                    >
                      Añadir
                    </Button>
                  </div>

                  {nutritionalInfo.ingredients.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      <AnimatePresence>
                        {nutritionalInfo.ingredients.map((ingredient, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex items-center justify-between p-2 bg-origen-crema/30 rounded-lg"
                          >
                            <span className="text-sm truncate flex-1">{ingredient}</span>
                            <button
                              onClick={() => removeIngredient(index)}
                              className="text-text-subtle hover:text-red-600 shrink-0 ml-2"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
              </div>

              {/* Instrucciones */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Preparación
                    </span>
                    <Tooltip 
                      content="Cómo preparar el producto"
                      size="sm"
                    />
                  </div>
                  <Textarea
                    value={nutritionalInfo.preparationInstructions}
                    onChange={(e) => handleChange('preparationInstructions', e.target.value)}
                    className="min-h-[100px] rounded-xl p-3 text-sm"
                    placeholder="Ej: Servir a temperatura ambiente, maridar con vino tinto..."
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Conservación
                    </span>
                    <Tooltip 
                      content="Cómo conservar el producto"
                      size="sm"
                    />
                  </div>
                  <Textarea
                    value={nutritionalInfo.storageInstructions}
                    onChange={(e) => handleChange('storageInstructions', e.target.value)}
                    className="min-h-[100px] rounded-xl p-3 text-sm"
                    placeholder="Ej: Conservar en lugar fresco y seco, una vez abierto refrigerar..."
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Badge de información */}
        <div className="mt-6 flex items-center justify-center gap-2 p-3 bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5 rounded-lg border border-origen-pradera/20">
          <Heart className="h-4 w-4 text-origen-pradera" />
          <span className="text-xs text-muted-foreground">
            La información nutricional completa genera confianza en tus clientes
          </span>
        </div>
      </Card>
    </motion.div>
  );
}