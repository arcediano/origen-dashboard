/**
 * @component StepBasic
 * @description Paso 1: InformaciÃ³n bÃ¡sica del producto
 */

'use client';

import { Card } from '@origen/ux-library';
import { Input } from '@origen/ux-library';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@origen/ux-library';
import { TagsInput } from '@/components/ui/atoms/tags-input';
import { Badge } from '@origen/ux-library';
import { Tooltip } from '@origen/ux-library';
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
// ESQUEMAS DE VALIDACIÃ“N
// ============================================================================

const BasicProductSchema = z.object({
  name: z.string()
    .min(5, 'MÃ­nimo 5 caracteres')
    .max(100, 'MÃ¡ximo 100 caracteres')
    .regex(/^[a-zA-Z0-9Ã¡Ã©Ã­Ã³ÃºÃÃ‰ÃÃ“ÃšÃ±Ã‘\s\-_,.]+$/, 'Caracteres no vÃ¡lidos'),
  shortDescription: z.string()
    .min(20, 'MÃ­nimo 20 caracteres')
    .max(160, 'MÃ¡ximo 160 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categorÃ­a'),
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
              <h2 className="text-lg font-semibold text-origen-bosque truncate">InformaciÃ³n bÃ¡sica</h2>
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
                detailed="Incluye palabra clave principal, variedad y caracterÃ­sticas Ãºnicas. Ejemplo: 'Queso Manchego Curado 12 meses' (no solo 'Queso')"
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

          {/* CategorÃ­a y SubcategorÃ­a */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CategorÃ­a */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-origen-pradera" />
                <span className="text-sm font-medium text-foreground">
                  CategorÃ­a
                  <span className="text-red-500 ml-1">*</span>
                </span>
                <Tooltip 
                  content="CategorÃ­a principal del producto"
                  detailed="Selecciona la categorÃ­a mÃ¡s especÃ­fica donde los clientes buscarÃ¡n tu producto. Ejemplo: 'Quesos' en lugar de 'AlimentaciÃ³n'"
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
                  <SelectValue placeholder="Seleccionar categorÃ­a" />
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

            {/* SubcategorÃ­a */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-origen-pradera" />
                <span className="text-sm font-medium text-foreground">
                  SubcategorÃ­a
                </span>
                <Tooltip 
                  content="SubcategorÃ­a para mayor precisiÃ³n"
                  detailed="Ayuda a los clientes a encontrar tu producto mÃ¡s fÃ¡cilmente. Ejemplos: 'Artesano', 'EcolÃ³gico', 'Premium'"
                  size="sm"
                />
              </div>
              <Select
                value={formData?.subcategoryId || ''}
                onValueChange={(value) => handleChange('subcategoryId', value)}
              >
                <SelectTrigger className="h-12 w-full rounded-xl">
                  <SelectValue placeholder="Seleccionar subcategorÃ­a (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artesano">Artesano</SelectItem>
                  <SelectItem value="ecologico">EcolÃ³gico</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="tradicional">Tradicional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* DescripciÃ³n corta */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlignLeft className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                DescripciÃ³n corta
                <span className="text-red-500 ml-1">*</span>
              </span>
              <Tooltip 
                content="DescripciÃ³n breve para listados"
                detailed="Aparece en bÃºsquedas y vista previa. MÃ¡ximo 160 caracteres. Incluye los beneficios principales y una llamada a la acciÃ³n."
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
              placeholder="Describe tu producto en 2-3 lÃ­neas..."
              maxLength={160}
              showCharCount
            />
            {allTouched?.shortDescription && errors?.shortDescription && (
              <p className="text-xs text-red-600 mt-1">{errors.shortDescription}</p>
            )}
          </div>

          {/* DescripciÃ³n larga */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-origen-pradera" />
              <span className="text-sm font-medium text-foreground">
                DescripciÃ³n detallada
              </span>
              <Tooltip 
                content="DescripciÃ³n completa del producto"
                detailed="Mejora el SEO y la conversiÃ³n. Incluye caracterÃ­sticas, proceso de elaboraciÃ³n, historia del productor, maridajes y usos recomendados. MÃ­nimo recomendado: 300 caracteres."
                size="sm"
              />
            </div>
            <div>
              <Textarea
                value={formData?.fullDescription || ''}
                onChange={(e) => handleChange('fullDescription', e.target.value)}
                className="min-h-[180px] text-base w-full rounded-xl p-4"
                placeholder="Describe tu producto con detalle: caracterÃ­sticas, proceso de elaboraciÃ³n, maridajes, historia del productor..."
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
                content="Etiquetas para mejorar la bÃºsqueda"
                detailed="Pulsa Enter para aÃ±adir cada etiqueta. Incluye sinÃ³nimos, variedades, tipos y palabras clave relacionadas. MÃ¡ximo 10 etiquetas. Ejemplo: 'curado', 'oveja', 'artesano', 'manchego'"
                size="sm"
              />
            </div>
            <TagsInput
              value={formData?.tags || []}
              onChange={(tags) => handleChange('tags', tags)}
              placeholder="Escribe y pulsa Enter..."
              maxTags={10}
              suggestions={[
                "artesano", "ecolÃ³gico", "premiado", "tradicional", "gourmet",
                "kilÃ³metro cero", "ediciÃ³n limitada", "familiar", "slow food"
              ]}
              className="w-full"
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
