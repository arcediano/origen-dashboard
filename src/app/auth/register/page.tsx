/**
 * Página de Registro - Origen Marketplace
 * @module app/register/page
 * @version 2.0.3 - Background limpio, cabecera unificada, sin elementos decorativos
 * @description Landing page completa para captación de productores con formulario integrado
 * 
 * @author Equipo de Desarrollo Origen
 * @created Marzo 2026
 */

import { SimpleRegistration } from '@/components/forms/SimpleRegistration';
import { HeroSection } from '@/components/register/HeroSection';
import { BenefitsSection } from '@/components/register/BenefitsSection';
import { ProcessSection } from '@/components/register/ProcessSection';
import { TestimonialsSection } from '@/components/register/TestimonialsSection';
import { FinalCTASection } from '@/components/register/FinalCTASection';
import Link from 'next/link';
import { 
  Leaf, 
  Shield, 
  Globe, 
  Heart, 
  ChevronRight, 
  Sparkles, 
  Sprout,
  Mail,
  Phone,
  Clock,
  Lock
} from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 
        ====================================================================
        HERO SECTION - IMPACTO VISUAL Y PROPUESTA DE VALOR
        ====================================================================
      */}
      <HeroSection />
      
      {/* 
        ====================================================================
        BENEFITS SECTION - RAZONES PARA UNIRSE
        ====================================================================
      */}
      <BenefitsSection />
      
      {/* 
        ====================================================================
        PROCESS SECTION - CÓMO FUNCIONA (4 PASOS)
        Background: Gradient from-white to-origen-crema
        ====================================================================
      */}
      <ProcessSection />
      
      {/* 
        ====================================================================
        TESTIMONIALS SECTION - PRUEBA SOCIAL
        ====================================================================
      */}
      <TestimonialsSection />
      
      {/* 
        ====================================================================
        FORM SECTION - CORAZÓN DE LA CONVERSIÓN
        BACKGROUND UNIFICADO CON PROCESS SECTION - SIN ELEMENTOS DECORATIVOS
        ====================================================================
      */}
      <section 
        id="registration-form"
        className="relative py-16 md:py-20 lg:py-24 bg-gradient-to-b from-white to-origen-crema"
        aria-label="Formulario de registro para productores"
      >
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          {/* 
            Cabecera de sección - UNIFICADA CON PROCESSSECTION
            Mismo estilo que "Un camino claro hacia tu éxito online"
          */}
          <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
              Regístrate como productor
              <span className="block text-origen-pradera">y empieza a vender hoy</span>
            </h2>
            <p className="text-base md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Completa el formulario en menos de 5 minutos. Sin compromiso, 
              sin costes iniciales, solo pagan cuando vendes.
            </p>
          </div>
          
          {/* Formulario - Centrado y con máximo ancho controlado */}
          <div className="max-w-4xl mx-auto">
            {/* Tarjeta contenedora - MISMO CONTRASTE QUE PROCESSSECTION */}
            <div className="relative">
              <SimpleRegistration />
            </div>
            
            {/* Mensaje de confianza post-formulario - MÁS SUTIL */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3 text-origen-pradera/70" />
                <span>Tus datos están protegidos con cifrado SSL de 256 bits</span>
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* 
        ====================================================================
        FINAL CTA SECTION - PREGUNTAS FRECUENTES Y SOPORTE
        ====================================================================
      */}
      <FinalCTASection />
      
      {/* 
        ====================================================================
        FOOTER - INFORMACIÓN INSTITUCIONAL
        Diseño limpio según manual de marca
        ====================================================================
      */}
      <footer className="bg-white border-t border-gray-200 pt-8 pb-6 md:pt-12 md:pb-8">
        <div className="container mx-auto px-4 md:px-6">

          {/* Móvil: footer mínimo */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-origen-bosque flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 200 200" aria-hidden="true">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="3"/>
                    <path d="M100 140 L100 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                    <path d="M100 90 Q85 75, 75 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M100 90 Q115 75, 125 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                    <circle cx="100" cy="140" r="8" fill="currentColor"/>
                    <circle cx="100" cy="140" r="5" fill="#06D6A0"/>
                  </svg>
                </div>
                <span className="text-base font-bold text-origen-bosque">ORIGEN</span>
              </div>
              <Link href="/auth/login" className="text-xs font-medium text-origen-pradera hover:text-origen-bosque transition-colors flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Acceso productores
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-5">
              {[
                { href: '/privacidad', label: 'Privacidad' },
                { href: '/cookies', label: 'Cookies' },
                { href: '/aviso-legal', label: 'Aviso Legal' },
                { href: '/contacto', label: 'Contacto' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="text-xs text-gray-500 hover:text-origen-pradera transition-colors">
                  {label}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400">
                © {new Date().getFullYear()} Origen Marketplace
              </p>
              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                <span className="flex items-center gap-0.5"><Shield className="w-3 h-3 text-origen-pradera" /> SSL</span>
                <span className="flex items-center gap-0.5"><Globe className="w-3 h-3 text-origen-pradera" /> RGPD</span>
              </div>
            </div>
          </div>

          {/* Desktop: footer completo */}
          <div className="hidden md:block">
            <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

              {/* Columna 1: Marca */}
              <div className="lg:col-span-4 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-origen-bosque flex items-center justify-center shadow-md">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 200 200" aria-hidden="true">
                      <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="3"/>
                      <path d="M100 140 L100 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                      <path d="M100 90 Q85 75, 75 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <path d="M100 90 Q115 75, 125 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      <circle cx="100" cy="140" r="8" fill="currentColor"/>
                      <circle cx="100" cy="140" r="5" fill="#06D6A0"/>
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
                <div className="flex flex-wrap gap-2 pt-2">
                  {[
                    { icon: Leaf, label: 'Sostenibilidad' },
                    { icon: Shield, label: 'Transparencia' },
                    { icon: Heart, label: 'Comunidad' },
                    { icon: Globe, label: 'Kilómetro 0' },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-origen-crema/80 text-xs font-medium text-origen-bosque">
                      <Icon className="w-3 h-3 text-origen-pradera" />
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Columna 2: Productores */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider mb-4">Productores</h3>
                <ul className="space-y-3">
                  {[
                    { href: '/como-funciona', label: 'Cómo funciona' },
                    { href: '/tarifas', label: 'Tarifas y comisiones' },
                    { href: '/soporte-productores', label: 'Soporte especializado' },
                    { href: '/casos-exito', label: 'Casos de éxito' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-gray-600 hover:text-origen-pradera transition-colors inline-flex items-center gap-1 group">
                        <ChevronRight className="w-3 h-3 text-origen-pradera/50 group-hover:translate-x-0.5 transition-transform" />
                        {label}
                      </Link>
                    </li>
                  ))}
                  <li className="pt-2">
                    <Link href="/auth/login" className="text-sm font-medium text-origen-pradera hover:text-origen-bosque transition-colors inline-flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" />
                      Acceso productores
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Columna 3: Legal */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider mb-4">Legal</h3>
                <ul className="space-y-3">
                  {[
                    { href: '/privacidad', label: 'Política de Privacidad' },
                    { href: '/cookies', label: 'Política de Cookies' },
                    { href: '/aviso-legal', label: 'Aviso Legal' },
                    { href: '/contacto', label: 'Contacto' },
                  ].map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className="text-sm text-gray-600 hover:text-origen-pradera transition-colors inline-flex items-center gap-1 group">
                        <ChevronRight className="w-3 h-3 text-origen-pradera/50 group-hover:translate-x-0.5 transition-transform" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Columna 4: Contacto */}
              <div className="lg:col-span-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider mb-4">Contacto</h3>
                <div className="bg-origen-crema/50 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-origen-pradera" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="font-medium text-origen-bosque">info@origen.es</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-origen-pradera" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Teléfono</p>
                      <p className="font-medium text-origen-bosque">+34 900 123 456</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-origen-pradera" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Horario</p>
                      <p className="font-medium text-origen-bosque">Lunes a Viernes, 9:00 - 18:00</p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-5 border-t border-gray-200 flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Shield className="w-4 h-4 text-origen-pradera" /><span>SSL 256-bit</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Globe className="w-4 h-4 text-origen-pradera" /><span>RGPD</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Heart className="w-4 h-4 text-origen-pradera" /><span>Pagos seguros</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-600">
                  © {new Date().getFullYear()} Origen Marketplace. Todos los derechos reservados.
                </p>
                <p className="text-xs text-gray-400">Versión 2.0.3 • Registro de productores</p>
              </div>
              <div className="mt-6 text-center">
                <p className="text-[10px] text-gray-400 max-w-3xl mx-auto">
                  Origen es una plataforma tecnológica que conecta productores independientes con consumidores.
                  No somos responsables de la calidad, seguridad o condiciones específicas de los productos
                  comercializados, siendo cada productor el único responsable de sus productos y ventas.
                </p>
              </div>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}