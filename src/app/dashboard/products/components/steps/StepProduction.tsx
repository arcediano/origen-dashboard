/**
 * @component StepProduction
 * @description Paso 5: Historia y producciÃ³n - VERSIÃ“N CORREGIDA
 */

'use client';

import { Button, Input, Badge } from '@arcediano/ux-library';
import { Checkbox } from '@arcediano/ux-library';
import { ImageUploader } from '../../components/ImageUploader';
import { Tooltip } from '@arcediano/ux-library';
import {
  Card, CardHeader, CardTitle, CardContent,
  Textarea,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@arcediano/ux-library';
import { 
  Leaf, 
  MapPin, 
  Camera, 
  CheckCircle,
  Sparkles,
  Heart,
  Sprout,
  AlertCircle,
  Clock,
  TreePine,
  Droplets,
  Sun,
  Wind,
  Package,
  Award,
  Globe,
  BookOpen,
  Calendar,
  Film,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { ProductionInfo, ProductionMedia } from '@/types/product';
import type { ProductImage } from '@/types/product';

interface StepProductionProps {
  productionInfo?: ProductionInfo;
  onNestedChange: (section: string, field: string, value: any) => void;
  completed?: boolean;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const SUSTAINABLE_PRACTICES = [
  { id: 'renewable_energy', label: 'EnergÃ­a renovable', icon: <Sun className="w-4 h-4" />, description: 'Uso de energÃ­a solar, eÃ³lica o hidrÃ¡ulica' },
  { id: 'water_conservation', label: 'ConservaciÃ³n de agua', icon: <Droplets className="w-4 h-4" />, description: 'Sistemas de riego eficiente, reutilizaciÃ³n' },
  { id: 'zero_waste', label: 'Residuo cero', icon: <Sprout className="w-4 h-4" />, description: 'Aprovechamiento total de materiales' },
  { id: 'local_sourcing', label: 'Proveedores locales', icon: <MapPin className="w-4 h-4" />, description: 'Materias primas de proximidad' },
  { id: 'biodiversity', label: 'Biodiversidad', icon: <TreePine className="w-4 h-4" />, description: 'ProtecciÃ³n de flora y fauna local' },
  { id: 'carbon_neutral', label: 'Carbono neutral', icon: <Wind className="w-4 h-4" />, description: 'CompensaciÃ³n de emisiones' },
  { id: 'recyclable_packaging', label: 'Embalaje reciclable', icon: <Package className="w-4 h-4" />, description: 'Envases sostenibles' },
  { id: 'fair_trade', label: 'Comercio justo', icon: <Heart className="w-4 h-4" />, description: 'Condiciones laborales Ã©ticas' },
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
    animalWelfare: '',
    artisanProcess: '',
    practices: [],
    media: [],
  },
  onNestedChange,
  completed 
}: StepProductionProps) {
  
  const [activeTab, setActiveTab] = useState('story');
  const [mediaItems, setMediaItems] = useState<ProductionMedia[]>(productionInfo.media || []);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Validar si el paso estÃ¡ completo
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
  // GESTIÃ“N DE MEDIOS - CORREGIDO
  // ============================================================================

  /**
   * Convierte ProductionMedia a ProductImage para el ImageUploader
   */
  const productionMediaToProductImages = (media: ProductionMedia[]): ProductImage[] => {
    return media
      .filter(m => m.type === 'image') // Solo imÃ¡genes, no vÃ­deos
      .map(m => ({
        id: m.id,
        url: m.url,
        alt: m.alt,
        caption: m.caption,
        isMain: false, // Las imÃ¡genes de producciÃ³n nunca son principales
        sortOrder: m.sortOrder || 0,
        file: m.file || null,
        uploading: m.uploading,
        progress: m.progress,
        error: m.error,
        width: m.width,
        height: m.height,
        size: m.size,
        type: 'image/jpeg', // AproximaciÃ³n, podrÃ­as mejorarlo
      }));
  };

  /**
   * Maneja el cambio de imÃ¡genes desde ImageUploader
   */
  const handleMediaChange = (files: ProductImage[]) => {
    // Convertir ProductImage a ProductionMedia
    const media: ProductionMedia[] = files.map(file => ({
      id: file.id,
      type: 'image',
      url: file.url,
      preview: file.url,
      thumbnail: file.url,
      file: file.file,
      sortOrder: file.sortOrder,
      caption: file.caption,
      width: file.width,
      height: file.height,
      size: file.size,
      uploading: file.uploading,
      error: file.error,
      alt: file.alt,
    }));
    
    // Mantener los vÃ­deos existentes
    const existingVideos = mediaItems.filter(m => m.type === 'video');
    const updatedMedia = [...media, ...existingVideos];
    
    setMediaItems(updatedMedia);
    handleChange('media', updatedMedia);
  };

  /**
   * AÃ±ade un vÃ­deo desde URL
   */
  const handleVideoAdd = () => {
    setVideoError(null);

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/.+$/;

    if (!youtubeRegex.test(videoUrl) && !vimeoRegex.test(videoUrl)) {
      setVideoError('Solo se aceptan URLs de YouTube o Vimeo');
      return;
    }

    let thumbnail = '';
    if (youtubeRegex.test(videoUrl)) {
      const videoId = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }

    const newMedia: ProductionMedia = {
      id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: 'video',
      url: videoUrl,
      preview: thumbnail || videoUrl,
      thumbnail,
      file: null,
      sortOrder: mediaItems.length,
    };

    const updated = [...mediaItems, newMedia];
    setMediaItems(updated);
    handleChange('media', updated);
    setVideoUrl('');
    setShowVideoInput(false);
  };

  /**
   * Elimina un medio (imagen o vÃ­deo)
   */
  const handleRemoveMedia = (id: string) => {
    const mediaToRemove = mediaItems.find(m => m.id === id);
    if (mediaToRemove?.preview && mediaToRemove.type === 'image' && mediaToRemove.file) {
      URL.revokeObjectURL(mediaToRemove.preview);
    }
    
    const updated = mediaItems.filter(m => m.id !== id).map((m, i) => ({ ...m, sortOrder: i }));
    setMediaItems(updated);
    handleChange('media', updated);
  };

  // ============================================================================
  // GESTIÃ“N DE PRÃCTICAS SOSTENIBLES
  // ============================================================================

  const handlePracticeToggle = (practiceId: string) => {
    const current = productionInfo.practices || [];
    const updated = current.includes(practiceId)
      ? current.filter((p: string) => p !== practiceId)
      : [...current, practiceId];
    handleChange('practices', updated);
  };

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
              {isStepComplete ? <CheckCircle className="w-5 h-5" /> : <Leaf className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-origen-bosque truncate">Historia y producciÃ³n</h2>
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
              Paso 5 de 8
            </Badge>
          </div>
        </div>

        {/* PestaÃ±as de navegaciÃ³n */}
        <div className="mb-6 border-b border-border overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            {[
              { id: 'story', label: 'Historia', icon: <BookOpen className="w-4 h-4" /> },
              { id: 'origin', label: 'Origen', icon: <MapPin className="w-4 h-4" /> },
              { id: 'sustainability', label: 'Sostenibilidad', icon: <TreePine className="w-4 h-4" /> },
              { id: 'media', label: 'GalerÃ­a', icon: <Camera className="w-4 h-4" /> },
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
          {/* TAB HISTORIA */}
          {activeTab === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    Historia del productor
                  </span>
                  <Tooltip 
                    content="Comparte la historia detrÃ¡s de tu producto"
                    detailed="Las historias autÃ©nticas conectan con los clientes. Incluye tradiciÃ³n familiar, mÃ©todos artesanales, pasiÃ³n por la calidad."
                    size="sm"
                  />
                </div>
                <Textarea
                  value={productionInfo.story}
                  onChange={(e) => handleChange('story', e.target.value)}
                  className="min-h-[120px] text-base w-full rounded-xl p-4"
                  placeholder="Comparte la historia detrÃ¡s de este producto: tradiciÃ³n familiar, mÃ©todos artesanales, pasiÃ³n por la calidad, el origen de los ingredientes..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    Proceso artesanal
                  </span>
                  <Tooltip 
                    content="Describe el proceso artesanal"
                    detailed="Describe las tÃ©cnicas tradicionales, detalles del proceso, tiempos de maduraciÃ³n que hacen Ãºnico tu producto."
                    size="sm"
                  />
                </div>
                <Textarea
                  value={productionInfo.artisanProcess}
                  onChange={(e) => handleChange('artisanProcess', e.target.value)}
                  className="min-h-[100px] text-base w-full rounded-xl p-4"
                  placeholder="Describe las tÃ©cnicas tradicionales, detalles del proceso, tiempos de maduraciÃ³n..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    Bienestar animal
                  </span>
                  <Tooltip 
                    content="InformaciÃ³n sobre bienestar animal"
                    detailed="Si tu producto es de origen animal, indica las condiciones de crÃ­a, alimentaciÃ³n y cuidados."
                    size="sm"
                  />
                </div>
                <Textarea
                  value={productionInfo.animalWelfare}
                  onChange={(e) => handleChange('animalWelfare', e.target.value)}
                  className="min-h-[100px] text-base w-full rounded-xl p-4"
                  placeholder="Ej: CrÃ­a en libertad, alimentaciÃ³n natural, sin antibiÃ³ticos, pastoreo tradicional..."
                />
              </div>
            </motion.div>
          )}

          {/* TAB ORIGEN */}
          {activeTab === 'origin' && (
            <motion.div
              key="origin"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      PaÃ­s
                    </span>
                    <Tooltip 
                      content="PaÃ­s de origen"
                      size="sm"
                    />
                  </div>
                  <Input
                    value={productionInfo.origin}
                    onChange={(e) => handleChange('origin', e.target.value)}
                    placeholder="Ej: EspaÃ±a"
                    className="h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-origen-pradera" />
                    <span className="text-sm font-medium text-foreground">
                      Finca / Taller
                    </span>
                    <Tooltip 
                      content="Nombre de la finca o taller"
                      size="sm"
                    />
                  </div>
                  <Input
                    value={productionInfo.farmName}
                    onChange={(e) => handleChange('farmName', e.target.value)}
                    placeholder="Ej: Finca El Valle"
                    className="h-12 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    MÃ©todo de producciÃ³n
                  </span>
                  <Tooltip 
                    content="MÃ©todo de elaboraciÃ³n"
                    size="sm"
                  />
                </div>
                <Select
                  value={productionInfo.productionMethod}
                  onValueChange={(v) => handleChange('productionMethod', v)}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Seleccionar mÃ©todo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="artesanal">Artesanal</SelectItem>
                    <SelectItem value="tradicional">Tradicional</SelectItem>
                    <SelectItem value="ecologico">EcolÃ³gico</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-origen-pradera" />
                    Fecha cosecha
                  </p>
                  <Input
                    type="date"
                    value={productionInfo.harvestDate ? new Date(productionInfo.harvestDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('harvestDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-origen-pradera" />
                    Fecha producciÃ³n
                  </p>
                  <Input
                    type="date"
                    value={productionInfo.productionDate ? new Date(productionInfo.productionDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('productionDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-origen-pradera" />
                    Fecha caducidad
                  </p>
                  <Input
                    type="date"
                    value={productionInfo.expiryDate ? new Date(productionInfo.expiryDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('expiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    NÃºmero de lote
                  </span>
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
            </motion.div>
          )}

          {/* TAB SOSTENIBILIDAD */}
          {activeTab === 'sustainability' && (
            <motion.div
              key="sustainability"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TreePine className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    PrÃ¡cticas sostenibles
                  </span>
                  <Tooltip 
                    content="Selecciona las prÃ¡cticas que aplicas"
                    detailed="Las prÃ¡cticas sostenibles aumentan la confianza de los consumidores y mejoran el posicionamiento."
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
                        className="data-[state=checked]:bg-origen-pradera mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor={practice.id} className="flex items-center gap-2 cursor-pointer">
                          <span className="text-origen-pradera">{practice.icon}</span>
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

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    InformaciÃ³n de sostenibilidad
                  </span>
                  <Tooltip 
                    content="Detalles adicionales"
                    size="sm"
                  />
                </div>
                <Textarea
                  value={productionInfo.sustainabilityInfo}
                  onChange={(e) => handleChange('sustainabilityInfo', e.target.value)}
                  className="min-h-[100px] text-base w-full rounded-xl p-4"
                  placeholder="Ej: EnergÃ­a renovable, gestiÃ³n de residuos, huella de carbono, certificaciones ambientales..."
                />
              </div>
            </motion.div>
          )}

          {/* TAB GALERÃA - CORREGIDO */}
          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-origen-pradera" />
                  <span className="text-sm font-medium text-foreground">
                    GalerÃ­a del proceso
                  </span>
                  <Tooltip 
                    content="ImÃ¡genes del proceso de producciÃ³n"
                    detailed="Sube imÃ¡genes del proceso de elaboraciÃ³n, el taller o los productores en acciÃ³n. Todas las imÃ¡genes tienen la misma importancia."
                    size="sm"
                  />
                </div>
                
                {/* ImageUploader con transformaciÃ³n de tipos */}
                <ImageUploader
                  value={productionMediaToProductImages(mediaItems)}
                  onChange={handleMediaChange}
                  maxFiles={10}
                  maxSize={10}
                  showMainBadge={false}
                  uploadButtonText="Arrastra o haz clic para subir imÃ¡genes del proceso"
                />
              </div>

              {/* SecciÃ³n de vÃ­deos */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Film className="h-5 w-5 text-origen-pradera" />
                  <h3 className="text-sm font-medium text-origen-bosque">VÃ­deos del proceso</h3>
                </div>

                {!showVideoInput ? (
                  <button
                    onClick={() => setShowVideoInput(true)}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-origen-pradera/30 hover:border-origen-pradera hover:bg-origen-pradera/5 transition-all text-sm font-medium text-origen-bosque bg-surface-alt"
                  >
                    <Film className="w-4 h-4" />
                    AÃ±adir vÃ­deo (YouTube/Vimeo)
                  </button>
                ) : (
                  <div className="p-4 bg-origen-crema/30 rounded-xl border-2 border-origen-pradera/20">
                    <Input
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        setVideoError(null);
                      }}
                      placeholder="https://youtube.com/watch?v=..."
                      className={cn("h-11 text-sm mb-2 rounded-lg", videoError && "border-feedback-danger")}
                    />
                    {videoError && (
                      <p className="text-xs text-red-600 mb-2">{videoError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => {
                          setShowVideoInput(false);
                          setVideoUrl('');
                          setVideoError(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleVideoAdd}
                        disabled={!videoUrl}
                      >
                        AÃ±adir vÃ­deo
                      </Button>
                    </div>
                  </div>
                )}

                {/* Grid de vÃ­deos existentes */}
                {mediaItems.filter(m => m.type === 'video').length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                    <AnimatePresence>
                      {mediaItems.filter(m => m.type === 'video').map((video) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative aspect-video bg-gradient-to-br from-origen-crema to-gray-100 rounded-lg border border-border overflow-hidden group"
                        >
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt="VÃ­deo thumbnail"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Film className="w-8 h-8 text-text-subtle" />
                            </div>
                          )}

                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() => handleRemoveMedia(video.id)}
                              className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center hover:bg-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5 text-white" />
                            </button>
                          </div>

                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-origen-pradera/90 text-white">
                              <Film className="w-3 h-3" />
                              VÃ­deo
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
