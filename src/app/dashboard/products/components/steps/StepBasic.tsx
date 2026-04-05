/**
 * @component StepBasic
 * @description Paso 1: Información básica del producto
 */

'use client';

import { Card } from '@origen/ux-library';
import { Input } from '@origen/ux-library';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@origen/ux-library';
import { TagsInput } from '@/components/ui/atoms/tags-input';
import { Badge } from '@origen/ux-library';
import { Tooltip } from '@/components/ui/atoms/tooltip';
import { 
  Package, 
  CheckCircle, 
  Sparkles,
  AlertCircle,
  Type,
  AlignLeft,
  FolderTree,
  Tag,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRODUCT_CATEGORIES } from '@/types/product';
import { motion } from 'framer-motion';
import { useState, useCallback } from 'react';
import { z } from 'zod';

// ============================================================================
// TIPOS
// ============================================================================

interface StepBasicProps {
  formData?: any;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onInputChange: (field: string, value: any) => void;
  completed?: boolean;
}

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const BasicProductSchema = z.object({
  name: z.string()
    .min(5, 'Mínimo 5 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_,.]+$/, 'Caracteres no válidos'),
  shortDescription: z.string()
    .min(20, 'Mínimo 20 caracteres')
    .max(160, 'Máximo 160 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StepBasic({ 
  formData = { name: '', shortDescription: '', fullDescription: '', categoryId: '', subcategoryId: '', tags: [] },
  errors = {}, 
  touched = {}, 
  onInputChange,
  completed 
}: StepBasicProps) {
  
  const [localTouched, setLocalTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const allTouched = { ...localTouched, ...touched };

  const validateField = useCallback((field: string, value: any) => {
    try {
      const fieldSchema = BasicProductSchema.shape[field as keyof typeof BasicProductSchema.shape];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setValidationErrors(prev => ({ ...prev, [field]: '' }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationErrors(prev => ({ ...prev, [field]: error.errors[0]?.message || '' }));
      }
    }
  }, []);

  const handleChange = (field: string, value: any) => {
    onInputChange(field, value);
    validateField(field, value);
    setLocalTouched(prev => ({ ...prev, [field]: true }));
  };

  const fullDescLength = formData?.fullDescription?.length || 0;

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
              completed ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white" : "bg-origen-pradera/10 text-origen-hoja"
            )}>
              {completed ? <CheckCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Información básica</h2>
              <p className="text-sm text-muted-foreground truncate">Los datos esenciales de tu producto</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {completed ? (
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
              Paso 1 de 7
            </Badge>
          </div>
        </div>

        {/* Formulario */}
        <div className="space-y-6">
          {/* Nombre del producto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Nombre del producto
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip 
                content="Nombre claro y descriptivo"
                detailed="Incluye palabra clave principal, variedad y características únicas. Ejemplo: 'Queso Manchego Curado 12 meses' (no solo 'Queso')"
                size="sm"
              />
            </div>
            <Input
              value={formData?.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className={cn(
                "h-12 text-base w-full rounded-xl",
                (allTouched?.name && (errors?.name || validationErrors?.name)) && "border-feedback-danger"
              )}
              placeholder="Ej: Queso Manchego Curado 12 meses"
              maxLength={100}
              showCharCount
            />
            {allTouched?.name && (errors?.name || validationErrors?.name) && (
              <p className="text-xs text-red-600 mt-1">{errors?.name || validationErrors?.name}</p>
            )}
          </div>

          {/* Categoría y Subcategoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoría */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-origen-pradera" />
                <span className="text-sm font-medium text-foreground">
                  Categoría
                  <span className="text-red-500 ml-1">*</span>
                </span>
                <Tooltip 
                  content="Categoría principal del producto"
                  detailed="Selecciona la categoría más específica donde los clientes buscarán tu producto. Ejemplo: 'Quesos' en lugar de 'Alimentación'"
                  size="sm"
                />
              </div>
              <Select
                value={formData?.categoryId || ''}
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger className={cn(
                  "h-12 w-full rounded-xl",
                  (allTouched?.categoryId && errors?.categoryId) && "border-feedback-danger"
                )}>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2 py-1">
                        <span className="w-2 h-2 rounded-full bg-origen-pradera" />
                        <span>{cat.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {allTouched?.categoryId && errors?.categoryId && (
                <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>
              )}
            </div>

            {/* Subcategoría */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-origen-pradera" />
                <span className="text-sm font-medium text-foreground">
                  Subcategoría
                </span>
                <Tooltip 
                  content="Subcategoría para mayor precisión"
                  detailed="Ayuda a los clientes a encontrar tu producto más fácilmente. Ejemplos: 'Artesano', 'Ecológico', 'Premium'"
                  size="sm"
                />
              </div>
              <Select
                value={formData?.subcategoryId || ''}
                onValueChange={(value) => handleChange('subcategoryId', value)}
              >
                <SelectTrigger className="h-12 w-full rounded-xl">
                  <SelectValue placeholder="Seleccionar subcategoría (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artesano">Artesano</SelectItem>
                  <SelectItem value="ecologico">Ecológico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="tradicional">Tradicional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripción corta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlignLeft className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Descripción corta
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip 
                content="Descripción breve para listados"
                detailed="Aparece en búsquedas y vista previa. Máximo 160 caracteres. Incluye los beneficios principales y una llamada a la acción."
                size="sm"
              />
            </div>
            <Textarea
              value={formData?.shortDescription || ''}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className={cn(
                "min-h-[100px] text-base w-full rounded-xl p-4",
                (allTouched?.shortDescription && errors?.shortDescription) && "border-feedback-danger"
              )}
              placeholder="Describe tu producto en 2-3 líneas..."
              maxLength={160}
              showCharCount
            />
            {allTouched?.shortDescription && errors?.shortDescription && (
              <p className="text-xs text-red-600 mt-1">{errors.shortDescription}</p>
            )}
          </div>

          {/* Descripción larga */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Descripción detallada
              </span>
              <Tooltip 
                content="Descripción completa del producto"
                detailed="Mejora el SEO y la conversión. Incluye características, proceso de elaboración, historia del productor, maridajes y usos recomendados. Mínimo recomendado: 300 caracteres."
                size="sm"
              />
            </div>
            <div>
              <Textarea
                value={formData?.fullDescription || ''}
                onChange={(e) => handleChange('fullDescription', e.target.value)}
                className="min-h-[180px] text-base w-full rounded-xl p-4"
                placeholder="Describe tu producto con detalle: características, proceso de elaboración, maridajes, historia del productor..."
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2">
                <p className="text-sm text-text-subtle">{fullDescLength} caracteres</p>
                {fullDescLength < 300 && (
                  <Badge variant="warning" size="sm" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Recomendado +300
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                Etiquetas
              </span>
              <Tooltip 
                content="Etiquetas para mejorar la búsqueda"
                detailed="Pulsa Enter para añadir cada etiqueta. Incluye sinónimos, variedades, tipos y palabras clave relacionadas. Máximo 10 etiquetas. Ejemplo: 'curado', 'oveja', 'artesano', 'manchego'"
                size="sm"
              />
            </div>
            <TagsInput
              value={formData?.tags || []}
              onChange={(tags) => handleChange('tags', tags)}
              placeholder="Escribe y pulsa Enter..."
              maxTags={10}
              suggestions={[
                "artesano", "ecológico", "premiado", "tradicional", "gourmet",
                "kilómetro cero", "edición limitada", "familiar", "slow food"
              ]}
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}