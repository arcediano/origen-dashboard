/**
 * @file final-cta-section.tsx
 * @description Sección Final CTA - Contacto y soporte
 * @version 2.0.0 - Manual de Marca v3.0 "Bosque Profundo"
 * @author Equipo de Desarrollo Origen
 * @created Marzo 2026
 */

'use client';

import { Button } from '@origen/ux-library';
import { MessageSquare, Phone, Mail, HelpCircle, Shield, Clock, Users } from 'lucide-react';

export function FinalCTASection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-origen-crema/30 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-2 bg-origen-pastel/60 text-origen-bosque rounded-full px-4 py-2 mb-5 md:mb-6 border border-origen-pradera/20">
              <HelpCircle className="w-4 h-4 text-origen-hoja" />
              <span className="text-sm font-medium">
                ¿Necesitas ayuda personalizada? Estamos aquí para ti
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-origen-bosque mb-4 md:mb-5">
              ¿Tienes dudas sobre el proceso?
              <span className="block text-origen-hoja mt-1 md:mt-2">Habla con nuestro equipo</span>
            </h2>

            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Nuestros especialistas en productores locales te guiarán en cada paso,
              desde el registro hasta tu primera venta. Respuesta garantizada en menos de 24h.
            </p>
          </div>

          {/* Estadísticas de soporte - Mini KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-12 max-w-3xl mx-auto">
            {[
              { value: '24h', label: 'Respuesta máxima', accent: 'border-l-origen-hoja' },
              { value: '98%', label: 'Satisfacción', accent: 'border-l-origen-pradera' },
              { value: 'ES/EN', label: 'Idiomas soporte', accent: 'border-l-origen-pradera' },
              { value: '5★', label: 'Valoración', accent: 'border-l-origen-hoja' },
            ].map(({ value, label, accent }) => (
              <div key={value} className={`bg-surface-alt rounded-xl p-4 text-center border border-border-subtle border-l-4 ${accent} shadow-sm hover:shadow-md transition-shadow`}>
                <div className="text-2xl md:text-3xl font-bold text-origen-bosque mb-1">{value}</div>
                <div className="text-xs md:text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>

          {/* Opciones de contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
            {[
              { icon: MessageSquare, title: 'Chat en vivo', detail: 'Respuesta instantánea', sub: 'L-V 9:00-18:00', badge: 'Disponible ahora' },
              { icon: Phone, title: 'Teléfono directo', detail: '+34 900 123 456', sub: 'L-V 9:00-18:00', note: 'Llamada nacional' },
              { icon: Mail, title: 'Email prioritario', detail: 'soporte@origen.es', sub: 'Respuesta en menos de 24h', note: '7 días a la semana' },
            ].map(({ icon: Icon, title, detail, sub, note, badge }) => (
              <div key={title} className="group relative">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-origen-bosque/4 to-transparent group-hover:scale-[1.02] transition-transform duration-300" />
                <div className="relative bg-surface-alt rounded-2xl p-6 md:p-7 border border-origen-pradera/20 hover:border-origen-hoja/40 transition-all duration-300 shadow-md hover:shadow-lg text-center">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center mb-4 mx-auto shadow-sm">
                    <Icon className="w-6 h-6 text-origen-bosque" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold mb-2 text-origen-bosque">{title}</h3>
                  <p className="text-origen-bosque text-sm font-medium mb-1">{detail}</p>
                  <p className="text-muted-foreground text-xs">{sub}</p>
                  {note && <p className="text-text-subtle text-xs mt-0.5">{note}</p>}
                  {badge && (
                    <div className="mt-3">
                      <span className="text-xs bg-gradient-to-r from-origen-bosque to-origen-pino text-white px-3 py-1 rounded-full font-medium">{badge}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div className="text-center">
            <div className="bg-surface-alt rounded-2xl p-6 md:p-7 max-w-2xl mx-auto mb-6 border border-origen-pradera/20 shadow-md">
              <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-5">
                ¿Prefieres explorar por tu cuenta? Tenemos recursos detallados
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-origen-bosque/50 text-origen-bosque hover:bg-origen-pastel hover:border-origen-bosque px-6 py-3 text-sm md:text-base"
                >
                  Ver preguntas frecuentes
                </Button>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-origen-bosque to-origen-pino hover:from-origen-pino hover:to-origen-bosque text-white px-6 py-3 text-sm md:text-base shadow-md hover:shadow-lg transition-all"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Contactar con soporte
                  </span>
                </Button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-text-subtle text-xs">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-origen-hoja" />
                <span>Datos protegidos LOPD/RGPD</span>
              </div>
              <span className="hidden md:block w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-origen-hoja" />
                <span>Respuesta garantizada 24h</span>
              </div>
              <span className="hidden md:block w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3 text-origen-hoja" />
                <span>Equipo especializado en productores</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

FinalCTASection.displayName = 'FinalCTASection';
