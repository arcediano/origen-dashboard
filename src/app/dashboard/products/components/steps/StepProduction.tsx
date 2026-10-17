/**
 * @component StepProduction
 * @description Historia y producción
 */

'use client';

import { StepShell } from './StepShell';
import { Button, Input, Badge, DateInput, Label } from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { Tooltip } from '@arcediano/ux-library';
import {
  Card, CardHeader, CardTitle, CardContent,
  Textarea,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import { RichTextEditor } from '@arcediano/ux-library';
import {
  Leaf,
  CheckCircle,
  Sparkles,
  Heart,
  Sprout,
  AlertCircle,
  TreePine,
  Droplets,
  Sun,
  Wind,
  Package,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { ProductionInfo } from '@/types/product';
import { FORM_STEPS, stepPosition } from '@/types/product';
import { SENSITIVE_FIELD_LABELS } from '@/lib/constants/sensitiveFields';
import {
  AUTONOMOUS_COMMUNITY_CODES,
  AUTONOMOUS_COMMUNITY_NAMES,
  autonomousCommunityFlagSrc,
  type AutonomousCommunityCode,
} from '@/lib/constants/autonomous-community';

interface StepProductionProps {
  productionInfo?: ProductionInfo;
  onNestedChange: (section: string, field: string, value: any) => void;
  /** Comunidad autónoma de origen (petición del humano, 2026-10-17) -- campo de Product, no de productionInfo, por eso va aparte en vez de por onNestedChange. */
  originRegion?: AutonomousCommunityCode;
  onOriginRegionChange?: (value: AutonomousCommunityCode | undefined) => void;
  completed?: boolean;
  /** Dentro de la pantalla de revisión del onboarding con IA: sin tarjeta ni cabecera propias. */
  embedded?: boolean;
  isPublishedProduct?: boolean;
}

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

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const SUSTAINABLE_PRACTICES = [
  { id: 'renewable_energy', label: 'Energía renovable', icon: <Sun className="w-4 h-4" />, description: 'Uso de energía solar, eólica o hidráulica' },
  { id: 'water_conservation', label: 'Conservación de agua', icon: <Droplets className="w-4 h-4" />, description: 'Sistemas de riego eficiente, reutilización' },
  { id: 'zero_waste', label: 'Residuo cero', icon: <Sprout className="w-4 h-4" />, description: 'Aprovechamiento total de materiales' },
  { id: 'local_sourcing', label: 'Proveedores locales', icon: <MapPin className="w-4 h-4" />, description: 'Materias primas de proximidad' },
  { id: 'biodiversity', label: 'Biodiversidad', icon: <TreePine className="w-4 h-4" />, description: 'Protección de flora y fauna local' },
  { id: 'carbon_neutral', label: 'Carbono neutral', icon: <Wind className="w-4 h-4" />, description: 'Compensación de emisiones' },
  { id: 'recyclable_packaging', label: 'Embalaje reciclable', icon: <Package className="w-4 h-4" />, description: 'Envases sostenibles' },
  { id: 'fair_trade', label: 'Comercio justo', icon: <Heart className="w-4 h-4" />, description: 'Condiciones laborales éticas' },
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function StepProduction({
  productionInfo = {
    story: '',
    farmName: '',
    origin: '',
    productionMethod: '',
    harvestDate: undefined,
    productionDate: undefined,
    expiryDate: undefined,
    batchNumber: '',
    sustainabilityInfo: '',
    artisanProcess: '',
    practices: [],
    media: [],
  },
  onNestedChange,
  originRegion,
  onOriginRegionChange,
  completed,
  embedded = false,
  isPublishedProduct = false,
}: StepProductionProps) {
  
  const [activeTab, setActiveTab] = useState('story');
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar si el paso está completo
  const hasAnyContent = 
    productionInfo.story.trim() !== '' ||
    productionInfo.origin.trim() !== '' ||
    productionInfo.farmName.trim() !== '' ||
    productionInfo.practices.length > 0 ||
    productionInfo.media.length > 0;

  const isStepComplete = hasAnyContent;

  const handleChange = (field: string, value: any) => {
    onNestedChange('productionInfo', field, value);
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // ============================================================================
  // GESTIÓN DE PRÁCTICAS SOSTENIBLES
  // ============================================================================

  const handlePracticeToggle = (practiceId: string) => {
    const current = productionInfo.practices || [];
    const updated = current.includes(practiceId)
      ? current.filter((p: string) => p !== practiceId)
      : [...current, practiceId];
    handleChange('practices', updated);
  };

  return (
    <StepShell embedded={embedded}>
        {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              isStepComplete ? "bg-origen-bosque text-white" : "bg-origen-pradera/10 text-origen-bosque"
            )}>
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Leaf className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Historia y producción</h2>
              <p className="text-sm text-muted-foreground truncate">Comparte el origen y proceso de tu producto</p>
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
              Paso {stepPosition('production')} de {FORM_STEPS.length}
            </Badge>
          </div>
        </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* Pestañas de navegación — degradado a la derecha como pista de que
              hay más pestañas fuera de pantalla en móvil */}
          <div className="relative mb-6">
            <div className="overflow-x-auto">
              <TabsList className="min-w-max">
                {[
                  { id: 'story', label: 'Historia', icon: <BookOpen className="w-4 h-4" /> },
                  { id: 'origin', label: 'Origen', icon: <MapPin className="w-4 h-4" /> },
                  { id: 'sustainability', label: 'Sostenibilidad', icon: <TreePine className="w-4 h-4" /> },
                ].map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-white to-transparent sm:hidden" aria-hidden="true" />
          </div>

          {/* TAB HISTORIA */}
          <TabsContent value="story" className="space-y-6">
              <RichTextEditor
                label="Proceso artesanal"
                tooltip="Describe las técnicas tradicionales, detalles del proceso, tiempos de maduracion."
                value={productionInfo.artisanProcess}
                onChange={(html) => handleChange('artisanProcess', html)}
                placeholder="Técnicas tradicionales, detalles del proceso, tiempos de maduracion..."
                minHeight="100px"
              />

              <RichTextEditor
                label="Metodo de produccion"
                tooltip="Describe el proceso tecnico de produccion de tu producto."
                value={productionInfo.productionMethod}
                onChange={(html) => handleChange('productionMethod', html)}
                placeholder="Proceso de elaboracion, tecnicas y tiempos: fermentacion, maduracion..."
                minHeight="100px"
              />
          </TabsContent>

          {/* TAB ORIGEN */}
          <TabsContent value="origin" className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label className="text-sm font-medium">
                      País de origen
                    </Label>
                    {isPublishedProduct && (
                      <div className="p-2 -m-2">
                        <SensitiveFieldIndicator fieldName="origin" />
                      </div>
                    )}
                  </div>
                  <Input
                    value={productionInfo.origin}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    inputSize="lg"
                    placeholder="España"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label className="text-sm font-medium">
                      Comunidad autónoma
                    </Label>
                  </div>
                  <Select
                    value={originRegion ?? ''}
                    onValueChange={(value) =>
                      onOriginRegionChange?.(value ? (value as AutonomousCommunityCode) : undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar comunidad autónoma">
                        {originRegion && (
                          <span className="flex items-center gap-2">
                            <img
                              src={autonomousCommunityFlagSrc(originRegion)}
                              alt=""
                              className="h-4 w-6 rounded-sm object-cover shrink-0"
                            />
                            {AUTONOMOUS_COMMUNITY_NAMES[originRegion]}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AUTONOMOUS_COMMUNITY_CODES.map((code) => (
                        <SelectItem key={code} value={code}>
                          <span className="flex items-center gap-2">
                            <img
                              src={autonomousCommunityFlagSrc(code)}
                              alt=""
                              className="h-4 w-6 rounded-sm object-cover shrink-0"
                            />
                            {AUTONOMOUS_COMMUNITY_NAMES[code]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label className="text-sm font-medium">
                      Fecha de cosecha
                    </Label>
                    {isPublishedProduct && (
                      <div className="p-2 -m-2">
                        <SensitiveFieldIndicator fieldName="harvestDate" />
                      </div>
                    )}
                  </div>
                  <DateInput
                    value={productionInfo.harvestDate ? new Date(productionInfo.harvestDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('harvestDate', e.target.value ? new Date(e.target.value) : undefined)}
                    inputSize="md"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label className="text-sm font-medium">
                      Fecha de producción
                    </Label>
                    {isPublishedProduct && (
                      <div className="p-2 -m-2">
                        <SensitiveFieldIndicator fieldName="productionDate" />
                      </div>
                    )}
                  </div>
                  <DateInput
                    value={productionInfo.productionDate ? new Date(productionInfo.productionDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('productionDate', e.target.value ? new Date(e.target.value) : undefined)}
                    inputSize="md"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Label className="text-sm font-medium">
                      Fecha de caducidad
                    </Label>
                    {isPublishedProduct && (
                      <div className="p-2 -m-2">
                        <SensitiveFieldIndicator fieldName="expiryDate" />
                      </div>
                    )}
                  </div>
                  <DateInput
                    value={productionInfo.expiryDate ? new Date(productionInfo.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('expiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                    inputSize="md"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Package className="h-5 w-5 text-hoja-tinta" />
                  <Label className="text-sm font-medium">
                    Número de lote
                  </Label>
                  {isPublishedProduct && (
                    <div className="p-2 -m-2">
                      <SensitiveFieldIndicator fieldName="batchNumber" />
                    </div>
                  )}
                  <Tooltip
                    content="Para trazabilidad"
                    size="sm"
                  />
                </div>
                <Input
                  value={productionInfo.batchNumber}
                  onChange={(e) => handleChange('batchNumber', e.target.value)}
                  placeholder="Ej: LOTE-2024-001"
                  className="h-12 rounded-xl"
                />
              </div>
          </TabsContent>

          {/* TAB SOSTENIBILIDAD */}
          <TabsContent value="sustainability" className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-hoja-tinta" />
                  <span className="text-sm font-medium text-foreground">
                    Prácticas sostenibles
                  </span>
                  <Tooltip 
                    content="Selecciona las prácticas que aplicas"
                    detailed="Las prácticas sostenibles aumentan la confianza de los consumidores y mejoran el posicionamiento."
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  {SUSTAINABLE_PRACTICES.map(practice => (
                    <div
                      key={practice.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-origen-pradera/30 transition-all bg-surface-alt"
                      onMouseEnter={() => setSelectedPractice(practice.id)}
                      onMouseLeave={() => setSelectedPractice(null)}
                    >
                      <Checkbox
                        id={practice.id}
                        checked={productionInfo.practices?.includes(practice.id) || false}
                        onCheckedChange={() => handlePracticeToggle(practice.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={practice.id} className="flex items-center gap-2 cursor-pointer">
                          <span className="text-hoja-tinta">{practice.icon}</span>
                          <span className="text-sm font-medium">{practice.label}</span>
                        </label>
                        <AnimatePresence>
                          {selectedPractice === practice.id && (
                            <motion.p
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="text-xs text-muted-foreground mt-1"
                            >
                              {practice.description}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Textarea
                label="Información de sostenibilidad"
                value={productionInfo.sustainabilityInfo}
                onChange={(e) => handleChange('sustainabilityInfo', e.target.value)}
                className="min-h-[100px]"
                placeholder="Energía renovable, gestión de residuos, huella de carbono, certificaciones ambientales..."
              />
          </TabsContent>

        </Tabs>
    </StepShell>
  );
}

