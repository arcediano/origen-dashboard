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
import { Label } from '@arcediano/ux-library';
import {
  Package,
  CheckCircle,
  Sparkles,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchCategoriesTree, type CategoryTree } from '@/lib/api/categories';
import { motion } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { SENSITIVE_FIELD_LABELS } from '@/lib/constants/sensitiveFields';

// ============================================================================
// TIPOS
// ============================================================================

interface StepBasicProps {
  formData?: any;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onInputChange: (field: string, value: any) => void;
  completed?: boolean;
  isPublishedProduct?: boolean;
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

// Helper para renderizar indicador de campo sensible
function SensitiveFieldIndicator({ fieldName }: { fieldName: string }) {
  const labels = SENSITIVE_FIELD_LABELS[fieldName];
  if (!labels) return null;

  return (
    <Tooltip
      content="Campo sensible"
      detailed="Editar este campo enviará el producto a revisión y lo ocultará del catálogo hasta que se apruebe."
      size="sm"
      className="[&_button]:text-feedback-warning [&_button:hover]:text-feedback-warning/80"
    />
  );
}

export function StepBasic({
  formData = { name: '', shortDescription: '', fullDescription: '', categoryId: '', subcategoryId: '', tags: [] },
  errors = {},
  touched = {},
  onInputChange,
  completed,
  isPublishedProduct = false,
}: StepBasicProps) {
  
  const [localTouched, setLocalTouched] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<CategoryTree[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const allTouched = { ...localTouched, ...touched };

  useEffect(() => {
    fetchCategoriesTree()
      .then((loadedCategories) => {
        setCategories(loadedCategories);
        if (loadedCategories.length === 0) {
          setCategoriesError('No hay categorias activas disponibles. Revisa el seed de categorias o la conectividad con el gateway.');
          return;
        }
        setCategoriesError(null);
      })
      .catch(() => {
        setCategories([]);
        setCategoriesError('No se pudieron cargar las categorias. Intenta recargar la pagina.');
      })
      .finally(() => setCategoriesLoading(false));
  }, []);

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
              completed ? "bg-origen-bosque text-white" : "bg-origen-pradera/10 text-origen-bosque"
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
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="product-name" className="text-sm font-medium">
                Nombre del producto
              </Label>
              <span className="text-feedback-danger">*</span>
              {isPublishedProduct && (
                <div className="p-2 -m-2">
                  <SensitiveFieldIndicator fieldName="name" />
                </div>
              )}
            </div>
            <Input
              id="product-name"
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
          </div>

          {/* Categoría y Subcategoría */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label className="text-sm font-medium">
                  Categoría
                </Label>
                <span className="text-feedback-danger">*</span>
                {isPublishedProduct && (
                  <div className="p-2 -m-2">
                    <SensitiveFieldIndicator fieldName="categoryId" />
                  </div>
                )}
              </div>
              <Select
                required
                value={categoriesLoading ? '' : (formData?.categoryId || '')}
                disabled={categoriesLoading}
                onValueChange={(value) => {
                  const cat = categories.find(c => c.id === value);
                  handleChange('categoryId', value);
                  handleChange('categoryName', cat?.name ?? '');
                  handleChange('subcategoryId', '');
                  handleChange('subcategoryName', '');
                }}
                error={allTouched?.categoryId ? errors?.categoryId : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    categoriesLoading
                      ? (formData?.categoryName || 'Cargando categorías...')
                      : 'Seleccionar categoría'
                  } />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon ? `${cat.icon} ${cat.name}` : cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(() => {
              const selectedCat = categories.find(c => c.id === formData?.categoryId);
              const subcategories = selectedCat?.children ?? [];
              return (
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label className="text-sm font-medium">
                      Subcategoría
                    </Label>
                    {isPublishedProduct && (
                      <div className="p-2 -m-2">
                        <SensitiveFieldIndicator fieldName="subcategoryId" />
                      </div>
                    )}
                  </div>
                  <Select
                    value={categoriesLoading ? '' : (formData?.subcategoryId || '')}
                    disabled={categoriesLoading || subcategories.length === 0}
                    onValueChange={(value) => {
                      const sub = subcategories.find(s => s.id === value);
                      handleChange('subcategoryId', value);
                      handleChange('subcategoryName', sub?.name ?? '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={
                        categoriesLoading
                          ? (formData?.subcategoryName || 'Cargando...')
                          : subcategories.length > 0
                            ? 'Seleccionar subcategoría (opcional)'
                            : 'Sin subcategorías'
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map(sub => (
                        <SelectItem key={sub.id} value={sub.id}>
                          {sub.icon ? `${sub.icon} ${sub.name}` : sub.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            })()}
          </div>

          {!categoriesLoading && categoriesError && (
            <Badge variant="warning" size="sm" className="inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {categoriesError}
            </Badge>
          )}

          {/* Descripción corta */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Label htmlFor="short-desc" className="text-sm font-medium">
                Descripción corta
              </Label>
              <span className="text-feedback-danger">*</span>
              {isPublishedProduct && (
                <div className="p-2 -m-2">
                  <SensitiveFieldIndicator fieldName="shortDescription" />
                </div>
              )}
            </div>
            <Textarea
              id="short-desc"
              required
              tooltip="Aparece en búsquedas y vista previa. Incluye los beneficios principales. Máximo 160 caracteres."
              value={formData?.shortDescription || ''}
              onChange={(e) => handleChange('shortDescription', e.target.value)}
              className="min-h-[80px]"
              placeholder="Describe tu producto en 2-3 líneas destacando sus características principales..."
              maxLength={160}
              showCharCount
              error={allTouched?.shortDescription ? errors?.shortDescription : undefined}
            />
          </div>

          {/* Descripción detallada */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="full-desc" className="text-sm font-medium">
                  Descripción detallada
                </Label>
                {isPublishedProduct && (
                  <div className="p-2 -m-2">
                    <SensitiveFieldIndicator fieldName="fullDescription" />
                  </div>
                )}
              </div>
              <Textarea
                id="full-desc"
                tooltip="Mejora el SEO y la conversión. Incluye características, proceso de elaboración, historia, maridajes y usos recomendados. Mínimo recomendado: 300 caracteres."
                value={formData?.fullDescription || ''}
                onChange={(e) => handleChange('fullDescription', e.target.value)}
                className="min-h-[100px]"
                placeholder="Describe tu producto con detalle: características, proceso de elaboración, maridajes, historia del productor..."
              />
            </div>
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

