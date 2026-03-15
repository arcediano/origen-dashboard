/**
 * @page CreateProductPage
 * @description Página de creación de productos - VERSIÓN CON API MOCK
 */

'use client';

import React from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion'; // ← IMPORTAR Variants
import { Package, Sparkles, TrendingUp, Lightbulb } from 'lucide-react';

// Componentes UI
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { PageHeader } from '@/app/dashboard/components/PageHeader';

// Steps del formulario
import { StepBasic } from '@/app/dashboard/products/components/steps/StepBasic';
import { StepImages } from '@/app/dashboard/products/components/steps/StepImages';
import { StepPricing } from '@/app/dashboard/products/components/steps/StepPricing';
import { StepNutritional } from '@/app/dashboard/products/components/steps/StepNutritional';
import { StepProduction } from '@/app/dashboard/products/components/steps/StepProduction';
import { StepInventory } from '@/app/dashboard/products/components/steps/StepInventory';
import { StepCertificationsAttributes } from '@/app/dashboard/products/components/steps/StepCertificationsAttributes';

// Componentes de creación
import {
  CreateProductProgress,
  CreateProductNavigation,
  CreateProductCancelDialog,
  SuccessPublishModal,
} from '@/app/dashboard/products/components';

// Hooks y tipos
import { useProductForm } from '@/hooks/useProductForm';
import { FORM_STEPS, defaultNutritionalInfo, defaultProductionInfo, type FormStepId } from '@/types/product';

// ============================================================================
// HOOK PARA GENERAR CONSEJOS POR PASO
// ============================================================================

const useStepTips = (step: number, formData: any) => {
  const getTipsForStep = (): Array<{ description: string; category?: string }> => {
    switch (step) {
      case 1: // Información básica
        return [
          {
            description: 'Usa palabras clave que tus clientes buscarían',
          },
          {
            description: 'Incluye variedad, tiempo de curación o características únicas',
          },
          {
            description: formData?.shortDescription && formData.shortDescription.length < 100
              ? 'La descripción corta es lo primero que ven en búsquedas. La tuya es demasiado corta.'
              : 'La descripción corta es lo primero que ven en búsquedas',
          },
          {
            description: 'Las categorías ayudan a los clientes a encontrarte',
          },
        ];

      case 2: // Imágenes
        return [
          {
            description: 'Usa fondo blanco o neutro para la imagen principal',
          },
          {
            description: 'Muestra diferentes ángulos del producto',
          },
          {
            description: 'Incluye una foto del producto empaquetado',
          },
          {
            description: 'Las imágenes de alta calidad generan más confianza',
          },
        ];

      case 3: // Precios
        return [
          {
            description: 'El precio base debe incluir tu margen de beneficio',
          },
          {
            description: 'Las ofertas por cantidad animan a comprar más',
          },
          {
            description: 'El precio de referencia (tachado) crea sensación de ahorro',
          },
          {
            description: 'Revisa los precios de productos similares',
          },
        ];

      case 4: // Información nutricional
        return [
          {
            description: 'Indica siempre los alérgenos principales',
          },
          {
            description: 'Los valores por 100g/ml son el estándar',
          },
          {
            description: 'Incluye ingredientes en orden descendente',
          },
          {
            description: 'La información completa genera confianza',
          },
        ];

      case 5: // Producción
        return [
          {
            description: 'Comparte tu historia: conecta emocionalmente',
          },
          {
            description: 'Las fotos del proceso generan transparencia',
          },
          {
            description: 'Los vídeos cortos (30s) funcionan muy bien',
          },
          {
            description: 'Destaca métodos tradicionales o certificaciones',
          },
        ];

      case 6: // Inventario
        return [
          {
            description: 'Mantén el stock actualizado para evitar cancelaciones',
          },
          {
            description: 'El SKU te ayuda a organizar tu inventario interno',
          },
          {
            description: 'Activa el control de stock para recibir alertas',
          },
          {
            description: 'Pesa tus productos para calcular envíos correctamente',
          },
        ];

      case 7: // Certificaciones
        return [
          {
            description: 'Las certificaciones ecológicas generan confianza',
          },
          {
            description: 'Añade atributos específicos de tu producto',
          },
          {
            description: 'Los sellos de calidad diferencian tu producto',
          },
          {
            description: 'Los atributos dinámicos permiten personalización total',
          },
        ];

      default:
        return [];
    }
  };

  return getTipsForStep();
};

