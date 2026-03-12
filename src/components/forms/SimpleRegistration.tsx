// components/register/SimpleRegistration.tsx
'use client';

import { useState, useCallback, useEffect, useRef, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertWithIcon } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Loading } from '@/components/shared/Loading';

import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import {
  initialRegistrationSchema,
  type InitialRegistrationFormData
} from '@/lib/validations/seller';
import { registerProducer } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

import {
  Check,
  AlertCircle,
  ArrowRight,
  User,
  Building2,
  Store,
  MapPin,
  Package,
  Leaf,
  Mail,
  CheckCircle,
  Phone,
  Heart,
  Beef,
  ChefHat,
  Wine,
  Sprout,
  Flower,
  Briefcase,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

interface SimpleRegistrationProps {
  onSuccess?: (data: InitialRegistrationFormData) => void;
  className?: string;
}

// ============================================================================
// UTILS
// ============================================================================

const useLockBodyScroll = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return;
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = originalStyle; };
  }, [locked]);
};

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  agricola: Sprout,
  ganadero: Beef,
  artesano: ChefHat,
  apicultor: Flower,
  viticultor: Wine,
  especializado: Package,
};

const getCategoryIcon = (categoryId: string) =>
  CATEGORY_ICON_MAP[categoryId] || Package;

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const ProgressBar: React.FC<{ value: number; max: number; className?: string }> = ({
  value, max, className
}) => {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm text-origen-hoja">Mínimo 50 caracteres</span>
        <span className="text-xs md:text-sm font-semibold text-origen-pradera">{percentage}%</span>
      </div>
      <div className="h-2 bg-origen-crema rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-origen-pradera to-origen-hoja transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface CustomCheckboxProps {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id: providedId, label, description, checked, onChange, required, error, className
}) => {
  const generatedId = useId();
  const checkboxId = providedId || `checkbox-${generatedId}`;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
          <button
            type="button"
            id={checkboxId}
            role="checkbox"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
              'h-5 w-5 rounded-md border-2 bg-white transition-all',
              'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50 focus:ring-offset-2',
              checked ? 'bg-origen-bosque border-origen-bosque' : 'border-gray-300 hover:border-origen-pradera',
              error && 'border-destructive'
            )}
          >
            {checked && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center">
                <Check className="h-4 w-4 text-white stroke-[3]" />
              </motion.div>
            )}
          </button>
        </div>
        <div className="flex-1">
          <label htmlFor={checkboxId} className="text-sm md:text-base font-medium text-origen-bosque cursor-pointer">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          {description && <p className="text-xs md:text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1 flex items-center gap-1 ml-8">
          <AlertCircle className="w-4 h-4" />{error}
        </p>
      )}
    </div>
  );
};

interface BusinessTypeSelectorProps {
  value: 'individual' | 'company';
  onChange: (value: 'individual' | 'company') => void;
  error?: string;
}

const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({ value, onChange, error }) => (
  <div className="space-y-2 md:space-y-3">
    <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
      <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
      Tipo de negocio <span className="text-destructive">*</span>
    </label>
    <div className="grid grid-cols-2 gap-3">
      {[
        { id: 'individual', label: 'Autónomo', desc: 'Particular / Freelance', icon: User },
        { id: 'company', label: 'Empresa', desc: 'Sociedad / Corporación', icon: Building2 },
      ].map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id as 'individual' | 'company')}
            className={cn(
              'relative bg-white rounded-xl border-2 transition-all',
              'hover:shadow-md hover:scale-[1.02]',
              'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50',
              'p-3 md:p-5',
              isSelected
                ? 'border-origen-pradera bg-origen-pradera/5 shadow-md'
                : 'border-gray-200 hover:border-origen-pradera'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-gradient-to-br from-origen-pradera to-origen-hoja rounded-full flex items-center justify-center shadow">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                'rounded-xl flex items-center justify-center mb-2 transition-all',
                'w-10 h-10 md:w-16 md:h-16',
                isSelected
                  ? 'bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-lg'
                  : 'bg-origen-crema text-origen-bosque'
              )}>
                <Icon className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <h3 className={cn('text-sm md:text-lg font-semibold mb-0.5', isSelected ? 'text-origen-bosque' : 'text-gray-900')}>
                {option.label}
              </h3>
              <p className="text-xs text-gray-500 hidden md:block">{option.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
    {error && (
      <p className="text-sm text-destructive flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />{error}
      </p>
    )}
  </div>
);

