/**
 * Página de Contacto - Origen Marketplace
 * @module app/contacto/page
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import { ContactForm } from '@/components/features/contact/ContactForm';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Award,
  Phone,
  Mail,
  Clock,
  Zap,
  MessageCircle,
  ChevronRight,
} from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">

      {/* ================================================================
          HEADER — idéntico al login
      ================================================================ */}
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
              href="/auth/register"
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

      {/* ================================================================
          MAIN
      ================================================================ */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-16 xl:py-20">
        <div className="max-w-7xl mx-auto">

          {/* Hero compacto — solo móvil */}
          <div className="lg:hidden text-center mb-8 space-y-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
              <Sparkles className="w-4 h-4 text-origen-pradera" />
              <span className="text-xs font-semibold text-origen-bosque">Respuesta en menos de 24 horas</span>
            </div>
            <h1 className="text-2xl font-bold text-origen-bosque">
              ¿En qué podemos{' '}
              <span className="text-origen-pradera">ayudarte?</span>
            </h1>
            <p className="text-sm text-gray-600 max-w-sm mx-auto">
              Nuestro equipo está disponible para resolver cualquier duda.
            </p>
          </div>

          {/* Grid principal */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* ============================================================
                COLUMNA IZQUIERDA — oculta en móvil
            ============================================================ */}
            <div className="hidden lg:block lg:col-span-6 space-y-8 lg:pr-8 xl:pr-12">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
                <MessageCircle className="w-4 h-4 text-origen-pradera" />
                <span className="text-xs md:text-sm font-semibold text-origen-bosque">
                  Respuesta garantizada en 24h
                </span>
              </div>

              {/* Título */}
              <div className="text-left max-w-xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
                  ¿En qué podemos
                  <span className="block text-origen-hoja">ayudarte?</span>
                </h2>
                <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                  Nuestro equipo de especialistas está aquí para resolver tus dudas,
                  ayudarte a empezar y acompañarte en cada paso de tu negocio.
                </p>
              </div>

              {/* Tarjetas de contacto */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                {[
                  {
                    icon: Phone,
                    title: 'Teléfono',
                    line1: '+34 91 123 45 67',
                    line2: 'Lun-Vie: 9:00 - 18:00',
                  },
                  {
                    icon: Mail,
                    title: 'Email',
                    line1: 'info@origen.com',
                    line2: 'soporte@origen.com',
                  },
                  {
                    icon: Clock,
                    title: 'Horario',
                    line1: 'Lun-Vie: 9:00-18:00',
                    line2: 'Sáb: 10:00-14:00',
                  },
                  {
                    icon: Zap,
                    title: 'Respuesta',
                    line1: '< 24h garantizadas',
                    line2: 'Media: 4 horas',
                  },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <div key={index} className="group">
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:scale-[1.02] hover:shadow-xl hover:border-origen-hoja transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Icon className="w-5 h-5 text-origen-bosque" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-origen-bosque">{item.title}</div>
                            <div className="text-xs text-gray-700 font-medium mt-0.5">{item.line1}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{item.line2}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Beneficios */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-origen-pradera" />
                  Por qué contactarnos
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Equipo humano, sin bots',
                    'Soporte especializado para productores',
                    'Seguimiento de tu consulta',
                    'Resolución media en 4 horas',
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-origen-pradera" />
                      </div>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ============================================================
                COLUMNA DERECHA — Formulario
            ============================================================ */}
            <div className="lg:col-span-6">
              <div className="lg:pl-8 xl:pl-12">
                <ContactForm />

                {/* Widget de ayuda */}
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 bg-white rounded-full px-5 py-2.5 border border-gray-200 shadow-sm hover:border-origen-pradera transition-all">
                    <span className="text-sm text-gray-600">¿Prefieres llamarnos?</span>
                    <a
                      href="tel:+34911234567"
                      className="text-sm font-medium text-origen-pradera hover:text-origen-bosque transition-colors flex items-center gap-1"
                    >
                      +34 91 123 45 67
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <AuthFooter variant="login" />
    </div>
  );
}
