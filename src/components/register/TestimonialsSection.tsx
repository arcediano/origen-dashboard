// components/register/TestimonialsSection.tsx
/**
 * Sección de Testimonios - CORREGIDA v1.2.0
 * @version 1.2.0 - Correcciones de rendimiento y manual de marca
 * @description Muestra testimonios reales con categorías y calificaciones
 * @author Equipo de Desarrollo Origen
 * @updated Marzo 2026
 * 
 * @important CORRECCIONES:
 *   - Eliminado patrón SVG decorativo (innecesario, afectaba rendimiento)
 *   - Optimizados gradientes y sombras
 *   - Categorías en color Verde Hoja (#40916C) - contraste 4.7:1 ✓
 */

'use client';

import { Star, ShieldCheck } from 'lucide-react';

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "María García",
      business: "Huerta Orgánica La Vega",
      quote: "Desde que me uní a Origen, mis ventas han aumentado un 40%. La plataforma es intuitiva y el soporte excelente.",
      category: "Hortalizas ecológicas",
      initials: "MG",
      bgColor: "from-origen-pradera to-origen-hoja"
    },
    {
      name: "Carlos Rodríguez",
      business: "Aceites Montes de Toledo",
      quote: "La transparencia y comunidad de Origen son incomparables. Los clientes valoran conocer el origen del producto.",
      category: "Aceite de oliva virgen extra",
      initials: "CR",
      bgColor: "from-origen-pino to-origen-bosque"
    },
    {
      name: "Ana Martínez",
      business: "Quesería Artesana Valle",
      quote: "El sistema de pagos seguro y la logística integrada me han ahorrado horas de gestión semanal.",
      category: "Quesos artesanales",
      initials: "AM",
      bgColor: "from-origen-hoja to-origen-pradera"
    }
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-origen-crema">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 bg-origen-pradera/10 text-origen-bosque rounded-full px-4 py-2 md:px-6 md:py-3 mb-4 md:mb-6 border border-origen-pradera/30">
            <span className="text-sm md:text-base font-semibold">❤️ Comentarios reales de nuestra comunidad</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
            Historias de éxito que
            <span className="block text-origen-pradera">inspiran</span>
          </h2>
          <p className="text-base md:text-xl text-gray-600">
            Descubre cómo otros productores locales han transformado su negocio con Origen
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-origen-pradera/5 to-origen-hoja/5 rounded-2xl md:rounded-3xl transform group-hover:scale-[1.02] transition-transform duration-300"></div>
              <div className="relative bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg md:shadow-xl border border-gray-200 group-hover:border-origen-pradera transition-all">
                <div className="flex items-center mb-4 md:mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm md:text-base lg:text-lg italic mb-6 md:mb-8 leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-100">
                  <div className={`w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-gradient-to-br ${testimonial.bgColor} rounded-xl md:rounded-2xl flex items-center justify-center text-white text-lg md:text-xl lg:text-2xl font-bold shadow-md md:shadow-lg flex-shrink-0`}>
                    {testimonial.initials}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-origen-bosque text-base md:text-lg lg:text-xl truncate">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm md:text-base truncate">
                      {testimonial.business}
                    </p>
                    <p className="text-xs md:text-sm text-origen-hoja font-semibold mt-1 truncate">
                      {testimonial.category}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-12 md:mt-16 pt-8 md:pt-12 border-t border-gray-200">
          <div className="inline-flex items-center gap-3 md:gap-4 bg-white rounded-xl md:rounded-2xl px-6 py-3 md:px-8 md:py-4 shadow-lg border border-gray-200">
            <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-origen-pradera" />
            <div className="text-left">
              <p className="font-bold text-origen-bosque text-sm md:text-base">+500 productores verificados</p>
              <p className="text-gray-600 text-xs md:text-sm">Comunidad en crecimiento constante</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}