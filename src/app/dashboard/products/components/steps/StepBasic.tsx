/**
 * @component StepBasic
 * @description Paso 1: Información básica del producto
 */

'use client';

import { StepShell } from './StepShell';
import { Input } from '@arcediano/ux-library';
import { Textarea } from '@arcediano/ux-library';
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
import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { SENSITIVE_FIELD_LABELS } from '@/lib/constants/sensitiveFields';
import { TextImproverCard } from './TextImproverCard';

// ============================================================================
// TIPOS
// ============================================================================

interface StepBasicProps {
  formData?: any;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onInputChange: (field: string, value: any) => void;
  completed?: boolean;
  /** Dentro de la pantalla de revisión del onboarding con IA: sin tarjeta ni cabecera propias. */
  embedded?: boolean;
  isPublishedProduct?: boolean;
  /** Clave de cupo del asistente de IA (creación: clave del borrador; edición: productId). */
  aiAssistKey?: string | null;
  /** Notifica que el asistente de IA ha consumido cupo en este producto. */
  onAiAssistUsed?: () => void;
  /** Edición de un producto existente: sin límite de cupo. */
  aiAssistUnlimited?: boolean;
}

// ============================================================================
// ESQUEMAS DE VALIDACIÓN
// ============================================================================

const BasicProductSchema = z.object({
  name: z.string()
    .min(5, 'Mínimo 5 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s\-_,.]+$/, 'Caracteres no válidos'),
  fullDescription: z.string()
    .min(100, 'Mínimo 100 caracteres')
    .max(3000, 'Máximo 3000 caracteres'),
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
  formData = { name: '', fullDescription: '', categoryId: '', subcategoryId: '' },
  errors = {},
  touched = {},
  onInputChange,
  completed,
  embedded = false,
  isPublishedProduct = false,
  aiAssistKey = null,
  onAiAssistUsed,
  aiAssistUnlimited = false,
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
    <StepShell embedded={embedded}>
        {!embedded && (
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
        )}

        {aiAssistKey && (
          <div className="mb-6">
            <TextImproverCard
              assistKey={aiAssistKey}
              current={{
                name: formData?.name,
                categoryName: formData?.categoryName,
                subcategoryName: formData?.subcategoryName,
                fullDescription: formData?.fullDescription,
              }}
              onApply={(proposal) => {
                handleChange('name', proposal.name);
                handleChange('fullDescription', proposal.fullDescription);
              }}
              onUsed={onAiAssistUsed}
              unlimited={aiAssistUnlimited}
            />
          </div>
        )}

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

          {/* Descripción detallada */}
          <div className="space-y-2">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Label htmlFor="full-desc" className="text-sm font-medium">
                  Descripción
                </Label>
                <span className="text-feedback-danger">*</span>
                {isPublishedProduct && (
                  <div className="p-2 -m-2">
                    <SensitiveFieldIndicator fieldName="fullDescription" />
                  </div>
                )}
              </div>
              <Textarea
                id="full-desc"
                tooltip="Es el texto que verán tus clientes y el que usan los buscadores. Incluye características, proceso de elaboración, historia, maridajes y usos recomendados. Mínimo 100 caracteres (recomendado 300)."
                value={formData?.fullDescription || ''}
                onChange={(e) => handleChange('fullDescription', e.target.value)}
                className="min-h-[140px]"
                placeholder="Describe tu producto: características, proceso de elaboración, maridajes, historia del productor..."
                maxLength={3000}
                showCharCount
                error={allTouched?.fullDescription ? errors?.fullDescription : undefined}
              />
            </div>
            {fullDescLength < 300 && fullDescLength > 0 && (
              <Badge variant="warning" size="sm" className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Recomendado mínimo 300 caracteres ({fullDescLength}/300)
              </Badge>
            )}
          </div>
        </div>
    </StepShell>
  );
}

