// components/landing/SimpleRegistration.tsx
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { AlertWithIcon } from '@/components/ui/atoms/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/atoms/select';
import { LoadingSpinner } from '@/components/shared';

import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import {
  initialRegistrationSchema,
  type InitialRegistrationFormData
} from '@/lib/validations/seller';
import { registerProducer } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

import {
  ArrowRight,
  User,
  Store,
  MapPin,
  Leaf,
  Mail,
  Phone,
  Heart,
  ShieldCheck,
  Clock,
  Lock,
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';

// ============================================================================
// IMPORTS FROM NEW REGISTRATION MODULE
// ============================================================================

// Components
import { SuccessModal } from './components/SuccessModal';
import { CustomCheckbox } from './components/CustomCheckbox';
import { BusinessTypeSelector } from './components/BusinessTypeSelector';
import { CategoryCard } from './components/CategoryCard';
import { FormSection } from './components/FormSection';
import { PasswordStrengthIndicator } from './components/PasswordStrengthIndicator';
import { ProgressBar } from './components/ProgressBar';

// Hooks
import { useAutosave } from './hooks/useAutosave';

// ============================================================================
// TIPOS
// ============================================================================

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

interface SimpleRegistrationProps {
  onSuccess?: (data: InitialRegistrationFormData) => void;
  className?: string;
}

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
      municipio: '',
      postalCode: '',
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

  // ============================================================================
  // AUTOSAVE - Guardado automático de borrador
  // ============================================================================
  const { loadDraft, clearDraft } = useAutosave(formValues);

  // Cargar borrador al iniciar
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          setValue(key as any, value as any, { shouldValidate: false });
        }
      });
    }
  }, []);

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
        municipio: data.municipio,
        postalCode: data.postalCode,
        whyOrigin: data.whyOrigin,
        acceptsTerms: true,
        acceptsPrivacy: true,
      });

      setTrackingCode(result.data.trackingCode ?? '');
      setSubmittedData(data);
      setSubmitStatus('success');
      setIsModalOpen(true);
      clearDraft(); // Limpiar borrador tras envío exitoso
      onSuccess?.(data);
    } catch (err) {
      setSubmitStatus('error');
      if (err instanceof GatewayError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('No hemos podido procesar tu solicitud. Inténtalo de nuevo.');
      }
    }
  }, [onSuccess, clearDraft]);

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
            municipio={submittedData.municipio}
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
            <LoadingSpinner />
            <p className="text-sm md:text-base text-gray-600 mt-4 font-medium">
              Procesando tu solicitud...
            </p>
            <p className="text-xs text-gray-400 mt-1">Esto puede tardar unos segundos</p>
          </div>
        )}

        {submitStatus !== 'submitting' && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">

            {/* SECCIÓN 1: Contacto */}
            <FormSection
              title="Información de contacto"
              description="¿Cómo podemos llamarte?"
              badge="Paso 1 de 5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Nombre"
                  leftIcon={<User />}
                  required
                  placeholder="Ej: María"
                  inputSize="lg"
                  error={errors.contactName?.message}
                  {...register('contactName')}
                />
                <Input
                  label="Apellidos"
                  leftIcon={<User />}
                  required
                  placeholder="Ej: García López"
                  inputSize="lg"
                  error={errors.contactSurname?.message}
                  {...register('contactSurname')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Email"
                  leftIcon={<Mail />}
                  required
                  type="email"
                  placeholder="tu@email.com"
                  inputSize="lg"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <Input
                  label="Teléfono"
                  leftIcon={<Phone />}
                  required
                  type="tel"
                  placeholder="600 000 000"
                  inputSize="lg"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <Input
                    label="Contraseña"
                    leftIcon={<Lock />}
                    required
                    type="password"
                    placeholder="Mín. 8 caracteres"
                    error={errors.password?.message}
                    inputSize="lg"
                    {...register('password')}
                  />
                  <PasswordStrengthIndicator password={formValues.password || ''} />
                </div>
                <div>
                  <Input
                    label="Confirmar contraseña"
                    leftIcon={<Lock />}
                    required
                    type="password"
                    placeholder="Repite la contraseña"
                    error={errors.confirmPassword?.message}
                    inputSize="lg"
                    {...register('confirmPassword')}
                  />
                  {formValues.confirmPassword && formValues.password === formValues.confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 text-origen-hoja mt-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Las contraseñas coinciden</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </FormSection>

            {/* SECCIÓN 2: Negocio */}
            <FormSection
              title="Tu negocio"
              description="Cuéntanos sobre tu proyecto"
              badge="Paso 2 de 5"
            >
              <Input
                label="Nombre del negocio"
                leftIcon={<Store />}
                required
                placeholder="Ej: Huerta Ecológica del Valle"
                inputSize="lg"
                error={errors.businessName?.message}
                {...register('businessName')}
              />

              <BusinessTypeSelector
                value={formValues.businessType}
                onChange={(value) => setValue('businessType', value, { shouldValidate: true })}
                error={errors.businessType?.message}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-1.5">
                  <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
                    <MapPin className="w-4 h-4 md:w-5 md:h-5 text-origen-hoja" />
                    Provincia <span className="text-destructive">*</span>
                  </label>
                  <Select
                    value={formValues.province}
                    onValueChange={(value) => setValue('province', value, { shouldValidate: true })}
                    placeholder="Selecciona provincia"
                    error={errors.province?.message}
                    searchable
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
                <Input
                  label="Municipio"
                  leftIcon={<MapPin />}
                  required
                  placeholder="Tu municipio"
                  inputSize="lg"
                  error={errors.municipio?.message}
                  {...register('municipio')}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <Input
                  label="Código postal"
                  leftIcon={<MapPin />}
                  required
                  placeholder="Ej: 28001"
                  inputSize="lg"
                  maxLength={5}
                  error={errors.postalCode?.message}
                  {...register('postalCode')}
                />
              </div>
            </FormSection>

            {/* SECCIÓN 3: Categoría */}
            <FormSection
              title="¿Qué vendes?"
              description="Selecciona tu categoría principal"
              badge="Paso 3 de 5"
            >
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Heart className="w-4 h-4 md:w-5 md:h-5 text-origen-hoja" />
                    ¿Por qué quieres vender en Origen? <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    placeholder="Comparte tu pasión, tus valores... (mínimo 50 caracteres)"
                    error={errors.whyOrigin?.message}
                    maxLength={300}
                    {...register('whyOrigin')}
                    className="min-h-[100px] md:min-h-[120px] resize-y"
                  />
                </div>
                {whyOriginValue.length > 0 && (
                  <ProgressBar value={whyOriginValue.length} max={50} />
                )}
                {textareaValid && (
                  <div className="flex items-center gap-2 text-sm text-origen-hoja bg-origen-crema/50 p-3 rounded-lg border border-origen-hoja/30">
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
                className="w-full md:w-auto md:min-w-[280px] relative overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:hover:translate-y-0 h-12 md:h-14 px-6 md:px-8 text-base md:text-lg"
              >
                {isFormValid ? (
                  <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 md:gap-3"
                  >
                    Enviar solicitud
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </motion.span>
                ) : (
                  <span>Completar registro</span>
                )}
              </Button>

              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mt-4 md:mt-6">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-hoja" />
                  <span className="text-xs md:text-sm text-gray-600">SSL 256-bit</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-hoja" />
                  <span className="text-xs md:text-sm text-gray-600">Respuesta 24h</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <div className="flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-hoja" />
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
