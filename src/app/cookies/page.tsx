/**
 * Política de Cookies - Origen Marketplace
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import Link from 'next/link';
import { Store, ArrowRight, Cookie, CheckCircle, ArrowLeft, Info } from 'lucide-react';

const cookieTypes = [
  {
    type: 'Necesarias',
    badge: 'Siempre activas',
    badgeColor: 'bg-origen-hoja/10 text-origen-hoja',
    description: 'Esenciales para el funcionamiento básico del sitio. Sin ellas algunas funciones no estarían disponibles.',
    examples: [
      'Autenticación de usuarios y gestión de sesiones',
      'Funciones de seguridad básica y protección CSRF',
      'Preferencias de idioma y región',
    ],
  },
  {
    type: 'Analíticas',
    badge: 'Opcionales',
    badgeColor: 'bg-origen-pradera/10 text-origen-pradera',
    description: 'Nos ayudan a entender cómo interactúas con el sitio para poder mejorar la experiencia continuamente.',
    examples: [
      'Google Analytics — medición de visitas y comportamiento',
      'Medición de rendimiento de páginas y tiempos de carga',
      'Análisis de rutas de navegación (datos anonimizados)',
    ],
  },
  {
    type: 'Funcionales',
    badge: 'Opcionales',
    badgeColor: 'bg-origen-pradera/10 text-origen-pradera',
    description: 'Permiten una experiencia más personalizada recordando tus preferencias entre visitas.',
    examples: [
      'Recordar tus preferencias de filtros y búsqueda',
      'Guardar el contenido del carrito entre sesiones',
      'Preferencias de visualización del catálogo',
    ],
  },
];

const sections = [
  {
    number: '1',
    title: '¿Qué son las cookies?',
    content: 'Las cookies son archivos de texto pequeños que se almacenan en tu dispositivo cuando visitas un sitio web. Nos permiten recordar tu visita, mejorar tu experiencia y analizar cómo se utiliza nuestra plataforma.',
  },
  {
    number: '3',
    title: 'Control de cookies',
    content: 'Puedes controlar o eliminar las cookies según tus preferencias:',
    items: [
      'Gestiona la configuración de cookies desde el banner de consentimiento al entrar en la web',
      'Configura tu navegador para bloquear o eliminar cookies (esto puede afectar la funcionalidad)',
      'Usa el modo incógnito/privado de tu navegador para una sesión sin cookies persistentes',
      'Desinstala extensiones analíticas desde Google Analytics Opt-out Browser Add-on',
    ],
  },
  {
    number: '4',
    title: 'Cambios en la política',
    content: 'Podemos actualizar esta Política de Cookies ocasionalmente para reflejar cambios en nuestras prácticas o por motivos operativos, legales o reglamentarios. Te notificaremos cualquier cambio mediante un aviso en el sitio.',
  },
  {
    number: '5',
    title: 'Contacto',
    content: 'Para cualquier pregunta sobre nuestra Política de Cookies:',
    contact: { email: 'privacidad@origen.com', address: 'Calle Ejemplo 123, 28001 Madrid, España' },
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">

      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="85" fill="none" stroke="white" strokeWidth="3"/>
                  <path d="M100 140 L100 80" stroke="white" strokeWidth="5" strokeLinecap="round"/>
                  <path d="M100 90 Q85 75, 75 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <path d="M100 90 Q115 75, 125 65" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                  <circle cx="100" cy="140" r="8" fill="white"/><circle cx="100" cy="140" r="5" fill="#74C69D"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-origen-bosque leading-tight">ORIGEN</span>
                <span className="text-[10px] md:text-xs text-origen-hoja -mt-1">Productores locales</span>
              </div>
            </Link>
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-surface-alt hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2">
              <Store className="w-4 h-4 text-origen-pradera" />
              <span className="hidden sm:inline">Nuevo productor</span>
              <span className="sm:hidden">Registro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto">

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-origen-pradera hover:text-origen-bosque transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Cabecera */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-crema to-origen-pastel flex items-center justify-center">
                <Cookie className="w-6 h-6 text-origen-bosque" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-origen-bosque">Política de Cookies</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Última actualización: enero 2026</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política explica qué son las cookies, cómo las utilizamos en Origen Marketplace y cómo puedes controlarlas. Respetamos tu privacidad y te damos control total sobre tu experiencia.
            </p>
          </div>

          {/* Sección 1 */}
          <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm mb-6">
            <h2 className="text-base md:text-lg font-bold text-origen-bosque mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-origen-pradera/10 text-origen-pradera text-xs font-bold flex items-center justify-center flex-shrink-0">1</span>
              {sections[0].title}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{sections[0].content}</p>
          </div>

          {/* Tipos de cookies */}
          <div className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm mb-6">
            <h2 className="text-base md:text-lg font-bold text-origen-bosque mb-5 pb-2 border-b border-border-subtle flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-origen-pradera/10 text-origen-pradera text-xs font-bold flex items-center justify-center flex-shrink-0">2</span>
              Cookies que usamos
            </h2>
            <div className="space-y-5">
              {cookieTypes.map((ct, i) => (
                <div key={i} className="border border-border-subtle rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-origen-bosque">{ct.type}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ct.badgeColor}`}>{ct.badge}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{ct.description}</p>
                  <ul className="space-y-1.5">
                    {ct.examples.map((ex, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <div className="w-4 h-4 rounded-full bg-origen-hoja/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
                        </div>
                        {ex}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Resto de secciones */}
          {sections.slice(1).map(section => (
            <div key={section.number} className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm mb-6">
              <h2 className="text-base md:text-lg font-bold text-origen-bosque mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-origen-pradera/10 text-origen-pradera text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {section.number}
                </span>
                {section.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">{section.content}</p>
              {section.items && (
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-4 h-4 rounded-full bg-origen-hoja/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {section.contact && (
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium text-origen-bosque">Email: </span>
                    <a href={`mailto:${section.contact.email}`} className="text-origen-pradera hover:text-origen-bosque transition-colors underline">{section.contact.email}</a>
                  </p>
                  <p className="text-foreground">
                    <span className="font-medium text-origen-bosque">Dirección: </span>{section.contact.address}
                  </p>
                </div>
              )}
            </div>
          ))}

          {/* Info RGPD */}
          <div className="flex items-start gap-3 p-4 bg-origen-crema/50 border border-origen-pradera/30 rounded-xl">
            <Info className="w-5 h-5 text-origen-pradera flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Esta política cumple con el Reglamento (UE) 2016/679 (RGPD), la Directiva ePrivacy y la Ley 34/2002 de Servicios de la Sociedad de la Información.
            </p>
          </div>

        </div>
      </main>

      <AuthFooter variant="login" />
    </div>
  );
}
