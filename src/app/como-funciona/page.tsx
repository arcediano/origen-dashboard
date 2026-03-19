/**
 * Página Cómo Funciona - Origen Marketplace
 * @module app/como-funciona/page
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  Sparkles,
  CheckCircle,
  UserPlus,
  Settings,
  Upload,
  ShoppingCart,
  Search,
  CreditCard,
  Truck,
  HeadphonesIcon,
  ChevronRight,
} from 'lucide-react';

const producerSteps = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Registro sencillo',
    description: 'Completa el formulario con tus datos básicos. Revisión personalizada en menos de 48 horas.',
    features: ['Formulario en 5 pasos', 'Revisión en 24-48h', 'Sin coste de alta'],
  },
  {
    icon: Settings,
    step: '02',
    title: 'Configura tu perfil',
    description: 'Añade información detallada sobre tu negocio, historia y los valores que te diferencian.',
    features: ['Perfil personalizado', 'Historia del productor', 'Galería de fotos'],
  },
  {
    icon: Upload,
    step: '03',
    title: 'Publica tus productos',
    description: 'Sube fotos, descripciones y precios. Nuestro equipo te ayuda a optimizar cada ficha.',
    features: ['Fichas optimizadas SEO', 'Gestión de stock', 'Variantes y atributos'],
  },
  {
    icon: ShoppingCart,
    step: '04',
    title: 'Gestiona pedidos',
    description: 'Recibe notificaciones en tiempo real, gestiona envíos y cobra de forma segura con Stripe.',
    features: ['Cobro automático', 'Panel de pedidos', 'Logística integrada'],
  },
];

const buyerSteps = [
  {
    icon: Search,
    step: '01',
    title: 'Descubre productos',
    description: 'Explora el catálogo de artículos artesanales de alta calidad de productores verificados.',
    features: ['Filtros avanzados', 'Búsqueda por región', 'Sello de autenticidad'],
  },
  {
    icon: CreditCard,
    step: '02',
    title: 'Compra segura',
    description: 'Proceso de pago protegido con Stripe. Garantía de devolución en todos los pedidos.',
    features: ['Pago con tarjeta', 'Garantía de devolución', 'Factura automática'],
  },
  {
    icon: Truck,
    step: '03',
    title: 'Entrega directa',
    description: 'Recibe tus productos directamente del productor, con seguimiento en tiempo real.',
    features: ['Seguimiento en tiempo real', 'Entrega en 24-72h', 'Packaging sostenible'],
  },
  {
    icon: HeadphonesIcon,
    step: '04',
    title: 'Soporte dedicado',
    description: 'Nuestro equipo está disponible para ayudarte en cada paso de tu experiencia.',
    features: ['Chat en tiempo real', 'Teléfono y email', 'Resolución en 4h'],
  },
];

function StepCard({ step }: { step: typeof producerSteps[0] }) {
  const Icon = step.icon;
  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-origen-bosque/4 to-origen-hoja/5 rounded-2xl transform group-hover:scale-[1.02] transition-transform duration-300" />
      <div className="relative bg-surface-alt rounded-2xl p-5 md:p-8 shadow-lg border border-border group-hover:border-origen-hoja group-hover:shadow-xl transition-all duration-300">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <Icon className="w-5 h-5 md:w-7 md:h-7 text-origen-bosque" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-origen-pradera uppercase tracking-wider mb-1">Paso {step.step}</div>
            <h3 className="text-base md:text-xl font-bold text-origen-bosque">{step.title}</h3>
          </div>
        </div>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4">{step.description}</p>
        <div className="space-y-2">
          {step.features.map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-origen-hoja/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
              </div>
              <span className="text-xs md:text-sm text-foreground">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HowItWorksPage() {
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
              <span className="text-xs md:text-sm font-semibold text-origen-bosque">Simple, transparente y sin sorpresas</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-origen-bosque">
              Cómo{' '}
              <span className="text-origen-hoja">funciona</span>
            </h1>
            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Conectamos directamente a productores artesanales con compradores que valoran la autenticidad
            </p>
          </div>

          {/* Dos columnas: productores / compradores */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

            {/* Productores */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center">
                  <Store className="w-5 h-5 text-origen-bosque" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-origen-bosque">Para productores</h2>
              </div>
              <div className="space-y-4">
                {producerSteps.map((step, i) => (
                  <StepCard key={i} step={step} />
                ))}
              </div>
            </div>

            {/* Compradores */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-border">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center">
                  <Search className="w-5 h-5 text-origen-bosque" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-origen-bosque">Para compradores</h2>
              </div>
              <div className="space-y-4">
                {buyerSteps.map((step, i) => (
                  <StepCard key={i} step={step} />
                ))}
              </div>
            </div>
          </div>

          {/* CTA final */}
          <div className="mt-12 md:mt-20 text-center">
            <div className="bg-surface-alt rounded-3xl p-8 md:p-12 border border-origen-hoja/30 shadow-origen max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                {['15% comisión', '0€ alta', '24h soporte'].map((item) => (
                  <div key={item} className="inline-flex items-center gap-1.5 bg-origen-crema/60 rounded-full px-3 py-1 border border-origen-hoja/20">
                    <CheckCircle className="w-3.5 h-3.5 text-origen-hoja" />
                    <span className="text-xs font-medium text-origen-bosque">{item}</span>
                  </div>
                ))}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-origen-bosque mb-3">
                Empieza hoy sin compromiso
              </h2>
              <p className="text-muted-foreground mb-6 md:mb-8">
                Sin costes fijos, sin permanencia. Solo pagas cuando vendes.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-origen-bosque hover:bg-origen-pino text-white font-semibold px-8 py-3 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
              >
                <Store className="w-5 h-5" />
                Registrarme como productor
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
