// app/login/page.tsx
/**
 * Página de Login - Origen Marketplace
 * @module app/login/page
 * @version 5.3.0 - CORREGIDO: Eliminados todos los usos de Menta (#06D6A0)
 * @description Página de acceso para productores con mismo estilo que registro
 */

import { SimpleLogin } from '@/components/auth/SimpleLogin';
import Link from 'next/link';
import { 
  Shield, 
  Leaf, 
  ArrowRight,
  Sparkles,
  Heart,
  CheckCircle,
  Store,
  Award,
  Clock,
  TrendingUp,
  Users,
  Globe,
  ChevronRight,
  Mail,
  Phone
} from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/" 
              // CORREGIDO: focus:ring-origen-menta → focus:ring-origen-pradera
              className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1"
            >
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <svg 
                  className="w-6 h-6 md:w-7 md:h-7 text-white" 
                  viewBox="0 0 200 200"
                >
                  <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeWidth="3"/>
                  <path d="M100 140 L100 80" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M100 90 Q85 75, 75 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 90 Q115 75, 125 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="100" cy="140" r="8" fill="white"/>
                  {/* CORREGIDO: #06D6A0 → #74C69D (Verde Pradera) */}
                  <circle cx="100" cy="140" r="5" fill="#74C69D"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-origen-bosque leading-tight">ORIGEN</span>
                <span className="text-[10px] md:text-xs text-origen-hoja -mt-1">
                  Productores locales
                </span>
              </div>
            </Link>
            
            <Link 
              href="/auth/register" 
              // CORREGIDO: focus:ring-origen-menta → focus:ring-origen-pradera
              className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-white hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
            >
              <Store className="w-4 h-4 text-origen-pradera" />
              <span className="hidden sm:inline">Nuevo productor</span>
              <span className="sm:hidden">Registro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-16 xl:py-20">
        <div className="max-w-7xl mx-auto">

          {/* Hero compacto — solo móvil */}
          <div className="lg:hidden text-center mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
              <Sparkles className="w-4 h-4 text-origen-pradera" />
              <span className="text-xs font-semibold text-origen-bosque">Espacio exclusivo para productores</span>
            </div>
            <h1 className="text-2xl font-bold text-origen-bosque">
              Bienvenido a tu{' '}
              <span className="text-origen-pradera">panel de control</span>
            </h1>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Gestiona tu tienda, analiza tus ventas y haz crecer tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* COLUMNA IZQUIERDA - 6/12 — oculta en móvil */}
            <div className="hidden lg:block lg:col-span-6 space-y-8 lg:pr-8 xl:pr-12">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
                <Sparkles className="w-4 h-4 text-origen-pradera" />
                <span className="text-xs md:text-sm font-semibold text-origen-bosque">
                  Espacio exclusivo para productores
                </span>
              </div>
              
              {/* Título - EXACTAMENTE IGUAL QUE EN REGISTER PAGE */}
              <div className="text-left max-w-xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
                  Bienvenido a tu
                  <span className="block text-origen-hoja">panel de control</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                  Gestiona tu tienda, analiza tus ventas y haz crecer tu negocio 
                  con las herramientas diseñadas para productores locales.
                </p>
              </div>
              
              {/* Stats - CORREGIDOS */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  { 
                    value: '+500', 
                    label: 'Productores', 
                    icon: Users, 
                    // CORREGIDO: Eliminado origen-menta/60
                    color: 'from-origen-pradera/60 to-origen-hoja/60' 
                  },
                  { 
                    value: '50k+', 
                    label: 'Compradores', 
                    icon: Globe, 
                    color: 'from-origen-pradera/60 to-origen-hoja/60' 
                  },
                  { 
                    value: '+40%', 
                    label: 'Crecimiento', 
                    icon: TrendingUp, 
                    color: 'from-origen-hoja/60 to-origen-pino/60' 
                  },
                  { 
                    value: '24h', 
                    label: 'Soporte', 
                    icon: Clock, 
                    color: 'from-origen-pino/60 to-origen-bosque/60' 
                  }
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <div key={index} className="group">
                      <div className="bg-white rounded-xl p-4 border border-gray-200 group-hover:border-origen-pradera transition-all duration-300 hover:shadow-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-xl font-bold text-origen-bosque">{stat.value}</div>
                            <div className="text-xs text-gray-500">{stat.label}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Beneficios - CORREGIDOS */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-origen-pradera" />
                  Todo incluido en tu cuenta
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Dashboard en tiempo real',
                    'Gestión de inventario',
                    'Análisis de ventas',
                    'Soporte prioritario 24/7'
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      {/* CORREGIDO: bg-origen-menta/10 → bg-origen-pradera/10 */}
                      <div className="w-5 h-5 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                        {/* CORREGIDO: text-origen-menta → text-origen-pradera */}
                        <CheckCircle className="w-3 h-3 text-origen-pradera" />
                      </div>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* COLUMNA DERECHA - 6/12 */}
            <div className="lg:col-span-6">
              <div className="lg:pl-8 xl:pl-12">
                <SimpleLogin />
                
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 bg-white rounded-full px-5 py-2.5 border border-gray-200 shadow-sm hover:border-origen-pradera transition-all">
                    <span className="text-sm text-gray-600">💬 ¿Problemas para acceder?</span>
                    <Link 
                      href="/soporte" 
                      className="text-sm font-medium text-origen-pradera hover:text-origen-bosque transition-colors flex items-center gap-1"
                    >
                      Contactar soporte
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-origen-bosque mt-8 md:mt-16 lg:mt-20">
        <div className="container mx-auto px-4 md:px-6 pt-10 pb-6 md:pt-14 md:pb-8">

          {/* Móvil: footer mínimo */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-origen-pino flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 200 200" aria-hidden="true">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="3"/>
                    <path d="M100 140 L100 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                    <path d="M100 90 Q85 75, 75 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M100 90 Q115 75, 125 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <circle cx="100" cy="140" r="8" fill="currentColor"/>
                    <circle cx="100" cy="140" r="5" fill="#52B788"/>
                  </svg>
                </div>
                <span className="text-base font-bold text-white">ORIGEN</span>
              </div>
              <Link href="/auth/register" className="text-xs font-medium text-origen-menta hover:text-white transition-colors flex items-center gap-1">
                <Store className="w-3 h-3" />
                Nuevo productor
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-6">
              {[
                { href: '/privacidad', label: 'Privacidad' },
                { href: '/cookies', label: 'Cookies' },
                { href: '/aviso-legal', label: 'Aviso Legal' },
                { href: '/soporte', label: 'Soporte' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-white/70 hover:text-white transition-colors">
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-[10px] text-white/70">
                © {new Date().getFullYear()} Origen Marketplace
              </p>
              <div className="flex items-center gap-3 text-[10px] text-white/70">
                <span className="flex items-center gap-0.5"><Shield className="w-3 h-3 text-origen-menta" /> SSL</span>
                <span className="flex items-center gap-0.5"><Globe className="w-3 h-3 text-origen-menta" /> RGPD</span>
              </div>
            </div>
          </div>

          {/* Desktop: footer completo */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

              {/* Columna 1: Marca */}
              <div className="lg:col-span-4 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-origen-pino flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 200 200" aria-hidden="true">
                      <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <path d="M100 140 L100 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                      <path d="M100 90 Q85 75, 75 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M100 90 Q115 75, 125 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <circle cx="100" cy="140" r="8" fill="currentColor"/>
                      <circle cx="100" cy="140" r="5" fill="#52B788"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white">ORIGEN</div>
                    <div className="text-xs text-origen-menta italic">Conoce de dónde viene lo que comes</div>
                  </div>
                </div>
                <p className="text-sm text-white/80 leading-relaxed max-w-sm">
                  Marketplace que conecta productores locales españoles con consumidores
                  que valoran la autenticidad, la transparencia y la sostenibilidad.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { icon: Leaf, label: 'Sostenibilidad' },
                    { icon: Shield, label: 'Transparencia' },
                    { icon: Heart, label: 'Comunidad' },
                    { icon: Globe, label: 'Kilómetro 0' },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium text-white border border-white/20">
                      <Icon className="w-3 h-3 text-origen-menta" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Columna 2: Productores */}
              <div className="lg:col-span-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Productores</h3>
                <ul className="space-y-3">
                  {[
                    { href: '/como-funciona', label: 'Cómo funciona' },
                    { href: '/tarifas', label: 'Tarifas y comisiones' },
                    { href: '/soporte', label: 'Soporte especializado' },
                    { href: '/casos-exito', label: 'Casos de éxito' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group">
                        <ChevronRight className="w-3 h-3 text-origen-menta/70 group-hover:translate-x-0.5 transition-transform" />
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2">
                    <Link href="/auth/register" className="text-sm font-medium text-origen-menta hover:text-white transition-colors inline-flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      Nuevo productor
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Legal */}
              <div className="lg:col-span-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Legal</h3>
                <ul className="space-y-3">
                  {[
                    { href: '/privacidad', label: 'Política de Privacidad' },
                    { href: '/cookies', label: 'Política de Cookies' },
                    { href: '/aviso-legal', label: 'Aviso Legal' },
                    { href: '/soporte', label: 'Contacto' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group">
                        <ChevronRight className="w-3 h-3 text-origen-menta/70 group-hover:translate-x-0.5 transition-transform" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Columna 4: Contacto */}
              <div className="lg:col-span-4">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Contacto</h3>
                <div className="bg-white/10 rounded-xl p-5 space-y-3 border border-white/10">
                  {[
                    { icon: Mail, label: 'Email', value: 'info@origen.es' },
                    { icon: Phone, label: 'Teléfono', value: '+34 900 123 456' },
                    { icon: Clock, label: 'Horario', value: 'L-V, 9:00 - 18:00' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-origen-menta" />
                      </div>
                      <div>
                        <p className="text-xs text-white/70">{label}</p>
                        <p className="font-medium text-white">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Shield className="w-3.5 h-3.5 text-origen-menta" /><span>SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Globe className="w-3.5 h-3.5 text-origen-menta" /><span>RGPD</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Heart className="w-3.5 h-3.5 text-origen-menta" /><span>Pagos seguros</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 pt-6 border-t border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <p className="text-xs text-white/70">
                  © {new Date().getFullYear()} Origen Marketplace. Todos los derechos reservados.
                </p>
                <p className="text-xs text-white/70">Versión 5.3.0 • Acceso productores</p>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}