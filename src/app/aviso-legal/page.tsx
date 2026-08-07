/**
 * Aviso Legal - Origen Marketplace
 * @version 2.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 */

import { AuthFooter } from '@arcediano/ux-library';
import Link from 'next/link';
import { Store, ArrowRight, FileText, CheckCircle, ArrowLeft, Info } from 'lucide-react';

const sections = [
  {
    number: '1',
    title: 'Identificación del titular',
    content: 'En cumplimiento de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico:',
    items: [
      'Denominación social: ORIGEN MARKETPLACE S.L.',
      'CIF: B12345678',
      'Registro Mercantil de Madrid, Tomo 12345, Folio 123, Hoja M-123456',
      'Domicilio: Calle Ejemplo 123, 28001 Madrid, España',
      'Email: legal@origen.com',
    ],
  },
  {
    number: '2',
    title: 'Objeto y alcance',
    content:
      'Origen Marketplace es una plataforma digital que pone en contacto a productores artesanales locales con compradores interesados en adquirir productos de calidad, proximidad y autenticidad. La plataforma actúa como intermediario tecnológico facilitando las transacciones entre las partes.',
  },
  {
    number: '3',
    title: 'Condiciones de uso',
    content: 'El acceso y uso de la plataforma implica la aceptación plena y sin reservas de las presentes condiciones:',
    items: [
      'El usuario se compromete a hacer un uso correcto y lícito de la plataforma',
      'Queda prohibido el uso fraudulento, la suplantación de identidad o actividades ilícitas',
      'Los productores son responsables de la veracidad y exactitud de la información publicada',
      'Origen Marketplace se reserva el derecho de suspender el acceso ante incumplimientos',
    ],
  },
  {
    number: '4',
    title: 'Propiedad intelectual e industrial',
    content:
      'Todos los contenidos de la plataforma — incluyendo textos, imágenes, logotipos, diseños, código fuente y arquitectura — son propiedad de ORIGEN MARKETPLACE S.L. o de sus licenciantes y están protegidos por la legislación española e internacional sobre propiedad intelectual e industrial. Queda expresamente prohibida su reproducción, distribución o comunicación pública sin autorización escrita previa.',
  },
  {
    number: '5',
    title: 'Limitación de responsabilidad',
    content: 'ORIGEN MARKETPLACE actúa exclusivamente como intermediario tecnológico:',
    items: [
      'No es parte de los contratos de compraventa entre productores y compradores',
      'No garantiza la disponibilidad continua del servicio, aunque procura mantenerla al máximo',
      'No se responsabiliza de daños derivados del uso incorrecto de la plataforma por terceros',
      'Los productores son los únicos responsables de la calidad y descripción de sus productos',
    ],
  },
  {
    number: '6',
    title: 'Legislación aplicable y jurisdicción',
    content:
      'Este Aviso Legal se rige por la legislación española. Para la resolución de cualquier controversia derivada del uso de la plataforma, las partes se someten, con renuncia expresa a cualquier otro fuero, a los juzgados y tribunales de la ciudad de Madrid.',
  },
  {
    number: '7',
    title: 'Contacto legal',
    content: 'Para cualquier consulta sobre este Aviso Legal:',
    contact: { email: 'legal@origen.com', address: 'Calle Ejemplo 123, 28001 Madrid, España' },
  },
];

export default function LegalNoticePage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">

      {/* HEADER */}
      <header className="sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1">
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
            <Link href="/auth/register" className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-surface-alt hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2">
              <Store className="w-4 h-4 text-hoja-tinta" />
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

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-hoja-tinta hover:underline transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Cabecera */}
          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-origen-bosque">Aviso Legal</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Última actualización: enero 2026</p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Información legal sobre el uso de Origen Marketplace, conforme a la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSICE).
            </p>
          </div>

          {/* Secciones */}
          <div className="space-y-6">
            {sections.map(section => (
              <div key={section.number} className="bg-surface-alt rounded-2xl border border-border p-6 md:p-8 shadow-sm">
                <h2 className="text-base md:text-lg font-bold text-origen-bosque mb-3 pb-2 border-b border-border-subtle flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-origen-pradera/10 text-hoja-tinta text-xs font-bold flex items-center justify-center flex-shrink-0">
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
                      <a href={`mailto:${section.contact.email}`} className="text-hoja-tinta hover:underline transition-colors underline">{section.contact.email}</a>
                    </p>
                    <p className="text-foreground">
                      <span className="font-medium text-origen-bosque">Dirección: </span>{section.contact.address}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Nota LSSICE */}
          <div className="mt-6 flex items-start gap-3 p-4 bg-origen-crema/50 border border-origen-pradera/30 rounded-xl">
            <Info className="w-5 h-5 text-hoja-tinta flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Este Aviso Legal cumple con la Ley 34/2002 (LSSICE), el Real Decreto Legislativo 1/2007 de Defensa de Consumidores y Usuarios, y el Reglamento (UE) 2022/2065 sobre Servicios Digitales.
            </p>
          </div>

        </div>
      </main>

      <AuthFooter variant="info" linkComponent={Link} />
    </div>
  );
}
