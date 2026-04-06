/**
 * @component StepBasic
 * @description Paso 1: Información básica del producto
 */

'use client';

import { Card } from '@arcediano/ux-library';
import { Input } from '@arcediano/ux-library';
import { Textarea, TagsInput } from '@arcediano/ux-library';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@arcediano/ux-library';
import { Badge } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Package,
  CheckCircle,
  Sparkles,
  AlertCircle,
  AlertTriangle,
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
      <Card variant="elevated" className="p-4 sm:p-6">
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
          <Input
            label="Nombre del producto"
            required
            tooltip="Incluye la palabra clave principal, variedad y características únicas. Ejemplo: 'Queso Manchego Curado 12 meses' (no solo 'Queso')"
            value={formData?.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            inputSize="lg"
            placeholder="Queso Manchego Curado 12 meses"
            maxLength={100}
            showCharCount
            error={allTouched?.name ? (errors?.name || validationErrors?.name) : undefined}
          />

          {/* Categoría y Subcategoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Categoría"
              required
              tooltip="Selecciona la categoría más específica donde los clientes buscarán tu producto. Ejemplo: 'Quesos' en lugar de 'Alimentación'"
              value={formData?.categoryId || ''}
              onValueChange={(value) => handleChange('categoryId', value)}
              error={allTouched?.categoryId ? errors?.categoryId : undefined}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_CATEGORIES.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              label="Subcategoría"
              tooltip="Ayuda a los clientes a encontrar tu producto más fácilmente. Ejemplos: 'Artesano', 'Ecológico', 'Premium'"
              value={formData?.subcategoryId || ''}
              onValueChange={(value) => handleChange('subcategoryId', value)}
            >
              <SelectTrigger>
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

          {/* Descripción corta */}
          <Textarea
            label="Descripción corta"
            required
            tooltip="Aparece en búsquedas y vista previa. Incluye los beneficios principales. Máximo 160 caracteres."
            value={formData?.shortDescription || ''}
            onChange={(e) => handleChange('shortDescription', e.target.value)}
            className="min-h-[100px]"
            placeholder="Describe tu producto en 2-3 líneas destacando sus características principales..."
            maxLength={160}
            showCharCount
            error={allTouched?.shortDescription ? errors?.shortDescription : undefined}
          />

          {/* Descripción detallada */}
          <div className="space-y-2">
            <Textarea
              label="Descripción detallada"
              tooltip="Mejora el SEO y la conversión. Incluye características, proceso de elaboración, historia, maridajes y usos recomendados. Mínimo recomendado: 300 caracteres."
              value={formData?.fullDescription || ''}
              onChange={(e) => handleChange('fullDescription', e.target.value)}
              className="min-h-[180px]"
              placeholder="Describe tu producto con detalle: características, proceso de elaboración, maridajes, historia del productor..."
            />
            {fullDescLength < 300 && fullDescLength > 0 && (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Recomendado mínimo 300 caracteres ({fullDescLength}/300)
              </Badge>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <TagsInput
              label="Etiquetas"
              tooltip="Pulsa Enter para añadir cada etiqueta. Incluye sinónimos, variedades y palabras clave. Máximo 10 etiquetas."
              value={formData?.tags || []}
              onChange={(tags) => handleChange('tags', tags)}
              placeholder="Escribe y pulsa Enter..."
              maxTags={10}
              suggestions={[
                "artesano", "ecológico", "premiado", "tradicional", "gourmet",
                "kilómetro cero", "edición limitada", "familiar", "slow food"
              ]}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

