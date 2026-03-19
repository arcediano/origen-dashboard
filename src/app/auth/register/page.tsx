/**
 * Página de Registro - Origen Marketplace
 * @module app/auth/register/page
 * @version 3.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 * @description Landing page completa para captación de productores con formulario integrado
 *
 * @author Equipo de Desarrollo Origen
 * @created Marzo 2026
 */

import { SimpleRegistration } from '@/components/features/registration/SimpleRegistration';
import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import { HeroSection } from '@/components/features/landing/components/sections/hero-section';
import { BenefitsSection } from '@/components/features/landing/components/sections/benefits-section';
import { ProcessSection } from '@/components/features/landing/components/sections/process-section';
import { TestimonialsSection } from '@/components/features/landing/components/sections/testimonials-section';
import { FinalCTASection } from '@/components/features/landing/components/sections/final-cta-section';
import { Shield } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">
      {/* Secciones de landing */}
      <HeroSection />
      <BenefitsSection />
      <ProcessSection />
      <TestimonialsSection />

      {/* Formulario de registro */}
      <section
        id="registration-form"
        className="py-10 md:py-14"
        aria-label="Formulario de registro para productores"
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-4xl mx-auto mb-8 md:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-origen-bosque mb-3 md:mb-4">
              Regístrate como productor
              <span className="block text-origen-pino">y empieza a vender hoy</span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Completa el formulario en menos de 5 minutos. Sin compromiso,
              sin costes iniciales, solo pagan cuando vendes.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <SimpleRegistration />
            <div className="mt-6 text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3 text-origen-hoja" />
                <span>Tus datos están protegidos con cifrado SSL de 256 bits</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <FinalCTASection />

      {/* Footer compartido */}
      <AuthFooter variant="register" showLegalNote />
    </div>
  );
}
