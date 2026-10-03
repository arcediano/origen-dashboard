/**
 * Pie de página de la landing de captación (/auth/register). Es solo una
 * landing para atraer productores: sin enlaces ni menciones legales.
 */

import Link from 'next/link';
import { ChevronRight, Clock, Heart, Mail, Phone, Shield, Store } from 'lucide-react';

const NAV_LINKS = [
  { href: '/como-funciona', label: 'Cómo funciona' },
  { href: '/contacto', label: 'Soporte especializado' },
  { href: '/casos-exito', label: 'Casos de éxito' },
];

const CONTACT_INFO = [
  { icon: Mail, label: 'Email', value: 'info@origen.es' },
  { icon: Phone, label: 'Teléfono', value: '+34 900 123 456' },
  { icon: Clock, label: 'Horario', value: 'L-V, 9:00 - 18:00' },
];

export function RegisterFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-origen-bosque mt-8 md:mt-16 lg:mt-20">
      <div className="container mx-auto px-4 md:px-6 pt-10 pb-6 md:pt-14 md:pb-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          <div className="space-y-4 lg:col-span-5">
            <div className="flex items-center gap-3">
              <img src="/origen-icon.svg" alt="" width={40} height={40} className="h-10 w-10" />
              <div>
                <div className="text-xl font-semibold text-white">Origen.</div>
                <div className="text-xs italic text-origen-pradera">Conoce de dónde viene lo que comes</div>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-white/80">
              Marketplace que conecta productores locales españoles con consumidores que valoran
              la autenticidad, la transparencia y la sostenibilidad.
            </p>
          </div>

          <nav aria-label="Enlaces" className="lg:col-span-3">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Para productores</h3>
            <ul className="space-y-1">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="group inline-flex min-h-11 items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
                  >
                    <ChevronRight className="h-3 w-3 text-origen-pradera/70" />
                    {label}
                  </Link>
                </li>
              ))}
              <li className="pt-1">
                <Link
                  href="/auth/login"
                  className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-origen-pradera transition-colors hover:text-white"
                >
                  <Store className="h-3.5 w-3.5" />
                  Acceso productores
                </Link>
              </li>
            </ul>
          </nav>

          <div className="lg:col-span-4">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">Contacto</h3>
            <div className="space-y-3 rounded-xl border border-white/10 bg-surface-alt/10 p-5">
              {CONTACT_INFO.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-alt/10">
                    <Icon className="h-4 w-4 text-origen-pradera" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white/70">{label}</p>
                    <p className="font-medium text-white">{value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
              {[
                { icon: Shield, label: 'SSL 256-bit' },
                { icon: Heart, label: 'Pagos seguros' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-white/70">
                  <Icon className="h-3.5 w-3.5 text-origen-pradera" />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6">
          <p className="text-center text-xs text-white/70 md:text-left">
            © {year} Origen Marketplace. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
