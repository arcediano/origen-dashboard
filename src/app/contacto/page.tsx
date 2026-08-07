/**
 * Página de Contacto - Origen Marketplace
 * @module app/contacto/page
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@arcediano/ux-library';
import { ContactForm } from '@/components/features/contact/ContactForm';
import Link from 'next/link';
import {
  Store,
  ArrowRight,
  Sparkles,
  CheckCircle,
  Award,
  MessageCircle,
} from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">

      {/* ================================================================
          HEADER — idéntico al login
      ================================================================ */}
      <header className="sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1"
            >
              <img
                src="/origen-icon.svg"
                alt=""
                width={44}
                height={44}
                className="w-10 h-10 md:w-11 md:h-11 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-origen-bosque leading-tight">Origen.</span>
                <span className="text-[10px] md:text-xs text-hoja-tinta -mt-1">Productores locales</span>
              </div>
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-surface-alt hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
            >
              <Store className="w-4 h-4 text-hoja-tinta" />
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
              <Sparkles className="w-4 h-4 text-hoja-tinta" />
              <span className="text-xs font-semibold text-origen-bosque">Estamos aquí para ayudarte</span>
            </div>
            <h1 className="text-2xl font-bold text-origen-bosque">
              ¿En qué podemos{' '}
              <span className="text-hoja-tinta">ayudarte?</span>
            </h1>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
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
                <MessageCircle className="w-4 h-4 text-hoja-tinta" />
                <span className="text-xs md:text-sm font-semibold text-origen-bosque">
                  Estamos aquí para ayudarte
                </span>
              </div>

              {/* Título */}
              <div className="text-left max-w-xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
                  ¿En qué podemos
                  <span className="block text-origen-hoja">ayudarte?</span>
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Nuestro equipo de especialistas está aquí para resolver tus dudas,
                  ayudarte a empezar y acompañarte en cada paso de tu negocio.
                </p>
              </div>

              {/* Beneficios */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-hoja-tinta" />
                  Por qué contactarnos
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Equipo humano, sin bots',
                    'Soporte especializado para productores',
                    'Seguimiento de tu consulta',
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-hoja-tinta" />
                      </div>
                      <span className="text-sm text-foreground">{benefit}</span>
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
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <AuthFooter variant="info" linkComponent={Link} />
    </div>
  );
}
