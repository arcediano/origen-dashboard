// components/register/BenefitsSection.tsx
'use client';

import { Users, Shield, Truck, Target, Package, Award, CheckCircle } from 'lucide-react';
import { MobileCardSlider } from '@/components/ui/mobile/MobileCardSlider';

export function BenefitsSection() {
  const benefits = [
    {
      icon: Users,
      title: 'Comunidad comprometida',
      description: 'Llega a miles de consumidores que valoran productos locales y de calidad.',
      features: ['Clientes conscientes', 'Reseñas auténticas', 'Comunidad activa'],
    },
    {
      icon: Shield,
      title: 'Protección total',
      description: 'Pagos seguros con Stripe y políticas claras que te respaldan.',
      features: ['Pagos seguros', 'Protección contra fraude', 'Seguro de envío'],
    },
    {
      icon: Truck,
      title: 'Logística simplificada',
      description: 'Sistema de envíos integrado y herramientas de gestión de pedidos.',
      features: ['Envíos automatizados', 'Seguimiento en tiempo real', 'Múltiples carriers'],
    },
    {
      icon: Target,
      title: 'Visibilidad garantizada',
      description: 'Posicionamiento en marketplace y campañas de marketing conjunto.',
      features: ['SEO optimizado', 'Campañas promocionales', 'Presencia en redes'],
    },
    {
      icon: Package,
      title: 'Control completo',
      description: 'Gestiona inventario, precios y disponibilidad en tiempo real.',
      features: ['Dashboard intuitivo', 'Alertas de stock', 'Estadísticas detalladas'],
    },
    {
      icon: Award,
      title: 'Sello de calidad',
      description: 'Certificación Origen que valida la autenticidad de tus productos.',
      features: ['Sello verificable', 'Confianza del cliente', 'Diferenciación'],
    },
  ];

  const BenefitCard = ({ benefit }: { benefit: typeof benefits[0] }) => {
    const Icon = benefit.icon;
    return (
      <div className="group relative h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-origen-bosque/4 to-transparent rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300" />
        <div className="relative bg-white rounded-2xl p-5 md:p-8 shadow-lg border border-gray-200 group-hover:border-origen-hoja/50 group-hover:shadow-xl transition-all duration-300 h-full">
          <div className="w-11 h-11 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-origen-pastel flex items-center justify-center mb-3 md:mb-6 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 md:w-8 md:h-8 text-origen-bosque" />
          </div>
          <h3 className="text-base md:text-2xl font-bold text-origen-bosque mb-1.5 md:mb-4">
            {benefit.title}
          </h3>
          <p className="text-gray-600 text-xs md:text-base mb-3 md:mb-6 leading-relaxed">
            {benefit.description}
          </p>
          <div className="space-y-1.5 md:space-y-3">
            {benefit.features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-2.5 h-2.5 text-origen-pradera" />
                </div>
                <span className="text-xs md:text-sm text-gray-700">{feature}</span>
              </div>
            ))}
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
          <div className="inline-flex items-center gap-2 bg-origen-pastel text-origen-bosque rounded-full px-4 py-2 mb-3 md:mb-6 border border-origen-hoja/30">
            <CheckCircle className="w-4 h-4 text-origen-pradera" />
            <span className="text-sm font-semibold">Todo en un solo lugar</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-origen-bosque mb-2 md:mb-6">
            ¿Por qué vender en Origen?
          </h2>
          {/* Solo visible en desktop */}
          <p className="hidden md:block text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Ofrecemos herramientas integrales y soporte dedicado para hacer crecer
            tu negocio local de forma sostenible
          </p>
        </div>

        {/* Móvil: slider deslizable */}
        <div className="md:hidden">
          <MobileCardSlider cardWidthClass="w-[80vw]">
            {benefits.map((benefit, index) => (
              <BenefitCard key={index} benefit={benefit} />
            ))}
          </MobileCardSlider>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} />
          ))}
        </div>

        {/* Móvil: stats compactas */}
        <div className="md:hidden mt-6 grid grid-cols-3 gap-2 text-center">
          {[
            { value: '15%', label: 'Comisión' },
            { value: '0€', label: 'Cuota fija' },
            { value: '24h', label: 'Soporte' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-origen-crema/60 rounded-xl p-3">
              <div className="text-xl font-bold text-origen-pradera">{value}</div>
              <div className="text-xs text-origen-bosque font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Desktop: resumen estadísticas */}
        <div className="hidden md:block mt-20 pt-16 border-t border-gray-200">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-3xl p-10 border border-origen-pradera/30 shadow-origen">
              <div className="grid grid-cols-3 gap-8 text-center">
                {[
                  { value: '15%', title: 'Comisión única', sub: 'Solo pagas cuando vendes' },
                  { value: '0€', title: 'Sin costes fijos', sub: 'No hay cuotas mensuales' },
                  { value: '24h', title: 'Soporte prioritario', sub: 'Respuesta en menos de 24h' },
                ].map(({ value, title, sub }) => (
                  <div key={value}>
                    <div className="text-4xl font-bold text-origen-hoja mb-3">{value}</div>
                    <h4 className="font-bold text-origen-bosque text-base mb-2">{title}</h4>
                    <p className="text-gray-600 text-sm">{sub}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-8 border-t border-origen-pradera/20 flex items-center justify-center gap-2 text-base text-origen-bosque/80">
                <CheckCircle className="w-5 h-5 text-origen-pradera" />
                <span>Sin costes ocultos • Sin permanencia • Cancelación gratuita</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
