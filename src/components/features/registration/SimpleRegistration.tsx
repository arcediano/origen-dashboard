// components/landing/SimpleRegistration.tsx
'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { Button, Input } from '@arcediano/ux-library';
import { Textarea } from '@arcediano/ux-library';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@arcediano/ux-library';
import { LoadingSpinner } from '@/components/shared';

import { PRODUCER_CATEGORIES } from '@/constants/categories';
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { getProvinciaFromCP } from '@/constants/cp-provincias';
import {
  initialRegistrationSchema,
  type InitialRegistrationFormData
} from '@/lib/validations/seller';
import { registerProducer } from '@/lib/api/auth';
import { GatewayError } from '@/lib/api/client';

import {
  ArrowRight,
  Store,
  MapPin,
  Leaf,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  AlertCircle,
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
import { CheckCircle2 } from 'lucide-react';

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


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
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
      street: '',
      streetNumber: '',
      streetComplement: '',
      municipio: '',
      postalCode: '',
      province: '',
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

  const confirmPasswordError =
    errors.confirmPassword?.message ||
    (formValues.confirmPassword && formValues.password !== formValues.confirmPassword
      ? 'Las contraseñas no coinciden'
      : undefined);

  const isProvinceAutoFilled = useMemo(() => {
    const cp = formValues.postalCode || '';
    if (cp.length !== 5) return false;
    const expected = getProvinciaFromCP(cp);
    return expected !== null && expected === formValues.province;
  }, [formValues.postalCode, formValues.province]);

  const cpError = useMemo(() => {
    const cp = formValues.postalCode || '';
    const prov = formValues.province;
    if (errors.postalCode || cp.length < 5 || !prov) return undefined;
    const expected = getProvinciaFromCP(cp);
    if (expected === null) return undefined;
    // Both values are now the capitalized PROVINCIAS_ESPANA name — direct comparison
    if (expected === prov) return undefined;
    return `Este código postal corresponde a ${expected}, no a ${prov}.`;
  }, [formValues.postalCode, formValues.province, errors.postalCode]);

  // Auto-fill province when CP reaches 5 digits
  useEffect(() => {
    const cp = formValues.postalCode || '';
    if (cp.length === 5) {
      const expected = getProvinciaFromCP(cp);
      if (expected !== null) setValue('province', expected, { shouldValidate: true });
    }
  }, [formValues.postalCode]);

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
      trigger();
    }
  }, []);

  const onSubmit = useCallback((data: InitialRegistrationFormData) => {
    setSubmitStatus('submitting');
    setErrorMessage('');

    setTimeout(async () => {
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
          street: data.street,
          streetNumber: data.streetNumber,
          streetComplement: data.streetComplement || undefined,
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
        clearDraft();
        onSuccess?.(data);
      } catch (err) {
        setSubmitStatus('error');
        if (err instanceof GatewayError && err.status === 409) {
          setErrorMessage('duplicate_email');
        } else {
          setErrorMessage('server_error');
        }
      }
    }, 0);
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

      {/* Spinner overlay — centrado en pantalla, no dismissible */}
      <AnimatePresence>
        {submitStatus === 'submitting' && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-origen-bosque/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xs bg-surface-alt rounded-2xl shadow-2xl border border-border-subtle overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-origen-bosque via-origen-pino to-origen-hoja" />
              <div className="p-8 flex flex-col items-center text-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-origen-hoja/10 animate-ping" />
                  <LoadingSpinner size="xl" variant="secondary" />
                </div>
                <div>
                  <p className="text-base font-bold text-origen-bosque">
                    Procesando tu solicitud
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esto puede tardar unos segundos
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Error modal — centrado en pantalla */}
      <AnimatePresence>
        {submitStatus === 'error' && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSubmitStatus('idle')}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm bg-surface-alt rounded-2xl shadow-2xl border border-border-subtle overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-feedback-danger to-red-400" />
              <div className="p-6 flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-feedback-danger-subtle flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-feedback-danger" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-origen-bosque mb-2">
                    {errorMessage === 'duplicate_email'
                      ? 'Ya tienes una solicitud en curso'
                      : 'No se pudo procesar tu solicitud'}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {errorMessage === 'duplicate_email' ? (
                      <>
                        Ya existe una solicitud pendiente de revisión con este email.
                        Si tienes alguna duda, contacta con nosotros desde la{' '}
                        <a href="/contacto" className="font-semibold text-origen-hoja hover:underline">
                          sección de contacto
                        </a>.
                      </>
                    ) : (
                      <>
                        Ha ocurrido un error al enviar tu solicitud. Por favor, ponte en contacto
                        con nuestro equipo de soporte desde la{' '}
                        <a href="/contacto" className="font-semibold text-origen-hoja hover:underline">
                          sección de contacto
                        </a>
                        {' '}de nuestra página web.
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="w-full py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-origen-bosque hover:border-red-200 hover:bg-red-50/30 active:scale-[.98] transition-all"
                >
                  Cerrar e intentarlo de nuevo
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className={cn('w-full', className)}>

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
                  required
                  inputSize="lg"
                  error={errors.contactName?.message}
                  {...register('contactName')}
                />
                <Input
                  label="Apellidos"
                  required
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
                  placeholder="nombre@ejemplo.es"
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
                    required
                    type="password"
                    helperText="Mínimo 8 caracteres"
                    error={errors.password?.message}
                    inputSize="lg"
                    {...register('password')}
                  />
                  <PasswordStrengthIndicator password={formValues.password || ''} />
                </div>
                <Input
                  label="Confirmar contraseña"
                  required
                  type="password"
                  error={confirmPasswordError}
                  success={!confirmPasswordError && !!formValues.confirmPassword && formValues.password === formValues.confirmPassword}
                  inputSize="lg"
                  {...register('confirmPassword')}
                />
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
                inputSize="lg"
                error={errors.businessName?.message}
                {...register('businessName')}
              />

              <BusinessTypeSelector
                value={formValues.businessType}
                onChange={(value) => setValue('businessType', value, { shouldValidate: true })}
                error={errors.businessType?.message}
              />

              {/* Nombre de la vía */}
              <Input
                label="Nombre de la vía"
                leftIcon={<MapPin />}
                required
                placeholder="Calle Mayor, Av. de la Constitución..."
                inputSize="lg"
                error={errors.street?.message}
                {...register('street')}
                onBlur={() => {
                  const v = formValues.street;
                  if (v) setValue('street', v.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
                }}
              />

              {/* Número + Piso/Puerta */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                <Input
                  label="Número"
                  required
                  inputSize="lg"
                  className="font-mono"
                  error={errors.streetNumber?.message}
                  {...register('streetNumber')}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Piso / Puerta"
                    inputSize="lg"
                    helperText="Opcional"
                    error={errors.streetComplement?.message}
                    {...register('streetComplement')}
                  />
                </div>
              </div>

              {/* CP + Provincia + Ciudad/Municipio */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <Input
                  label="Código postal"
                  required
                  inputSize="lg"
                  maxLength={5}
                  className="font-mono"
                  error={errors.postalCode?.message || cpError}
                  {...register('postalCode')}
                />
                <div>
                  <input type="hidden" {...register('province')} />
                  <Select
                    value={formValues.province}
                    onValueChange={(value) => setValue('province', value, { shouldValidate: true })}
                    placeholder="Selecciona provincia"
                    error={errors.province?.message}
                    disabled={isProvinceAutoFilled}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCIAS_ESPANA.map((provincia) => (
                        <SelectItem key={provincia} value={provincia}>{provincia}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  label="Ciudad / Municipio"
                  required
                  inputSize="lg"
                  error={errors.municipio?.message}
                  {...register('municipio')}
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

            {/* SECCIÓN 4: Candidatura */}
            <FormSection
              title="Tu candidatura"
              description="Esta información es clave para valorar si encajas en la comunidad Origen"
              badge="Paso 4 de 5"
            >
              <div className="space-y-3">
                <Textarea
                  label="Cuéntanos tu historia como productor"
                  required
                  placeholder="¿Quién eres, qué produces y desde cuándo? ¿Cuáles son tus valores? ¿Por qué quieres unirte a Origen?"
                  helperText="Mínimo 50 caracteres"
                  error={errors.whyOrigin?.message}
                  maxLength={300}
                  showCharCount
                  {...register('whyOrigin')}
                  className="min-h-[120px] md:min-h-[140px] resize-y"
                />
                {textareaValid && (
                  <div className="flex items-center gap-2 text-sm text-origen-hoja bg-origen-crema/50 p-3 rounded-lg border border-origen-hoja/30">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">¡Gracias por contarnos tu historia!</span>
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
                className="w-full md:w-auto md:min-w-[280px]"
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
                  <span className="text-xs md:text-sm text-muted-foreground">SSL 256-bit</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-hoja" />
                  <span className="text-xs md:text-sm text-muted-foreground">Respuesta 24h</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-border" />
                <div className="flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5 md:w-4 md:h-4 text-origen-hoja" />
                  <span className="text-xs md:text-sm text-muted-foreground">Kilómetro 0</span>
                </div>
              </div>
            </div>
          </form>
      </div>
    </>
  );
}