interface CategoryCardProps {
  category: typeof PRODUCER_CATEGORIES[0];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ category, isSelected, onSelect }) => {
  const IconComponent = getCategoryIcon(category.id);
  const gradients: Record<string, string> = {
    agricola: 'from-origen-pradera/20 to-origen-hoja/20',
    ganadero: 'from-origen-hoja/20 to-origen-pino/20',
    artesano: 'from-origen-pino/20 to-origen-bosque/20',
    apicultor: 'from-origen-pradera/20 to-origen-hoja/20',
    viticultor: 'from-origen-pradera/20 to-origen-pino/20',
    especializado: 'from-origen-pradera/20 to-origen-hoja/20',
  };
  const gradient = gradients[category.id] || 'from-origen-pradera/20 to-origen-hoja/20';

  return (
    <button
      type="button"
      onClick={() => onSelect(category.id)}
      className={cn(
        'group relative bg-white rounded-xl border-2 transition-all w-full',
        'hover:shadow-md hover:scale-[1.02]',
        'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50',
        'p-3 md:p-5',
        isSelected
          ? 'border-origen-pradera bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5 shadow-md'
          : 'border-gray-200 hover:border-origen-pradera'
      )}
    >
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 bg-gradient-to-br from-origen-pradera to-origen-hoja rounded-full flex items-center justify-center shadow">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
      <div className="flex flex-col items-center text-center">
        <div className={cn(
          'rounded-xl flex items-center justify-center mb-2 transition-all',
          'w-11 h-11 md:w-16 md:h-16',
          isSelected
            ? 'bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-lg'
            : `bg-gradient-to-br ${gradient} text-origen-bosque group-hover:scale-110`
        )}>
          <IconComponent className="w-5 h-5 md:w-8 md:h-8" />
        </div>
        <h3 className={cn('text-xs md:text-lg font-semibold mb-0.5 leading-tight', isSelected ? 'text-origen-bosque' : 'text-gray-900')}>
          {category.name}
        </h3>
        <p className="text-[10px] md:text-sm text-gray-500 line-clamp-2 hidden md:block">
          {category.description}
        </p>
      </div>
    </button>
  );
};

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

const FormSection: React.FC<FormSectionProps> = ({ title, description, children, className, badge }) => (
  <div className={cn(
    'bg-white rounded-xl md:rounded-2xl border border-gray-200',
    'p-4 md:p-8',
    'hover:border-origen-pradera transition-all shadow-sm hover:shadow-md',
    className
  )}>
    {badge && (
      <div className="inline-flex items-center gap-1.5 bg-origen-crema/80 rounded-full px-3 py-1 md:px-4 md:py-1.5 mb-3 md:mb-6 border border-origen-pradera/30">
        <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-origen-pradera" />
        <span className="text-xs md:text-sm font-semibold text-origen-bosque">{badge}</span>
      </div>
    )}
    <h3 className="text-base md:text-xl font-bold text-origen-bosque mb-1 md:mb-2">{title}</h3>
    {description && (
      <p className="text-xs md:text-base text-gray-600 mb-3 md:mb-6">{description}</p>
    )}
    <div className="space-y-4 md:space-y-6">
      {children}
    </div>
  </div>
);

