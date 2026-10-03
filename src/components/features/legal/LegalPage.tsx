/**
 * Plantilla compartida de las pantallas legales (Términos y condiciones,
 * Política de privacidad). Mismo patrón visual que `/aviso-legal` y
 * `/cookies`: cabecera de marca, tarjetas numeradas y pie `AuthFooter`.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { AuthFooter } from '@arcediano/ux-library';
import { Store, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';

export interface LegalSection {
  title: string;
  /** Párrafos de texto previos a la lista. */
  paragraphs?: string[];
  items?: string[];
  /** Párrafo de cierre tras la lista. */
  footnote?: string;
  contact?: { email: string; address: string };
}

interface LegalPageProps {
  icon: ReactNode;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  /** Enlaces cruzados a las otras pantallas legales. */
  related?: { href: string; label: string }[];
}

export function LegalPage({ icon, title, updated, intro, sections, related }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-origen-crema/30">
      <header className="sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1">
              <img src="/origen-icon.svg" alt="" width={44} height={44} className="w-10 h-10 md:w-11 md:h-11 group-hover:scale-105 transition-transform" />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-origen-bosque leading-tight">Origen.</span>
                <span className="text-[10px] md:text-xs text-hoja-tinta -mt-1">Productores locales</span>
              </div>
            </Link>
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-surface-alt hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2">
              <Store className="w-4 h-4 text-hoja-tinta" />
              <span className="hidden sm:inline">Nuevo productor</span>
              <span className="sm:hidden">Registro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">
          <Link href="/auth/register" className="inline-flex items-center gap-1.5 text-sm text-hoja-tinta hover:underline transition-colors mb-6 min-h-11">
            <ArrowLeft className="w-4 h-4" />
            Volver al registro
          </Link>

          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md text-white [&>svg]:w-6 [&>svg]:h-6">
                {icon}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-origen-bosque">{title}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Última actualización: {updated}</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">{intro}</p>
          </div>

          <nav aria-label="Índice" className="mb-6 rounded-2xl border border-border bg-surface-alt p-4 md:p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-origen-bosque mb-2">Contenido</p>
            <ol className="grid gap-1 sm:grid-cols-2 text-sm">
              {sections.map((section, i) => (
                <li key={section.title}>
                  <a href={`#seccion-${i + 1}`} className="text-hoja-tinta hover:underline">
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="space-y-6">
            {sections.map((section, i) => (
              <section
                key={section.title}
                id={`seccion-${i + 1}`}
                className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm scroll-mt-24"
              >
                <h2 className="text-base md:text-lg font-bold text-origen-bosque mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-origen-pradera/10 text-hoja-tinta text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  {section.title}
                </h2>
                {section.paragraphs?.map((p) => (
                  <p key={p} className="text-muted-foreground text-sm leading-relaxed mb-3">{p}</p>
                ))}
                {section.items && (
                  <ul className="space-y-2 mb-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <div className="w-4 h-4 rounded-full bg-origen-hoja/10 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
                {section.footnote && (
                  <p className="text-muted-foreground text-sm leading-relaxed">{section.footnote}</p>
                )}
                {section.contact && (
                  <div className="mt-3 space-y-1 text-sm">
                    {section.contact.email && (
                      <p className="text-foreground">
                        <span className="font-medium text-origen-bosque">Email: </span>
                        <a href={`mailto:${section.contact.email}`} className="text-hoja-tinta hover:underline transition-colors underline">{section.contact.email}</a>
                      </p>
                    )}
                    {section.contact.address && (
                      <p className="text-foreground">
                        <span className="font-medium text-origen-bosque">Dirección: </span>{section.contact.address}
                      </p>
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>

          {related && related.length > 0 && (
            <p className="mt-8 text-sm text-muted-foreground">
              Consulta también:{' '}
              {related.map((link, i) => (
                <span key={link.href}>
                  {i > 0 && ' · '}
                  <Link href={link.href} className="text-hoja-tinta underline underline-offset-2">{link.label}</Link>
                </span>
              ))}
            </p>
          )}
        </div>
      </main>

      <AuthFooter variant="info" linkComponent={Link} />
    </div>
  );
}
