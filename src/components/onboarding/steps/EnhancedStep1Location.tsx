// 📁 /src/components/onboarding/steps/EnhancedStep1Location.tsx
/**
 * @file EnhancedStep1Location.tsx
 * @description Paso 1: Ubicación + Confianza inicial
 * @version 8.0.0 - CORREGIDO: Imports de select, tipos locales
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/input';
import { FileUpload, type UploadedFile } from '@/components/shared/FileUpload';

import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { PRODUCER_CATEGORIES } from '@/constants/categories';

import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Home,
  Store,
  Sprout,
  Beef,
  ChefHat,
  Wine,
  Flower,
  Package,
  Info,
  Calendar,
  Users,
  ChevronDown
} from 'lucide-react';

// ============================================================================
// SELECT PERSONALIZADO - Sin dependencias de ui/select
// ============================================================================

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder,
  className,
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const selectRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Buscar la label del valor seleccionado
  React.useEffect(() => {
    if (value) {
      const option = React.Children.toArray(children).find(
        (child: any) => child.props?.value === value
      );
      if (option && React.isValidElement(option)) {
        setSelectedLabel(option.props.children);
      }
    } else {
      setSelectedLabel('');
    }
  }, [value, children]);

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border bg-white px-4 py-3 text-left transition-all",
          "border-gray-200 hover:border-origen-pradera focus:border-origen-pradera focus:outline-none focus:ring-2 focus:ring-origen-pradera/20",
          className
        )}
      >
        <span className={cn(
          "text-base",
          value ? "text-origen-oscuro" : "text-gray-400"
        )}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-5 w-5 text-gray-500 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          {React.Children.map(children, (child) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child, {
                onSelect: (value: string) => {
                  onValueChange(value);
                  setIsOpen(false);
                },
                isSelected: child.props.value === value
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  isSelected?: boolean;
}

const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  onSelect,
  isSelected
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors",
        "hover:bg-origen-crema hover:text-origen-bosque",
        "focus:bg-origen-crema focus:text-origen-bosque",
        isSelected && "bg-origen-pradera/10 font-medium text-origen-bosque"
      )}
    >
      <span className="flex-1 text-left">{children}</span>
      {isSelected && (
        <CheckCircle2 className="h-4 w-4 text-origen-pradera" />
      )}
    </button>
  );
};

// ============================================================================
// TIPOS
// ============================================================================

export interface EnhancedLocationData {
  // Ubicación
  address: string;
  city: string;
  province: string;
  postalCode: string;
  categories: string[];
  locationImages: UploadedFile[];
  
  // Confianza inicial
  foundedYear?: number;
  teamSize?: '1-2' | '3-5' | '6-10' | '11+';
}

export interface EnhancedStep1LocationProps {
  data: EnhancedLocationData;
  onChange: (data: EnhancedLocationData) => void;
}

// ============================================================================
// MAPA DE ICONOS - Definido localmente
// ============================================================================

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'agricola': Sprout,
  'ganadero': Beef,
  'artesano': ChefHat,
  'apicultor': Flower,
  'viticultor': Wine,
  'especializado': Package
};

const getCategoryIcon = (categoryId: string): React.ComponentType<{ className?: string }> => {
  return CATEGORY_ICON_MAP[categoryId] || Package;
};

// ============================================================================
// CATEGORY CARD - Definición local completa
// ============================================================================

interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    icon: string;
    description: string;
  };
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  isSelected,
  onSelect
}) => {
  const IconComponent = getCategoryIcon(category.id);
  
  const getGradient = (id: string): string => {
    const gradients: Record<string, string> = {
      'agricola': 'from-origen-pradera/20 to-origen-hoja/20',
      'ganadero': 'from-origen-hoja/20 to-origen-pino/20',
      'artesano': 'from-origen-pino/20 to-origen-bosque/20',
      'apicultor': 'from-origen-pradera/20 to-origen-hoja/20',
      'viticultor': 'from-origen-pradera/20 to-origen-pino/20',
      'especializado': 'from-origen-pradera/20 to-origen-hoja/20'
    };
    return gradients[id] || 'from-origen-pradera/20 to-origen-hoja/20';
  };
  
  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={cn(
        "group relative bg-white rounded-xl p-5 border-2 transition-all",
        "hover:shadow-lg hover:scale-[1.02]",
        "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
        isSelected
          ? "border-origen-pradera bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5 shadow-md"
          : "border-gray-200 hover:border-origen-pradera"
      )}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 rounded-full bg-origen-pradera flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          "w-16 h-16 rounded-xl flex items-center justify-center mb-3 transition-all",
          isSelected
            ? "bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-lg"
            : `bg-gradient-to-br ${getGradient(category.id)} text-origen-bosque group-hover:scale-110`
        )}>
          <IconComponent className="w-8 h-8" />
        </div>
        <h3 className={cn(
          "text-lg font-semibold mb-1",
          isSelected ? "text-origen-bosque" : "text-gray-900"
        )}>
          {category.name}
        </h3>
        <p className="text-sm text-gray-500 line-clamp-2">
          {category.description}
        </p>
      </div>
    </button>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep1Location({ data, onChange }: EnhancedStep1LocationProps) {
  
  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const hasBasicInfo = Boolean(
    data.address?.trim() && 
    data.city?.trim() && 
    data.province && 
    data.postalCode?.trim()
  );
  
  const hasCategories = data.categories?.length > 0;
  const hasYear = Boolean(data.foundedYear && data.foundedYear >= 1900 && data.foundedYear <= new Date().getFullYear());
  const hasTeamSize = Boolean(data.teamSize);
  
  const totalSteps = 4;
  const completedSteps = [hasBasicInfo, hasCategories, hasYear, hasTeamSize].filter(Boolean).length;
  const progress = (completedSteps / totalSteps) * 100;

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleInputChange = (field: keyof EnhancedLocationData, value: any) => {
    onChange({ ...data, [field]: value });
  };
  
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    handleInputChange('postalCode', value);
  };

  const handleCategorySelect = (categoryId: string) => {
    const isSelected = data.categories?.includes(categoryId);
    const newCategories = isSelected
      ? data.categories.filter(id => id !== categoryId)
      : [...(data.categories || []), categoryId];
    handleInputChange('categories', newCategories);
  };

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="space-y-6">
      
      {/* ====================================================================
          PROGRESS BAR
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
            <span className="text-sm font-medium text-origen-hoja">Información del negocio</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">{completedSteps}/{totalSteps}</span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Completa tu ubicación y cuéntanos tu trayectoria
        </p>
      </div>

      {/* ====================================================================
          CARD 1: UBICACIÓN + AÑO FUNDACIÓN + EQUIPO
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Home className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Ubicación y trayectoria</h2>
            <p className="text-sm text-gray-600">Los clientes confían en negocios con historia</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Dirección */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              <MapPin className="w-4 h-4 text-origen-pradera" />
              Dirección completa <span className="text-red-500">*</span>
            </label>
            <Input
              value={data.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Calle, número, finca, local..."
              className="h-12 text-base border-gray-200 focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20"
            />
          </div>
          
          {/* Ciudad + CP */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Ciudad <span className="text-red-500">*</span>
              </label>
              <Input
                value={data.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Ej: Madrid"
                className="h-12 text-base border-gray-200 focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <Input
                value={data.postalCode || ''}
                onChange={handlePostalCodeChange}
                placeholder="28001"
                maxLength={5}
                className="h-12 text-base border-gray-200 focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20 font-mono"
              />
            </div>
          </div>
          
          {/* Provincia - SELECT PERSONALIZADO */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-origen-bosque">
              Provincia <span className="text-red-500">*</span>
            </label>
            <Select
              value={data.province || ''}
              onValueChange={(value) => handleInputChange('province', value)}
              placeholder="Selecciona provincia"
            >
              {PROVINCIAS_ESPANA.map((province) => {
                const normalizedValue = province.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return (
                  <SelectItem key={province} value={normalizedValue}>
                    {province}
                  </SelectItem>
                );
              })}
            </Select>
          </div>

          {/* Año de fundación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
                <Calendar className="w-4 h-4 text-origen-pradera" />
                Año de fundación
                <span className="text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                value={data.foundedYear || ''}
                onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || undefined)}
                placeholder="Ej: 1985"
                min={1900}
                max={new Date().getFullYear()}
                className="h-12 text-base border-gray-200 focus:border-origen-pradera focus:ring-2 focus:ring-origen-pradera/20"
              />
              {data.foundedYear && (
                <p className="text-xs text-origen-pradera">
                  {new Date().getFullYear() - data.foundedYear} años de experiencia
                </p>
              )}
            </div>

            {/* Tamaño del equipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
                <Users className="w-4 h-4 text-origen-pradera" />
                Tamaño del equipo
                <span className="text-xs text-gray-500 font-normal">(opcional)</span>
              </label>
              <Select
                value={data.teamSize || ''}
                onValueChange={(value) => handleInputChange('teamSize', value as any)}
                placeholder="Selecciona tamaño"
              >
                <SelectItem value="1-2">Emprendedor individual (1-2 personas)</SelectItem>
                <SelectItem value="3-5">Pequeño equipo (3-5 personas)</SelectItem>
                <SelectItem value="6-10">Equipo mediano (6-10 personas)</SelectItem>
                <SelectItem value="11+">Gran equipo (más de 11 personas)</SelectItem>
              </Select>
              <p className="text-xs text-gray-500">Humaniza tu negocio</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: CATEGORÍAS
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">¿Qué productos vendes?</h2>
            <p className="text-sm text-gray-600">Selecciona tu categoría principal</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {PRODUCER_CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              isSelected={data.categories?.includes(category.id) || false}
              onSelect={handleCategorySelect}
            />
          ))}
        </div>

        {!hasCategories && (
          <div className="mt-6 p-4 bg-red-50/50 rounded-xl border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Selecciona al menos una categoría
              </p>
              <p className="text-xs text-red-600 mt-1">
                Necesitamos saber qué productos vendes para personalizar tu experiencia.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          CARD 3: FOTOS DEL ENTORNO (OPCIONAL)
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Camera className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Fotos del entorno</h2>
            <p className="text-sm text-gray-600">Muestra tu huerta, taller o establecimiento</p>
          </div>
        </div>

        <FileUpload
          value={data.locationImages || []}
          onChange={(files) => handleInputChange('locationImages', files)}
          helperText="Arrastra imágenes o haz clic para subir"
          accept="image/*"
          multiple={true}
          maxSize={5}
        />
        
        <div className="mt-4 text-xs text-gray-500 flex items-center gap-2 bg-origen-crema/50 p-3 rounded-lg">
          <Leaf className="w-4 h-4 text-origen-pradera flex-shrink-0" />
          <span>Formatos: JPG, PNG, WEBP. Tamaño recomendado: 1200x800px</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep1Location.displayName = 'EnhancedStep1Location';

export default EnhancedStep1Location;