// app/recuperar/page.tsx
/**
 * Página de Recuperación de Contraseña - Origen Marketplace
 * @module app/recuperar/page
 * @description Página para solicitar el restablecimiento de contraseña
 */

import { SimpleForgotPassword } from '@/components/forms/SimpleForgotPassword';
import Link from 'next/link';
import {
  Shield,
  Leaf,
  ArrowRight,
  Sparkles,
  Heart,
  CheckCircle,
  Store,
  Lock,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function RecuperarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema/30">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200">
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
              href="/auth/login"
              className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-white hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
            >
              <Store className="w-4 h-4 text-origen-pradera" />
              <span className="hidden sm:inline">Iniciar sesión</span>
              <span className="sm:hidden">Acceder</span>
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
              <ShieldCheck className="w-4 h-4 text-origen-pradera" />
              <span className="text-xs font-semibold text-origen-bosque">Recuperación segura</span>
            </div>
            <h1 className="text-2xl font-bold text-origen-bosque">
              Recupera tu{' '}
              <span className="text-origen-pradera">contraseña</span>
            </h1>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Te enviaremos un enlace seguro para restablecer tu contraseña.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* COLUMNA IZQUIERDA — oculta en móvil */}
            <div className="hidden lg:block lg:col-span-6 space-y-8 lg:pr-8 xl:pr-12">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
                <ShieldCheck className="w-4 h-4 text-origen-pradera" />
                <span className="text-xs md:text-sm font-semibold text-origen-bosque">
                  Recuperación segura de cuenta
                </span>
              </div>

              {/* Título */}
              <div className="text-left max-w-xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
                  Recupera el acceso
                  <span className="block text-origen-pradera">a tu panel</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                  Sin acceso a tu cuenta no puedes gestionar tu tienda.
                  Restablece tu contraseña en menos de 2 minutos.
                </p>
              </div>

              {/* Pasos */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-origen-pradera" />
                  Cómo funciona
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      step: '1',
                      title: 'Introduce tu email',
                      desc: 'El email con el que te registraste en Origen',
                    },
                    {
                      step: '2',
                      title: 'Revisa tu correo',
                      desc: 'Recibirás un enlace seguro en menos de 2 minutos',
                    },
                    {
                      step: '3',
                      title: 'Crea tu nueva contraseña',
                      desc: 'El enlace es válido durante 30 minutos',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-gray-200 hover:border-origen-pradera transition-all hover:shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-origen-pradera/60 to-origen-hoja/60 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white text-sm font-bold">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-origen-bosque">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seguridad */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-origen-pradera" />
                  Tu seguridad es lo primero
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Enlace de un solo uso',
                    'Expira en 30 minutos',
                    'Cifrado SSL 256-bit',
                    'Sin datos expuestos',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-origen-pradera" />
                      </div>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA — formulario */}
            <div className="lg:col-span-6">
              <div className="lg:pl-8 xl:pl-12">
                <SimpleForgotPassword />

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 bg-white rounded-full px-5 py-2.5 border border-gray-200 shadow-sm hover:border-origen-pradera transition-all">
                    <span className="text-sm text-gray-600">💬 ¿Necesitas ayuda?</span>
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
      <footer className="bg-white border-t border-gray-200 mt-8 md:mt-16 lg:mt-20">

        {/* Footer compacto — solo móvil */}
        <div className="lg:hidden px-4 py-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-origen-bosque flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeWidth="3"/>
                <path d="M100 140 L100 80" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                <path d="M100 90 Q85 75, 75 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M100 90 Q115 75, 125 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="100" cy="140" r="8" fill="white"/>
                <circle cx="100" cy="140" r="5" fill="#74C69D"/>
              </svg>
            </div>
            <span className="font-bold text-origen-bosque">ORIGEN</span>
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-4">
            <Link href="/privacidad" className="text-xs text-gray-500 hover:text-origen-pradera transition-colors">Privacidad</Link>
            <Link href="/cookies" className="text-xs text-gray-500 hover:text-origen-pradera transition-colors">Cookies</Link>
            <Link href="/aviso-legal" className="text-xs text-gray-500 hover:text-origen-pradera transition-colors">Aviso Legal</Link>
            <Link href="/soporte" className="text-xs text-gray-500 hover:text-origen-pradera transition-colors">Soporte</Link>
          </div>
          <p className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Origen Marketplace
          </p>
        </div>

        {/* Footer completo — solo desktop */}
        <div className="hidden lg:block pt-12 pb-8">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

              <div className="lg:col-span-4 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-origen-bosque flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeWidth="3"/>
                      <path d="M100 140 L100 80" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                      <path d="M100 90 Q85 75, 75 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M100 90 Q115 75, 125 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                      <circle cx="100" cy="140" r="8" fill="white"/>
                      <circle cx="100" cy="140" r="5" fill="#74C69D"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-origen-bosque">ORIGEN</div>
                    <div className="text-xs text-origen-hoja italic">Conoce de dónde viene lo que comes</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed max-w-sm">
                  Marketplace que conecta productores locales españoles con consumidores
                  que valoran la autenticidad, la transparencia y la sostenibilidad.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-origen-crema/80 text-xs font-medium text-origen-bosque">
                    <Leaf className="w-3 h-3 text-origen-pradera" />
                    Sostenibilidad
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-origen-crema/80 text-xs font-medium text-origen-bosque">
                    <Shield className="w-3 h-3 text-origen-pradera" />
                    Transparencia
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-origen-crema/80 text-xs font-medium text-origen-bosque">
                    <Heart className="w-3 h-3 text-origen-pradera" />
                    Comunidad
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider mb-4">Productores</h3>
                <ul className="space-y-3">
                  {[
                    { href: '/como-funciona', label: 'Cómo funciona' },
                    { href: '/tarifas', label: 'Tarifas y comisiones' },
                    { href: '/soporte', label: 'Soporte especializado' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-gray-600 hover:text-origen-pradera transition-colors inline-flex items-center gap-1 group">
                        <ChevronRight className="w-3 h-3 text-origen-pradera/70 group-hover:translate-x-0.5 transition-transform" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider mb-4">Legal</h3>
                <ul className="space-y-3">
                  {[
                    { href: '/privacidad', label: 'Política de Privacidad' },
                    { href: '/cookies', label: 'Política de Cookies' },
                    { href: '/aviso-legal', label: 'Aviso Legal' },
                  ].map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="text-sm text-gray-600 hover:text-origen-pradera transition-colors inline-flex items-center gap-1 group">
                        <ChevronRight className="w-3 h-3 text-origen-pradera/70 group-hover:translate-x-0.5 transition-transform" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:col-span-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider mb-4">Contacto</h3>
                <div className="bg-origen-crema/50 rounded-xl p-5 space-y-3">
                  {[
                    { icon: Mail, label: 'Email', value: 'info@origen.es' },
                    { icon: Phone, label: 'Teléfono', value: '+34 900 123 456' },
                    { icon: Clock, label: 'Horario', value: 'Lunes a Viernes, 9:00 - 18:00' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-origen-pradera" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{label}</p>
                        <p className="font-medium text-origen-bosque">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Origen Marketplace. Todos los derechos reservados.
                </p>
                <p className="text-xs text-gray-400">
                  Diseño según Manual de Marca Origen v1.1.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
