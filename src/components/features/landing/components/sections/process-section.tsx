// components/register/ProcessSection.tsx
'use client';

import { Button } from '@arcediano/ux-library';
import { ArrowRight, CheckCircle, FileText, Users, Settings, Package } from 'lucide-react';
import { MobileCardSlider } from '../mobile-card-slider';

export function ProcessSection() {
  const steps = [
    {
      number: 1,
      title: 'Registro simple',
      description: 'Formulario rápido de 5 minutos',
      icon: FileText,
    },
    {
      number: 2,
      title: 'Revisión personal',
      description: 'Nuestro equipo evalúa tu perfil',
      icon: Users,
    },
    {
      number: 3,
      title: 'Configuración',
      description: 'Completas tu tienda online',
      icon: Settings,
    },
    {
      number: 4,
      title: '¡Primera venta!',
      description: 'Empiezas a vender y crecer',
      icon: Package,
    },
  ];

  const StepCard = ({ step, index }: { step: typeof steps[0]; index: number }) => {
    const Icon = step.icon;
    return (
      <div className="group relative h-full">
        <div className="bg-surface-alt rounded-2xl p-5 md:p-8 shadow-lg md:shadow-xl border border-border hover:border-origen-hoja hover:shadow-2xl transition-all duration-300 h-full">
          <div className="relative mb-4 md:mb-6">
            <div className="absolute -top-1 -right-1">
              <div className="w-7 h-7 md:w-10 md:h-10 rounded-full bg-surface-alt shadow-md flex items-center justify-center border border-origen-crema">
                <span className="text-xs md:text-sm font-bold text-origen-bosque">0{step.number}</span>
              </div>
            </div>
            <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center mx-auto mb-3 md:mb-6">
              <Icon className="w-7 h-7 md:w-10 md:h-10 text-origen-bosque" />
            </div>
          </div>
          <h3 className="text-base md:text-2xl font-bold text-origen-bosque mb-1.5 md:mb-3 text-center">
            {step.title}
          </h3>
          <p className="text-muted-foreground text-xs md:text-base text-center mb-3 md:mb-6">
            {step.description}
          </p>
          <div className="text-center">
            <div className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium px-3 py-1.5 rounded-full bg-origen-crema border border-origen-hoja/30">
              {index === 0 ? (
                <>
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-origen-hoja" />
                  <span className="text-origen-hoja">Empieza aquí</span>
                </>
              ) : (
                <span className="text-muted-foreground">{index === 3 ? '¡Objetivo!' : 'Paso siguiente'}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="py-10 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Cabecera */}
        <div className="text-center max-w-4xl mx-auto mb-7 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-origen-bosque mb-2 md:mb-6">
            Un camino claro hacia
            <span className="block text-origen-hoja">tu éxito online</span>
          </h2>
          <p className="hidden md:block text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Desde tu registro hasta tu primera venta, te acompañamos en cada paso
            con herramientas simples y soporte personalizado.
          </p>
        </div>

        {/* Móvil: slider */}
        <div className="md:hidden">
          <MobileCardSlider cardWidthClass="w-[75vw]">
            {steps.map((step, index) => (
              <StepCard key={index} step={step} index={index} />
            ))}
          </MobileCardSlider>
        </div>

        {/* Desktop: grid 4 columnas */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 lg:gap-6 relative">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <StepCard step={step} index={index} />
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="w-6 h-6 bg-surface-alt border-2 border-origen-pradera rounded-full flex items-center justify-center">
                    <ArrowRight className="w-3 h-3 text-origen-pradera" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-10 md:mt-16">
          <div className="hidden md:block bg-surface-alt rounded-3xl p-8 max-w-2xl mx-auto border border-origen-pradera/30 shadow-subtle mb-8">
            <p className="text-xl text-origen-bosque mb-4 font-semibold">
              ¿Listo para dar el primer paso?
            </p>
            <p className="text-muted-foreground text-base mb-6">
              Completa el formulario de registro y nuestro equipo contactará contigo
              para ayudarte con la configuración inicial.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full md:w-auto"
            onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="flex items-center justify-center gap-2 md:gap-3">
              Completar registro ahora
              <ArrowRight className="w-4 h-4 md:w-6 md:h-6" />
            </span>
          </Button>
        </div>
      </div>
    </section>
  );
}

