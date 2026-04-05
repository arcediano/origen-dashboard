'use client';

import { useState } from 'react';
import { Button } from '@origen/ux-library';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, User, Mail, MessageSquare } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@origen/ux-library';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  privacy: boolean;
}

export function ContactForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [form, setForm] = useState<FormData>({ name: '', email: '', subject: '', message: '', privacy: false });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'general', string>>>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'El nombre es requerido';
    if (!form.email.trim()) {
      e.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Introduce un email válido';
    }
    if (!form.subject) e.subject = 'Selecciona un asunto';
    if (!form.message.trim()) {
      e.message = 'El mensaje es requerido';
    } else if (form.message.trim().length < 10) {
      e.message = 'El mensaje debe tener al menos 10 caracteres';
    }
    if (!form.privacy) e.privacy = 'Debes aceptar la política de privacidad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatus('success');
    } catch {
      setErrors({ general: 'No se pudo enviar el mensaje. Inténtalo de nuevo.' });
      setStatus('idle');
    }
  };

  const clearError = (field: keyof FormData) =>
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });

  return (
    <div className="w-full bg-surface-alt rounded-2xl border border-border shadow-lg hover:shadow-xl transition-shadow p-5 sm:p-6 md:p-8">

      {/* Cabecera */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md flex-shrink-0">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-origen-bosque leading-tight">Envíanos un mensaje</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Respondemos en menos de 24 horas</p>
        </div>
      </div>

      {/* Error general */}
      <AnimatePresence>
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-5 p-3 bg-feedback-danger-subtle border border-red-200 rounded-lg flex items-start gap-2 text-red-600"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span className="text-xs">{errors.general}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5" noValidate>

        {/* Nombre + Email */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">

          {/* Nombre */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-origen-bosque flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-origen-pradera" />
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(p => ({ ...p, name: e.target.value })); clearError('name'); }}
              placeholder="Tu nombre completo"
              className={cn(
                "w-full h-11 md:h-12 px-3 md:px-4 text-sm bg-surface-alt border rounded-xl",
                "focus:outline-none focus:ring-2 focus:ring-origen-pradera/20 transition-all duration-200",
                errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-border focus:border-origen-pradera"
              )}
            />
            {errors.name && (
              <p className="text-xs text-feedback-danger flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs md:text-sm font-medium text-origen-bosque flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-origen-pradera" />
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => { setForm(p => ({ ...p, email: e.target.value })); clearError('email'); }}
              placeholder="tu@email.com"
              className={cn(
                "w-full h-11 md:h-12 px-3 md:px-4 text-sm bg-surface-alt border rounded-xl",
                "focus:outline-none focus:ring-2 focus:ring-origen-pradera/20 transition-all duration-200",
                errors.email ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-border focus:border-origen-pradera"
              )}
            />
            {errors.email && (
              <p className="text-xs text-feedback-danger flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3" />{errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Asunto */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-medium text-origen-bosque flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-origen-pradera" />
            Asunto <span className="text-red-500">*</span>
          </label>
          <Select onValueChange={v => { setForm(p => ({ ...p, subject: v })); clearError('subject'); }}>
            <SelectTrigger className={cn(
              "h-11 md:h-12 rounded-xl text-sm",
              errors.subject ? "border-red-300 focus:border-red-400" : "border-border focus:border-origen-pradera"
            )}>
              <SelectValue placeholder="Selecciona un asunto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">Información general</SelectItem>
              <SelectItem value="support">Soporte técnico</SelectItem>
              <SelectItem value="sales">Consultas comerciales</SelectItem>
              <SelectItem value="partners">Colaboraciones</SelectItem>
            </SelectContent>
          </Select>
          {errors.subject && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />{errors.subject}
            </p>
          )}
        </div>

        {/* Mensaje */}
        <div className="space-y-1.5">
          <label className="text-xs md:text-sm font-medium text-origen-bosque">
            Mensaje <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={5}
            value={form.message}
            onChange={e => { setForm(p => ({ ...p, message: e.target.value })); clearError('message'); }}
            placeholder="Describe tu consulta en detalle..."
            className={cn(
              "w-full px-3 md:px-4 py-3 text-sm bg-surface-alt border rounded-xl resize-none",
              "focus:outline-none focus:ring-2 focus:ring-origen-pradera/20 transition-all duration-200",
              errors.message ? "border-red-300 focus:border-red-400 focus:ring-red-200" : "border-border focus:border-origen-pradera"
            )}
          />
          {errors.message && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" />{errors.message}
            </p>
          )}
        </div>

        {/* Privacidad */}
        <div className="space-y-1">
          <div className="flex items-start gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.privacy}
              onClick={() => { setForm(p => ({ ...p, privacy: !p.privacy })); clearError('privacy'); }}
              className={cn(
                "mt-0.5 w-4 h-4 rounded border transition-all flex-shrink-0",
                "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
                form.privacy
                  ? "bg-origen-bosque border-origen-bosque"
                  : errors.privacy
                    ? "border-red-400 hover:border-feedback-danger"
                    : "border-border hover:border-origen-pradera"
              )}
            >
              {form.privacy && (
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <label className="text-xs text-muted-foreground leading-relaxed">
              He leído y acepto la{' '}
              <a href="/privacidad" className="text-origen-pradera hover:text-origen-bosque underline transition-colors">Política de privacidad</a>.
              Mis datos serán usados exclusivamente para responder a esta consulta.
            </label>
          </div>
          {errors.privacy && (
            <p className="text-xs text-feedback-danger flex items-center gap-1 ml-7">
              <AlertCircle className="w-3 h-3" />{errors.privacy}
            </p>
          )}
        </div>

        {/* Separador */}
        <div className="border-t border-origen-crema/40 pt-4">
          <div className="flex justify-center">
            <Button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className={cn(
                "w-full max-w-xs h-11 md:h-12",
                "bg-origen-bosque hover:bg-origen-pino",
                "text-white text-sm font-semibold",
                "rounded-xl shadow-md hover:shadow-lg",
                "transition-all transform hover:-translate-y-0.5",
                "disabled:opacity-50 disabled:hover:translate-y-0"
              )}
            >
              {status === 'loading' ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </div>
              ) : status === 'success' ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Mensaje enviado
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Enviar mensaje
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* Banner de éxito */}
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 p-4 bg-origen-crema/50 border border-origen-pradera/30 rounded-xl"
            >
              <div className="w-8 h-8 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-origen-pradera" />
              </div>
              <div>
                <p className="text-sm font-semibold text-origen-bosque">¡Mensaje enviado con éxito!</p>
                <p className="text-xs text-muted-foreground mt-0.5">Nos pondremos en contacto contigo en menos de 24 horas.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
