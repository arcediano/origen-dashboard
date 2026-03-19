// components/register/TestimonialsSection.tsx
'use client';

import { Star, ShieldCheck } from 'lucide-react';
import { MobileCardSlider } from '../mobile-card-slider';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "María García",
      business: "Huerta Orgánica La Vega",
      quote: "Desde que me uní a Origen, mis ventas han aumentado un 40%. La plataforma es intuitiva y el soporte excelente.",
      category: "Hortalizas ecológicas",
      initials: "MG",
      bgColor: "from-origen-hoja/80 to-origen-hoja/60",
    },
    {
      name: "Carlos Rodríguez",
      business: "Aceites Montes de Toledo",
      quote: "La transparencia y comunidad de Origen son incomparables. Los clientes valoran conocer el origen del producto.",
      category: "Aceite de oliva virgen extra",
      initials: "CR",
      bgColor: "from-origen-pino to-origen-bosque",
    },
    {
      name: "Ana Martínez",
      business: "Quesería Artesana Valle",
      quote: "El sistema de pagos seguro y la logística integrada me han ahorrado horas de gestión semanal.",
      category: "Quesos artesanales",
      initials: "AM",
      bgColor: "from-origen-menta/80 to-origen-menta/60",
    },
  ];

  const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <div className="group relative h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-origen-bosque/4 to-transparent rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300" />
      <div className="relative bg-surface-alt rounded-2xl p-5 md:p-8 shadow-lg md:shadow-xl border border-border group-hover:border-origen-hoja/50 transition-all h-full flex flex-col">
        <div className="flex items-center mb-3 md:mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-4 h-4 md:w-6 md:h-6 text-yellow-400 fill-current" />
          ))}
        </div>
        <p className="text-foreground text-sm md:text-lg italic mb-4 md:mb-8 leading-relaxed flex-1">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <div className="flex items-center gap-3 pt-3 md:pt-6 border-t border-border-subtle">
          <div className={`w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br ${testimonial.bgColor} rounded-xl md:rounded-2xl flex items-center justify-center text-white text-sm md:text-2xl font-bold shadow-md flex-shrink-0`}>
            {testimonial.initials}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-origen-bosque text-sm md:text-xl truncate">
              {testimonial.name}
            </h4>
            <p className="text-muted-foreground text-xs md:text-base truncate">
              {testimonial.business}
            </p>
            <p className="text-xs text-origen-hoja font-semibold mt-0.5 truncate">
              {testimonial.category}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section className="py-10 md:py-16 lg:py-20">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Cabecera */}
        <div className="text-center max-w-3xl mx-auto mb-7 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-origen-hoja/10 text-origen-bosque rounded-full px-4 py-2 mb-3 md:mb-6 border border-origen-hoja/30">
            <span className="text-sm font-semibold">❤️ Comentarios reales</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-origen-bosque mb-2 md:mb-6">
            Historias de éxito que
            <span className="block text-origen-hoja">inspiran</span>
          </h2>
          <p className="hidden md:block text-xl text-muted-foreground">
            Descubre cómo otros productores locales han transformado su negocio con Origen
          </p>
        </div>

        {/* Móvil: slider */}
        <div className="md:hidden">
          <MobileCardSlider cardWidthClass="w-[83vw]">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} testimonial={testimonial} />
            ))}
          </MobileCardSlider>
        </div>

        {/* Desktop: grid 3 columnas */}
        <div className="hidden md:grid grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} />
          ))}
        </div>

        {/* Badge de confianza */}
        <div className="text-center mt-8 md:mt-16 md:pt-12 md:border-t md:border-border">
          <div className="inline-flex items-center gap-3 bg-surface-alt rounded-xl px-5 py-3 md:px-8 md:py-4 shadow-lg border border-border">
            <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-origen-pradera" />
            <div className="text-left">
              <p className="font-bold text-origen-bosque text-sm md:text-base">+500 productores verificados</p>
              <p className="text-muted-foreground text-xs md:text-sm">Comunidad en crecimiento constante</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
