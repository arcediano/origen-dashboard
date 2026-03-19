// 📁 /src/components/onboarding/steps/EnhancedStep1Location.tsx
/**
 * @file EnhancedStep1Location.tsx
 * @description Paso 1: Ubicación + Confianza inicial
 * @version 8.0.0 - CORREGIDO: Imports de select, tipos locales
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Input } from '@/components/ui/atoms/input';
import { FileUpload, type UploadedFile, CategoryCard } from '@/components/shared';

import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { getProvinciaFromCP } from '@/constants/cp-provincias';

import {
  MapPin,
  Camera,
  CheckCircle2,
  AlertCircle,
  Leaf,
  Home,
  Store,
  Info,
  Calendar,
  Users,
  ChevronDown,
} from 'lucide-react';

// ============================================================================
// SELECT PERSONALIZADO - Sin dependencias de ui/select
// ============================================================================

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
  searchable?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder,
  className,
  searchable = false,
  disabled = false,
  children
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');
  const selectRef = React.useRef<HTMLDivElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    if (isOpen && searchable && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
    if (!isOpen) setSearchQuery('');
  }, [isOpen, searchable]);

  // Buscar la label del valor seleccionado
  React.useEffect(() => {
    if (value) {
      const option = React.Children.toArray(children).find(
        (child: any) => child.props?.value === value
      );
      if (option && React.isValidElement(option)) {
        setSelectedLabel(option.props.children as string);
      }
    } else {
      setSelectedLabel('');
    }
  }, [value, children]);

  const filteredChildren = searchable && searchQuery
    ? React.Children.toArray(children).filter((child: any) => {
        const label = typeof child.props?.children === 'string' ? child.props.children : '';
        return label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .includes(searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      })
    : React.Children.toArray(children);

  return (
    <div ref={selectRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border bg-surface-alt px-4 py-3 text-left transition-all",
          "border-border hover:border-origen-pradera focus:border-origen-pradera focus:outline-none focus:ring-2 focus:ring-origen-pradera/20",
          disabled && "cursor-not-allowed opacity-50 bg-surface hover:border-border",
          className
        )}
      >
        <span className={cn(
          "text-base",
          value ? "text-origen-oscuro" : "text-text-subtle"
        )}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown className={cn(
          "h-5 w-5 text-muted-foreground transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-surface-alt shadow-lg animate-in fade-in-0 zoom-in-95">
          {searchable && (
            <div className="p-2 border-b border-border-subtle">
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar provincia..."
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-origen-pradera"
              />
            </div>
          )}
          <div className="max-h-56 overflow-auto p-1">
            {filteredChildren.length === 0 && (
              <p className="px-3 py-2.5 text-sm text-text-subtle text-center">Sin resultados</p>
            )}
            {filteredChildren.map((child) => {
              if (React.isValidElement(child)) {
                return React.cloneElement(child as React.ReactElement<any>, {
                  onSelect: (v: string) => {
                    onValueChange(v);
                    setIsOpen(false);
                  },
                  isSelected: (child as React.ReactElement<any>).props.value === value
                });
              }
              return child;
            })}
          </div>
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
  street: string;
  streetNumber: string;
  streetComplement?: string;
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

// CategoryCard importado de @/components/shared — componente canónico

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep1Location({ data, onChange }: EnhancedStep1LocationProps) {
  
  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const hasBasicInfo = Boolean(
    data.street?.trim() &&
    data.streetNumber?.trim() &&
    data.city?.trim() &&
    data.province &&
    data.postalCode?.trim()
  );

  const cpError = React.useMemo(() => {
    const cp = data.postalCode || '';
    if (cp.length < 5 || !data.province) return undefined;
    const expected = getProvinciaFromCP(cp);
    if (expected === null) return undefined;
    // Both values are now the capitalized PROVINCIAS_ESPANA name — direct comparison
    if (expected === data.province) return undefined;
    return `Este código postal corresponde a ${expected}, no a ${data.province}.`;
  }, [data.postalCode, data.province]);

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

  const capitalizeWords = (str: string) =>
    str.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    if (value.length === 5) {
      const expected = getProvinciaFromCP(value);
      if (expected !== null) {
        onChange({ ...data, postalCode: value, province: expected });
        return;
      }
    }
    handleInputChange('postalCode', value);
  };

  const handleCityBlur = () => {
    if (data.city) handleInputChange('city', capitalizeWords(data.city));
  };

  const handleStreetBlur = () => {
    if (data.street) handleInputChange('street', capitalizeWords(data.street));
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
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
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
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Completa tu ubicación y cuéntanos tu trayectoria
        </p>
      </div>

      {/* ====================================================================
          CARD 1: UBICACIÓN + AÑO FUNDACIÓN + EQUIPO
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Home className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Ubicación y trayectoria</h2>
            <p className="text-sm text-muted-foreground">Los clientes confían en negocios con historia</p>
          </div>
        </div>

        {/* Helper contextual */}
        <div className="flex items-start gap-2 p-3 bg-origen-crema/40 rounded-xl border border-origen-pradera/20 mb-6">
          <Info className="w-4 h-4 text-origen-pradera flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Esta información nos ayuda a conectarte con compradores de tu zona y a verificar tu identidad como productor.
          </p>
        </div>

        <div className="space-y-5">
          {/* Nombre de la vía */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
              <MapPin className="w-4 h-4 text-origen-pradera" />
              Nombre de la vía <span className="text-red-500">*</span>
            </label>
            <Input
              value={data.street || ''}
              onChange={(e) => handleInputChange('street', e.target.value)}
              onBlur={handleStreetBlur}
              placeholder="Ej: Calle Mayor, Av. de la Constitución"
              inputSize="lg"
            />
          </div>

          {/* Número + Piso/Puerta */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Número <span className="text-red-500">*</span>
              </label>
              <Input
                value={data.streetNumber || ''}
                onChange={(e) => handleInputChange('streetNumber', e.target.value)}
                placeholder="Ej: 15"
                inputSize="lg"
                className="font-mono"
              />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <label className="text-sm font-medium text-origen-bosque flex items-center gap-1">
                Piso / Puerta
                <span className="text-xs text-text-subtle font-normal">(opcional)</span>
              </label>
              <Input
                value={data.streetComplement || ''}
                onChange={(e) => handleInputChange('streetComplement', e.target.value)}
                placeholder="Ej: 3º A, Local 1, Bajo"
                inputSize="lg"
              />
            </div>
          </div>

          {/* CP + Provincia + Ciudad/Municipio */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Código Postal <span className="text-red-500">*</span>
              </label>
              <Input
                value={data.postalCode || ''}
                onChange={handlePostalCodeChange}
                placeholder="28001"
                maxLength={5}
                inputSize="lg"
                className="font-mono"
                error={cpError}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Provincia <span className="text-red-500">*</span>
              </label>
              <Select
                value={data.province || ''}
                onValueChange={(value) => handleInputChange('province', value)}
                placeholder="Ej: Madrid"
                disabled
              >
                {PROVINCIAS_ESPANA.map((province) => (
                  <SelectItem key={province} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque">
                Ciudad / Municipio <span className="text-red-500">*</span>
              </label>
              <Input
                value={data.city || ''}
                onChange={(e) => handleInputChange('city', e.target.value)}
                onBlur={handleCityBlur}
                placeholder="Ej: Madrid"
                inputSize="lg"
              />
            </div>
          </div>

          {/* Año de fundación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-border-subtle">
            <div className="space-y-2">
              <label className="text-sm font-medium text-origen-bosque flex items-center gap-2">
                <Calendar className="w-4 h-4 text-origen-pradera" />
                Año de fundación
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </label>
              <Input
                type="number"
                value={data.foundedYear || ''}
                onChange={(e) => handleInputChange('foundedYear', parseInt(e.target.value) || undefined)}
                placeholder="Ej: 1985"
                min={1900}
                max={new Date().getFullYear()}
                inputSize="lg"
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
                <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
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
              <p className="text-xs text-muted-foreground">Humaniza tu negocio</p>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: CATEGORÍAS
      ==================================================================== */}
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">¿Qué productos vendes?</h2>
            <p className="text-sm text-muted-foreground">Selecciona tu categoría principal</p>
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
      <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <Camera className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Fotos del entorno</h2>
            <p className="text-sm text-muted-foreground">Muestra tu huerta, taller o establecimiento</p>
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
        
        <div className="mt-4 text-xs text-muted-foreground flex items-center gap-2 bg-origen-crema/50 p-3 rounded-lg">
          <Leaf className="w-4 h-4 text-origen-pradera flex-shrink-0" />
          <span>Formatos: JPG, PNG, WEBP. Tamaño recomendado: 1200x800px</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep1Location.displayName = 'EnhancedStep1Location';

export default EnhancedStep1Location;