// ============================================================================
// ANIMACIONES CORREGIDAS
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1, 
      delayChildren: 0.2 
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    }
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function CreateProductPage() {
  const {
    // Estado del formulario
    formData,
    activeTab,
    setActiveTab,
    completedTabs,
    
    // Estados de UI
    isSaving,
    isAutoSaving,
    lastSaved,
    isPublishing,
    publishStatus,
    showCancelDialog,
    setShowCancelDialog,
    showSuccessModal,
    setShowSuccessModal,
    
    // Valores computados
    allStepsCompleted,
    hasCertifications,
    certificationsApproved,
    
    // Handlers
    handleInputChange,
    handleNestedChange,
    handlePriceTiersChange,
    handleImagesChange,
    handleSave,
    handlePublish,
    handleCancel,
  } = useProductForm();

  // Obtener tips para el paso actual
  const stepNumber = FORM_STEPS.findIndex(s => s.id === activeTab) + 1;
  const tips = useStepTips(stepNumber, formData);

  // Datos clave por paso
  const keyFactByStep: Record<number, string> = {
    1: 'Los productos con descripción completa tienen un 30% más de conversión',
    2: 'Los productos con 3+ imágenes tienen un 40% más de ventas',
    3: 'Las ofertas 3x2 aumentan el ticket medio un 25%',
    4: 'Los productos con información nutricional completa tienen un 40% más de confianza',
    5: 'Los productos con historia tienen un 50% más de reseñas positivas',
    6: 'El 15% de los pedidos cancelados son por falta de stock',
    7: 'Los productos con certificaciones tienen un 35% más de confianza',
  };

  // Función para manejar el cambio de tab con el tipo correcto
  const handleTabChange = (tab: FormStepId) => {
    setActiveTab(tab);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Elementos decorativos */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
      
      {/* Cabecera con PageHeader genérico */}
      <PageHeader
        title="Crear producto"
        description="Completa los pasos para publicar tu producto"
        badgeIcon={Package}
        badgeText="Nuevo producto"
        tooltip="Creación de producto"
        tooltipDetailed="Completa todos los pasos para publicar tu producto en el catálogo"
        showBackButton
        onBack={() => setShowCancelDialog(true)}
        actions={
          lastSaved && (
            <span className="text-xs text-gray-400">
              Último guardado: {lastSaved.toLocaleTimeString()}
            </span>
          )
        }
      />

      {/* Contenido principal */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <CreateProductProgress
          currentTab={activeTab}
          completedTabs={completedTabs}
          onTabChange={handleTabChange}
        />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mt-6"
        >
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -20 }}
              >
                {activeTab === 'basic' && (
                  <StepBasic
                    formData={formData}
                    errors={{}}
                    touched={{}}
                    onInputChange={handleInputChange}
                    completed={completedTabs.basic}
                  />
                )}

                {activeTab === 'images' && (
                  <StepImages
                    gallery={formData.gallery}
                    onImagesChange={handleImagesChange}
                    completed={completedTabs.images}
                  />
                )}

                {activeTab === 'pricing' && (
                  <StepPricing
                    formData={formData}
                    errors={{}}
                    touched={{}}
                    onInputChange={handleInputChange}
                    onPriceTiersChange={handlePriceTiersChange}
                    completed={completedTabs.pricing}
                  />
                )}

                {activeTab === 'nutritional' && (
                  <StepNutritional
                    nutritionalInfo={formData.nutritionalInfo || defaultNutritionalInfo}
                    onNestedChange={handleNestedChange}
                    completed={completedTabs.nutritional}
                  />
                )}

                {activeTab === 'production' && (
                  <StepProduction
                    productionInfo={formData.productionInfo || defaultProductionInfo}
                    onNestedChange={handleNestedChange}
                    completed={completedTabs.production}
                  />
                )}

                {activeTab === 'inventory' && (
                  <StepInventory
                    formData={formData}
                    onInputChange={handleInputChange}
                    onNestedChange={handleNestedChange}
                    completed={completedTabs.inventory}
                  />
                )}

                {activeTab === 'certifications' && (
                  <StepCertificationsAttributes
                    certifications={formData.certifications}
                    attributes={formData.attributes}
                    onCertificationsChange={(certs) => handleInputChange('certifications', certs)}
                    onAttributesChange={(attrs) => handleInputChange('attributes', attrs)}
                    completed={completedTabs.certifications}
                    productCategory={formData.categoryId}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <CreateProductNavigation
              currentTab={activeTab}
              onTabChange={handleTabChange}
              completedTabs={completedTabs}
              onSave={handleSave}
              isSaving={isSaving}
              allStepsCompleted={allStepsCompleted}
              hasCertifications={hasCertifications}
              certificationsApproved={certificationsApproved}
              onPublish={handlePublish}
              isPublishing={isPublishing}
              publishStatus={publishStatus}
            />
          </div>

          {/* Card de consejos */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-[calc(65px+140px+80px)]">
              <Card 
                variant="elevated" 
                hoverEffect="organic" 
                className="overflow-hidden border border-gray-200 shadow-sm"
              >
                <CardHeader spacing="md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-origen-pradera" />
                      </div>
                      <CardTitle size="sm">Consejos útiles</CardTitle>
                    </div>
                    <Badge variant="leaf" size="xs">
                      {tips.length} consejos
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent spacing="md">
                  <ul className="space-y-3">
                    {tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-origen-pradera" />
                        </div>
                        <span className="flex-1">{tip.description}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Dato clave con estadística */}
                  {keyFactByStep[stepNumber] && (
                    <div className="mt-4 p-3 bg-origen-crema/30 rounded-lg border border-origen-pradera/20">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-origen-pradera" />
                        <span className="text-xs font-medium text-origen-bosque">Dato clave</span>
                      </div>
                      <p className="text-xs text-gray-600">{keyFactByStep[stepNumber]}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Diálogo de cancelación */}
      <CreateProductCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancel}
      />

      {/* Modal de éxito al publicar */}
      <SuccessPublishModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        productName={formData.name || 'Producto'}
      />
    </div>
  );
}