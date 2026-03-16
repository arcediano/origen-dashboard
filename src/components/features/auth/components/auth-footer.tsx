/**
 * @file auth-footer.tsx
 * @description Footer compartido para páginas de autenticación (login y registro)
 * @version 1.0.0 - Manual de Marca v3.0 "Bosque Profundo"
 *
 * @created Marzo 2026
 */

'use client';

import Link from 'next/link';
import {
  Leaf,
  Shield,
  Globe,
  Heart,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  Lock,
  Store
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface AuthFooterProps {
  /** Variante del footer: 'login', 'register' o 'forgot' */
  variant: 'login' | 'register' | 'forgot';
  /** Mostrar nota legal adicional (solo para registro) */
  showLegalNote?: boolean;
}

// ============================================================================
// CONFIGURACIÓN POR VARIANTE
// ============================================================================

const VARIANT_CONFIG = {
  login: {
    mobileLink: {
      href: '/auth/register',
      icon: Store,
      label: 'Nuevo productor'
    },
    desktopLink: {
      href: '/auth/register',
      icon: Store,
      label: 'Nuevo productor'
    },
    versionLabel: 'Acceso productores'
  },
  register: {
    mobileLink: {
      href: '/auth/login',
      icon: Lock,
      label: 'Acceso productores'
    },
    desktopLink: {
      href: '/auth/login',
      icon: Shield,
      label: 'Acceso productores'
    },
    versionLabel: 'Registro de productores'
  },
  forgot: {
    mobileLink: {
      href: '/auth/login',
      icon: Lock,
      label: 'Volver al login'
    },
    desktopLink: {
      href: '/auth/login',
      icon: Shield,
      label: 'Volver al login'
    },
    versionLabel: 'Recuperar contraseña'
  }
};

// ============================================================================
// COMPONENTE LOGO
// ============================================================================

function OrigenLogo({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const dimensions = size === 'sm' ? { wrapper: 'w-8 h-8', svg: 'w-5 h-5' } : { wrapper: 'w-10 h-10', svg: 'w-6 h-6' };

  return (
    <div className={`${dimensions.wrapper} rounded-lg bg-origen-pino flex items-center justify-center`}>
      <svg className={`${dimensions.svg} text-white`} viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="3"/>
        <path d="M100 140 L100 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
        <path d="M100 90 Q85 75, 75 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M100 90 Q115 75, 125 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="100" cy="140" r="8" fill="currentColor"/>
        {/* Verde Pradera según manual de marca v3.0 */}
        <circle cx="100" cy="140" r="5" fill="#74C69D"/>
      </svg>
    </div>
  );
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function AuthFooter({ variant, showLegalNote = false }: AuthFooterProps) {
  const config = VARIANT_CONFIG[variant];
  const MobileIcon = config.mobileLink.icon;
  const DesktopIcon = config.desktopLink.icon;

  return (
    <footer className="bg-origen-bosque mt-8 md:mt-16 lg:mt-20">
      <div className="container mx-auto px-4 md:px-6 pt-10 pb-6 md:pt-14 md:pb-8">

        {/* ================================================================
            MÓVIL: Footer mínimo (< 768px)
        ================================================================ */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <OrigenLogo size="sm" />
              <span className="text-base font-bold text-white">ORIGEN</span>
            </div>
            <Link
              href={config.mobileLink.href}
              className="text-xs font-medium text-origen-pradera hover:text-white transition-colors flex items-center gap-1"
            >
              <MobileIcon className="w-3 h-3" />
              {config.mobileLink.label}
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
              <span className="flex items-center gap-0.5">
                <Shield className="w-3 h-3 text-origen-pradera" /> SSL
              </span>
              <span className="flex items-center gap-0.5">
                <Globe className="w-3 h-3 text-origen-pradera" /> RGPD
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================
            DESKTOP: Footer completo (≥ 768px)
        ================================================================ */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">

            {/* Columna 1: Marca */}
            <div className="lg:col-span-4 space-y-5">
              <div className="flex items-center gap-3">
                <OrigenLogo size="md" />
                <div>
                  <div className="text-xl font-bold text-white">ORIGEN</div>
                  <div className="text-xs text-origen-pradera italic">
                    Conoce de dónde viene lo que comes
                  </div>
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
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium text-white border border-white/20"
                  >
                    <Icon className="w-3 h-3 text-origen-pradera" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Columna 2: Productores */}
            <div className="lg:col-span-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                Productores
              </h3>
              <ul className="space-y-3">
                {[
                  { href: '/como-funciona', label: 'Cómo funciona' },
                  { href: '/soporte', label: 'Soporte especializado' },
                  { href: '/casos-exito', label: 'Casos de éxito' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    >
                      <ChevronRight className="w-3 h-3 text-origen-pradera/70 group-hover:translate-x-0.5 transition-transform" />
                      {label}
                    </Link>
                  </li>
                ))}
                <li className="pt-2">
                  <Link
                    href={config.desktopLink.href}
                    className="text-sm font-medium text-origen-pradera hover:text-white transition-colors inline-flex items-center gap-1"
                  >
                    <DesktopIcon className="w-3.5 h-3.5" />
                    {config.desktopLink.label}
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
                  { href: '/contacto', label: 'Contacto' },
                ].map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                    >
                      <ChevronRight className="w-3 h-3 text-origen-pradera/70 group-hover:translate-x-0.5 transition-transform" />
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
                      <Icon className="w-4 h-4 text-origen-pradera" />
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
                  <Shield className="w-3.5 h-3.5 text-origen-pradera" />
                  <span>SSL 256-bit</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Globe className="w-3.5 h-3.5 text-origen-pradera" />
                  <span>RGPD</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/70">
                  <Heart className="w-3.5 h-3.5 text-origen-pradera" />
                  <span>Pagos seguros</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer bottom */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <p className="text-xs text-white/70">
                © {new Date().getFullYear()} Origen Marketplace. Todos los derechos reservados.
              </p>
              <p className="text-xs text-white/70">
                Versión 3.0 • {config.versionLabel}
              </p>
            </div>

            {/* Nota legal adicional (solo para registro) */}
            {showLegalNote && (
              <div className="mt-4 text-center">
                <p className="text-[10px] text-white/70 max-w-3xl mx-auto">
                  Origen es una plataforma tecnológica que conecta productores independientes con consumidores.
                  No somos responsables de la calidad, seguridad o condiciones específicas de los productos
                  comercializados, siendo cada productor el único responsable de sus productos y ventas.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}

AuthFooter.displayName = 'AuthFooter';
