/**
 * Política de Privacidad - Origen Marketplace
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import Link from 'next/link';
import { Store, ArrowRight, Shield, CheckCircle, ArrowLeft } from 'lucide-react';

const sections = [
  {
    number: '1',
    title: 'Información que recopilamos',
    content: 'Recopilamos información personal que nos proporcionas directamente, como:',
    items: [
      'Información de contacto (nombre, correo electrónico, teléfono)',
      'Información de cuenta (usuario, contraseña cifrada)',
      'Información de perfil de productor (negocio, categorías, descripción)',
      'Información de transacciones y pedidos',
    ],
  },
  {
    number: '2',
    title: 'Cómo usamos tu información',
    content: 'Utilizamos tu información exclusivamente para:',
    items: [
      'Proporcionar y mejorar nuestros servicios',
      'Procesar transacciones y gestionar pedidos',
      'Comunicarnos contigo sobre tu cuenta o consultas',
      'Enviarte información comercial si has dado tu consentimiento',
      'Mejorar la experiencia de todos los usuarios de la plataforma',
    ],
  },
  {
    number: '3',
    title: 'Protección de tu información',
    content:
      'Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal contra accesos no autorizados, alteraciones, divulgación o destrucción. Todos los datos en tránsito se cifran mediante TLS y los datos en reposo están protegidos con cifrado AES-256.',
  },
  {
    number: '4',
    title: 'Tus derechos',
    content: 'De acuerdo con el RGPD y la LOPDGDD, tienes derecho a:',
    items: [
      'Acceder a tu información personal en cualquier momento',
      'Solicitar la corrección de información incorrecta o incompleta',
      'Solicitar la eliminación de tus datos ("derecho al olvido")',
      'Retirar tu consentimiento en cualquier momento sin efecto retroactivo',
      'Presentar una reclamación ante la Agencia Española de Protección de Datos',
    ],
  },
  {
    number: '5',
    title: 'Conservación de datos',
    content:
      'Conservamos tus datos personales durante el tiempo necesario para cumplir con los fines descritos en esta política, salvo que la ley exija o permita un período de conservación más largo. Los datos de cuenta activa se conservan mientras mantengas tu cuenta. Los datos de transacciones se conservan durante 7 años por obligaciones fiscales.',
  },
  {
    number: '6',
    title: 'Cambios a esta política',
    content:
      'Nos reservamos el derecho de actualizar esta Política de Privacidad. Te notificaremos cualquier cambio significativo mediante un aviso en la plataforma o por correo electrónico con al menos 30 días de antelación.',
  },
  {
    number: '7',
    title: 'Contacto',
    content: 'Si tienes preguntas sobre esta Política de Privacidad o deseas ejercer tus derechos:',
    contact: { email: 'privacidad@origen.com', address: 'Calle Ejemplo 123, 28001 Madrid, España' },
  },
];

export default function PrivacyPolicyPage() {
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

          {/* Volver */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-origen-pradera hover:text-origen-bosque transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Cabecera */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-origen-bosque">Política de Privacidad</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Última actualización: enero 2026</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu información personal cuando utilizas Origen Marketplace. Nos comprometemos a tratar tus datos con total transparencia y conforme al RGPD.
            </p>
          </div>

          {/* Secciones */}
          <div className="space-y-6">
            {sections.map(section => (
              <div key={section.number} className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm">
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
          </div>

        </div>
      </main>

      <AuthFooter variant="login" />
    </div>
  );
}