// ============================================================================
// MODAL DE CONFIRMACIÓN
// ============================================================================

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessName: string;
  contactName: string;
  email: string;
  city: string;
  province: string;
  trackingCode: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen, onClose, businessName, contactName, email, city, province, trackingCode
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) onClose(); };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const initial = businessName?.charAt(0).toUpperCase() || 'O';
  const provinceName = PROVINCIAS_ESPANA.find(
    p => p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === province
  ) || province;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-origen-bosque/80 backdrop-blur-sm"
          />
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'relative w-full sm:max-w-lg',
              'bg-white sm:rounded-2xl rounded-t-2xl',
              'shadow-2xl border border-gray-100',
              'overflow-hidden max-h-[95dvh] overflow-y-auto'
            )}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-origen-pradera via-origen-hoja to-origen-pino" />
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            <div className="p-5 sm:p-8">
              <div className="text-center mb-5">
                <div className="mx-auto mb-4 w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <div className="inline-flex items-center gap-1.5 bg-origen-crema rounded-full px-3 py-1.5 border border-origen-pradera/30 mb-3">
                  <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
                  <span className="text-xs font-bold text-origen-bosque uppercase tracking-wider">Solicitud recibida</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-origen-bosque mb-1">
                  ¡Gracias, {contactName}!
                </h2>
                <p className="text-xs sm:text-base text-gray-500 leading-relaxed">
                  Hemos recibido tu solicitud. Nuestro equipo la revisará pronto.
                </p>
              </div>

              <div className="flex items-start gap-3 bg-origen-crema/60 border border-origen-pradera/20 rounded-xl p-3 md:p-4 mb-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-origen-pradera/15 flex items-center justify-center mt-0.5">
                  <Clock className="w-4 h-4 text-origen-hoja" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-origen-bosque mb-0.5">Respuesta en menos de 24 horas</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Te escribiremos a <span className="font-semibold text-origen-bosque">{email}</span>.
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-origen-bosque rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-2">Código de seguimiento</p>
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono text-base sm:text-xl font-bold text-white tracking-wide break-all">
                    {trackingCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    aria-label="Copiar código"
                    className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all border border-white/15"
                  >
                    {copied
                      ? <CheckCircle className="w-4 h-4 text-origen-pradera" />
                      : <Copy className="w-4 h-4 text-white" />}
                  </button>
                </div>
                <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                  Guarda este código para consultar el estado de tu solicitud.
                </p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center flex-shrink-0 shadow">
                  <span className="text-sm font-bold text-white">{initial}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-origen-bosque truncate">{businessName}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {city}, {provinceName}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-500 hover:text-origen-bosque hover:border-origen-pradera/40 hover:bg-origen-crema/30 active:scale-[.98] transition-all"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function SimpleRegistration({ onSuccess, className }: SimpleRegistrationProps): JSX.Element {
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submittedData, setSubmittedData] = useState<InitialRegistrationFormData | null>(null);
  const [trackingCode, setTrackingCode] = useState<string>('');

  const errorRef = useRef<HTMLDivElement>(null);
  const spinnerRef = useRef<HTMLDivElement>(null);

  // Scroll al error cuando aparece
  useEffect(() => {
    if (submitStatus === 'error' && errorMessage) {
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitStatus, errorMessage]);

  // Scroll al spinner cuando se activa — el usuario debe ver que se está procesando
  useEffect(() => {
    if (submitStatus === 'submitting') {
      spinnerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [submitStatus]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<InitialRegistrationFormData>({
    resolver: zodResolver(initialRegistrationSchema),
    mode: 'onChange',
    defaultValues: {
      contactName: '',
      contactSurname: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      businessName: '',
      businessType: 'individual',
      province: '',
      city: '',
      producerCategory: undefined,
      whyOrigin: '',
      acceptsTerms: false,
      acceptsPrivacy: false,
    }
  });

  const formValues = watch();
  const whyOriginValue = formValues.whyOrigin || '';
  const textareaValid = whyOriginValue.length >= 50;
  const isFormValid = isValid && textareaValid;

  const onSubmit = useCallback(async (data: InitialRegistrationFormData) => {
    setSubmitStatus('submitting');
    setErrorMessage('');

    try {
      const result = await registerProducer({
        email: data.email,
        password: data.password,
        firstName: data.contactName,
        lastName: data.contactSurname,
        phone: data.phone,
        businessName: data.businessName,
        businessType: data.businessType as 'individual' | 'company',
        producerCategory: data.producerCategory,
        province: data.province,
        city: data.city,
        whyOrigin: data.whyOrigin,
        acceptsTerms: true,
        acceptsPrivacy: true,
      });

      setTrackingCode(result.data.trackingCode ?? '');
      setSubmittedData(data);
      setSubmitStatus('success');
      setIsModalOpen(true);
      onSuccess?.(data);
    } catch (err) {
      setSubmitStatus('error');
      if (err instanceof GatewayError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('No hemos podido procesar tu solicitud. Inténtalo de nuevo.');
      }
    }
  }, [onSuccess]);

  const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

  const handleCategorySelect = useCallback((categoryId: string) => {
    setValue('producerCategory', categoryId as any, { shouldValidate: true, shouldDirty: true });
  }, [setValue]);

  return (
    <>
      <AnimatePresence>
        {submittedData && isModalOpen && (
          <SuccessModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            businessName={submittedData.businessName}
            contactName={submittedData.contactName}
            email={submittedData.email}
            city={submittedData.city}
            province={submittedData.province}
            trackingCode={trackingCode}
          />
        )}
      </AnimatePresence>

      <div className={cn('w-full', className)}>

        {/* Error */}
        {submitStatus === 'error' && errorMessage && (
          <div ref={errorRef} className="mb-4 md:mb-6">
            <AlertWithIcon
              variant="error"
              description={errorMessage}
              dismissible
              onDismiss={() => setSubmitStatus('idle')}
            />
          </div>
        )}

        {/* Spinner — con ref para scroll automático */}
        {submitStatus === 'submitting' && (
          <div
            ref={spinnerRef}
            className="bg-white rounded-xl md:rounded-2xl p-8 md:p-12 shadow-xl border border-gray-200 text-center"
          >
            <Loading />
            <p className="text-sm md:text-base text-gray-600 mt-4 font-medium">
              Procesando tu solicitud...
            </p>
            <p className="text-xs text-gray-400 mt-1">Esto puede tardar unos segundos</p>
          </div>
        )}

        {submitStatus !== 'submitting' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">

            {/* SECCIÓN 1: Contacto */}
            <FormSection
              title="Información de contacto"
              description="¿Cómo podemos llamarte?"
              badge="Paso 1 de 5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Nombre <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej: María"
                    error={errors.contactName?.message}
                    {...register('contactName')}
                    className="h-11 md:h-12 text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <User className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Apellidos <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Ej: García López"
                    error={errors.contactSurname?.message}
                    {...register('contactSurname')}
                    className="h-11 md:h-12 text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <Mail className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    error={errors.email?.message}
                    {...register('email')}
                    className="h-11 md:h-12 text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <Phone className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Teléfono <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="600 000 000"
                    error={errors.phone?.message}
                    {...register('phone')}
                    className="h-11 md:h-12 text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <Lock className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Contraseña <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Mín. 8 caracteres"
                    error={errors.password?.message}
                    inputSize="lg"
                    {...register('password')}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <Lock className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Confirmar contraseña <span className="text-destructive">*</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Repite la contraseña"
                    error={errors.confirmPassword?.message}
                    inputSize="lg"
                    {...register('confirmPassword')}
                  />
                </div>
              </div>
            </FormSection>

            {/* SECCIÓN 2: Negocio */}
            <FormSection
              title="Tu negocio"
              description="Cuéntanos sobre tu proyecto"
              badge="Paso 2 de 5"
            >
              <div className="space-y-1.5">
                <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                  <Store className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                  Nombre del negocio <span className="text-destructive">*</span>
                </label>
                <Input
                  placeholder="Ej: Huerta Ecológica del Valle"
                  error={errors.businessName?.message}
                  {...register('businessName')}
                  className="h-11 md:h-12 text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30"
                />
              </div>

              <BusinessTypeSelector
                value={formValues.businessType}
                onChange={(value) => setValue('businessType', value, { shouldValidate: true })}
                error={errors.businessType?.message}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Provincia <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formValues.province}
                    onValueChange={(value) => setValue('province', value, { shouldValidate: true })}
                    placeholder="Selecciona provincia"
                    error={errors.province?.message}
                    searchable
                    className="h-11 md:h-12 text-sm md:text-base"
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCIAS_ESPANA.map((provincia) => {
                        const value = provincia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        return <SelectItem key={value} value={value}>{provincia}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    Ciudad <span className="text-destructive">*</span>
                  </label>
                  <Input
                    placeholder="Tu localidad"
                    error={errors.city?.message}
                    {...register('city')}
                    className="h-11 md:h-12 text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30"
                  />
                </div>
              </div>
            </FormSection>

            {/* SECCIÓN 3: Categoría */}
            <FormSection
              title="¿Qué vendes?"
              description="Selecciona tu categoría principal"
              badge="Paso 3 de 5"
            >
              <div className="grid grid-cols-3 md:grid-cols-3 gap-2 md:gap-4">
                {PRODUCER_CATEGORIES.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isSelected={formValues.producerCategory === category.id}
                    onSelect={handleCategorySelect}
                  />
                ))}
              </div>
              {errors.producerCategory && (
                <div className="mt-2 p-3 md:p-4 bg-destructive/10 rounded-lg border border-destructive/30">
                  <p className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {errors.producerCategory.message}
                  </p>
                </div>
              )}
            </FormSection>

            {/* SECCIÓN 4: Historia */}
            <FormSection
              title="Tu historia"
              description="Los compradores conectan con personas, no solo con productos"
              badge="Paso 4 de 5"
            >
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-origen-pradera" />
                    ¿Por qué quieres vender en Origen? <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Comparte tu pasión, tus valores... (mínimo 50 caracteres)"
                    error={errors.whyOrigin?.message}
                    maxLength={300}
                    {...register('whyOrigin')}
                    className="min-h-[100px] md:min-h-[120px] text-sm md:text-base border-gray-200 focus:border-origen-pradera focus:ring-1 focus:ring-origen-pradera/30 resize-y"
                  />
                </div>
                {whyOriginValue.length > 0 && (
                  <ProgressBar value={whyOriginValue.length} max={50} />
                )}
                {textareaValid && (
                  <div className="flex items-center gap-2 text-sm text-origen-pradera bg-origen-crema/50 p-3 rounded-lg border border-origen-pradera/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">¡Gracias por compartir tu historia!</span>
                  </div>
                )}
              </div>
            </FormSection>

            {/* SECCIÓN 5: Legal */}
            <FormSection
              title="Confirmación legal"
              description="Último paso para unirte a la comunidad"
              badge="Paso 5 de 5"
            >
              <div className="space-y-3 md:space-y-4">
                <CustomCheckbox
                  label="Acepto los términos y condiciones"
                  description="He leído y acepto las condiciones de uso de la plataforma Origen"
                  checked={formValues.acceptsTerms}
                  onChange={(checked) => setValue('acceptsTerms', checked, { shouldValidate: true })}
                  error={errors.acceptsTerms?.message}
                  required
                />
                <CustomCheckbox
                  label="Acepto la política de privacidad"
                  description="Autorizo el tratamiento de mis datos personales según el RGPD"
                  checked={formValues.acceptsPrivacy}
                  onChange={(checked) => setValue('acceptsPrivacy', checked, { shouldValidate: true })}
                  error={errors.acceptsPrivacy?.message}
                  required
                />
              </div>
            </FormSection>

            {/* Botón de envío */}
            <div className="flex flex-col items-center pt-2 md:pt-4">
              <Button
                type="submit"
                size="lg"
                disabled={!isFormValid}
                className={cn(
                  'w-full md:w-auto md:min-w-[280px]',
                  'bg-origen-bosque hover:bg-origen-pino',
                  'text-white text-base md:text-lg font-semibold',
                  'rounded-xl shadow-xl hover:shadow-2xl',
                  'transition-all transform hover:-translate-y-1',
                  'disabled:opacity-50 disabled:hover:translate-y-0',
                  'h-12 md:h-14 px-6 md:px-8'
                )}
              >
                {isFormValid ? (
                  <span className="flex items-center justify-center gap-2 md:gap-3">
                    Enviar solicitud
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </span>
                ) : (
                  <span>Completar registro</span>
                )}
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-4 md:mt-6">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-pradera" />
                  <span className="text-xs md:text-sm text-gray-600">SSL 256-bit</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-pradera" />
                  <span className="text-xs md:text-sm text-gray-600">Respuesta 24h</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-pradera" />
                  <span className="text-xs md:text-sm text-gray-600">Kilómetro 0</span>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
