// app/recuperar/page.tsx
/**
 * Página de Recuperación de Contraseña - Origen Marketplace
 * @module app/recuperar/page
 * @description Página para solicitar el restablecimiento de contraseña
 */

import { SimpleForgotPassword } from '@/components/features/auth/components/forgot-password-form';
import { AuthFooter } from '@/components/features/auth/components/auth-footer';
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
                  <span className="block text-origen-hoja">a tu panel</span>
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
                      href="/contacto"
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

      <AuthFooter variant="forgot" />
    </div>
  );
}
