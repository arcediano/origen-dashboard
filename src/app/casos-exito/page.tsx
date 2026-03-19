/**
 * Página de Casos de Éxito - Origen Marketplace
 * @module app/casos-exito/page
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Award,
  Star,
  TrendingUp,
  Users,
  ChevronRight,
} from 'lucide-react';

const testimonials = [
  {
    name: 'Quesería Artesanal Valle del Tajo',
    location: 'Talavera de la Reina, Toledo',
    category: 'Quesos',
    quote:
      'Gracias a Origen hemos podido expandir nuestro negocio familiar, llegando a clientes en toda España que valoran la autenticidad de nuestros quesos manchegos.',
    stat: '+120%',
    statLabel: 'Aumento de ventas',
    initials: 'QA',
  },
  {
    name: 'Viñedos de la Sierra',
    location: 'San Martín de Valdeiglesias, Madrid',
    category: 'Vinos',
    quote:
      'La plataforma nos ha permitido dar a conocer nuestros vinos ecológicos a un público que busca productos de proximidad y con historia.',
    stat: '+85%',
    statLabel: 'Nuevos clientes',
    initials: 'VS',
  },
  {
    name: 'Mieles del Mediterráneo',
    location: 'Gandía, Valencia',
    category: 'Miel',
    quote:
      'Nuestras mieles artesanales ahora llegan a restaurantes y consumidores finales que buscan productos naturales y de máxima calidad.',
    stat: '×3',
    statLabel: 'Canales de venta',
    initials: 'MM',
  },
  {
    name: 'Ecológicos del Norte',
    location: 'Logroño, La Rioja',
    category: 'Productos Ecológicos',
    quote:
      'La venta online a través de Origen ha supuesto un aumento del 40% en nuestros ingresos, permitiéndonos mantener nuestra producción ecológica.',
    stat: '+40%',
    statLabel: 'Ingresos anuales',
    initials: 'EN',
  },
];

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">

      {/* ================================================================
          HEADER
      ================================================================ */}
      <header className="sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeWidth="3"/>
                  <path d="M100 140 L100 80" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M100 90 Q85 75, 75 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 90 Q115 75, 125 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="100" cy="140" r="8" fill="white"/>
                  <circle cx="100" cy="140" r="5" fill="#74C69D"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-origen-bosque leading-tight">ORIGEN</span>
                <span className="text-[10px] md:text-xs text-origen-hoja -mt-1">Productores locales</span>
              </div>
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-surface-alt hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
            >
              <Store className="w-4 h-4 text-origen-pradera" />
              <span className="hidden sm:inline">Nuevo productor</span>
              <span className="sm:hidden">Registro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN
      ================================================================ */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-16 xl:py-20">
        <div className="max-w-7xl mx-auto">

          {/* Cabecera */}
          <div className="text-center mb-10 md:mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
              <Sparkles className="w-4 h-4 text-origen-pradera" />
              <span className="text-xs md:text-sm font-semibold text-origen-bosque">+500 productores confían en Origen</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-origen-bosque">
              Casos de{' '}
              <span className="text-origen-hoja">éxito</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Descubre cómo productores artesanales han transformado sus negocios con Origen Marketplace
            </p>
          </div>

          {/* Stats globales */}
          <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-2xl mx-auto mb-12 md:mb-20">
            {[
              { icon: TrendingUp, value: '+40%', label: 'Crecimiento medio' },
              { icon: Users, value: '+500', label: 'Productores activos' },
              { icon: Award, value: '4.9★', label: 'Valoración media' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="bg-surface-alt rounded-2xl p-4 md:p-6 border border-border shadow-sm text-center">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center mx-auto mb-2 md:mb-3">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 text-origen-bosque" />
                </div>
                <div className="text-xl md:text-3xl font-bold text-origen-hoja">{value}</div>
                <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Tarjetas de testimonios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {testimonials.map((t, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-origen-bosque/4 to-origen-hoja/5 rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300" />
                <div className="relative bg-surface-alt rounded-2xl p-6 md:p-8 shadow-lg border border-border group-hover:border-origen-hoja group-hover:shadow-xl transition-all duration-300">

                  {/* Cabecera tarjeta */}
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <span className="text-sm font-bold text-origen-bosque">{t.initials}</span>
                      </div>
                      <div>
                        <h3 className="text-sm md:text-base font-bold text-origen-bosque leading-tight">{t.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.location}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center bg-origen-pastel text-origen-bosque rounded-full px-3 py-1 text-xs font-semibold border border-origen-hoja/30 flex-shrink-0 ml-2">
                      {t.category}
                    </span>
                  </div>

                  {/* Estrellas */}
                  <div className="flex items-center gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-origen-pradera fill-origen-pradera" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote className="text-sm md:text-base text-muted-foreground leading-relaxed mb-5 italic">
                    "{t.quote}"
                  </blockquote>

                  {/* Stat */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border-subtle">
                    <div className="w-8 h-8 rounded-lg bg-origen-hoja/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-origen-hoja" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-origen-hoja">{t.stat}</span>
                      <span className="text-xs text-muted-foreground ml-2">{t.statLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA final */}
          <div className="mt-12 md:mt-20 text-center">
            <div className="bg-surface-alt rounded-3xl p-8 md:p-12 border border-origen-hoja/30 shadow-origen max-w-2xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-origen-bosque mb-3">
                ¿Listo para ser el siguiente caso de éxito?
              </h2>
              <p className="text-muted-foreground mb-6 md:mb-8">
                Únete a más de 500 productores que ya venden en Origen Marketplace.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-origen-bosque hover:bg-origen-pino text-white font-semibold px-8 py-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
              >
                <Store className="w-5 h-5" />
                Empieza gratis hoy
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </main>

      <AuthFooter variant="login" />
    </div>
  );
}
