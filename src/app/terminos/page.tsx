/**
 * Términos y Condiciones del productor - Origen Marketplace
 * Se enlaza desde el paso 5 del registro (/auth/register), el paso final del
 * onboarding y el pie de página.
 */

import { FileText } from 'lucide-react';
import { LegalPage, type LegalSection } from '@/components/features/legal/LegalPage';
import { COMPANY_INFO_REVALIDATE, companyContact, fetchCompanyInfo, type CompanyInfo } from '@/lib/company-info';

export const revalidate = COMPANY_INFO_REVALIDATE;

export const metadata = {
  title: 'Términos y condiciones · Origen',
  description: 'Condiciones de uso de Origen Marketplace para productores.',
};

function buildSections(company: CompanyInfo | null): LegalSection[] {
  const name = company?.businessName ?? 'Origen Marketplace';
  return [
  {
    title: 'Objeto y partes',
    paragraphs: [
      `Estos Términos y Condiciones regulan el acceso y uso de Origen Marketplace por parte de los productores que se registran para vender sus productos a través de la plataforma, titularidad de ${name} (en adelante, «Origen»). Los datos de identificación de Origen figuran en el Aviso Legal.`,
      'Origen actúa como intermediario tecnológico: pone en contacto a productores con compradores y facilita las herramientas de publicación, pedido, cobro y gestión. La compraventa de cada producto se celebra entre el productor, como vendedor, y el comprador.',
    ],
  },
  {
    title: 'Registro y cuenta de productor',
    items: [
      'Para vender debes completar el registro y el proceso de alta, y ser mayor de edad con capacidad legal para actuar como profesional o representante de tu negocio.',
      'La información y documentación que facilites debe ser veraz, completa y estar actualizada; debes comunicarnos cualquier cambio.',
      'Origen revisa cada solicitud y puede aprobarla, solicitar más información o rechazarla. La aprobación no supone garantía alguna sobre tu actividad.',
      'Eres responsable de custodiar tus credenciales y de toda actividad realizada desde tu cuenta. Avísanos de inmediato si sospechas un acceso no autorizado.',
      'La cuenta es personal e intransferible y se asocia a un único titular de actividad.',
    ],
  },
  {
    title: 'Publicación de productos',
    paragraphs: ['Eres el único responsable del contenido de tus fichas de producto. Te comprometes a que:'],
    items: [
      'Los datos sean veraces: nombre, descripción, origen, formato, peso, ingredientes, alérgenos e información nutricional, conforme a la normativa de etiquetado alimentario aplicable (incluido el Reglamento (UE) 1169/2011).',
      'Las certificaciones, sellos y denominaciones que declares sean reales y puedan acreditarse a solicitud de Origen. Las menciones como «ecológico» o «bio» están reguladas y solo pueden usarse si corresponden.',
      'Dispongas de los permisos y autorizaciones sanitarios y de actividad necesarios para producir y vender cada producto, y del derecho a usar las imágenes y textos que subas.',
      'No publiques productos prohibidos, falsificados, peligrosos o que no cumplan la ley.',
    ],
    footnote:
      'Los productos nuevos y los cambios sensibles en productos ya publicados pasan por una revisión de Origen antes de mostrarse en la tienda. Origen puede rechazar, ocultar o retirar cualquier ficha que incumpla estas condiciones.',
  },
  {
    title: 'Asistente de inteligencia artificial',
    paragraphs: [
      'Origen ofrece un asistente que propone borradores de ficha a partir de tus fotos y textos, y puede consultar información pública en internet sobre el producto que identifique. Es una ayuda opcional: sus propuestas pueden contener errores o datos que no correspondan a tu producto.',
      'Siempre debes revisar y confirmar el contenido antes de guardarlo o publicarlo, especialmente ingredientes, alérgenos y valores nutricionales. La responsabilidad sobre lo publicado sigue siendo tuya. El uso del asistente puede estar sujeto a límites por productor.',
    ],
  },
  {
    title: 'Precios, stock y pedidos',
    items: [
      'Tú fijas los precios y el stock de tus productos, y eres responsable de mantenerlos actualizados.',
      'Cuando un comprador completa un pedido y el pago se confirma, estás obligado a prepararlo y enviarlo (o ponerlo a disposición para su recogida) en los plazos que hayas indicado.',
      'Debes evitar cancelaciones injustificadas o falta de stock recurrente. Origen puede limitar o suspender la cuenta si se reiteran incumplimientos.',
    ],
  },
  {
    title: 'Comisión, cobros y facturación',
    items: [
      'El alta es gratuita. Origen aplica una comisión de 12 % más 0,25 € por cada venta realizada, que se descuenta del importe a liquidarte. Si cambian las condiciones económicas, te lo comunicaremos con antelación (ver sección «Modificaciones»).',
      'Los cobros y liquidaciones se gestionan mediante Stripe Connect. Para recibir pagos debes completar la verificación de Stripe y aceptar sus términos, que son independientes de los de Origen.',
      'Origen emite las facturas correspondientes a su comisión y la plataforma genera los documentos de facturación de los pedidos. Los reembolsos aprobados dan lugar a la correspondiente factura rectificativa.',
      'Eres responsable de tus obligaciones fiscales y de cualquier impuesto derivado de tus ventas.',
    ],
  },
  {
    title: 'Envíos y logística',
    paragraphs: [
      'Durante el alta eliges entre delegar el envío en la logística de Origen o gestionarlo por tu cuenta. Debes cumplir las condiciones de la modalidad elegida, empaquetar adecuadamente los productos, respetar la cadena de frío y las condiciones de conservación cuando proceda, y facilitar la información de seguimiento que la plataforma requiera.',
    ],
  },
  {
    title: 'Devoluciones, reembolsos e incidencias',
    items: [
      'Los compradores consumidores tienen los derechos que les reconoce la ley, incluido, cuando proceda, el derecho de desistimiento y la garantía legal de conformidad. Algunos productos perecederos o personalizados están exceptuados conforme a la normativa.',
      'Las solicitudes de reembolso se tramitan a través de la plataforma. Cuando se aprueba un reembolso, su importe se descuenta de tus liquidaciones en la parte que corresponda.',
      'Si surge una disputa con un comprador, colaborarás con Origen aportando la información que solicite. Origen puede mediar, sin que ello le convierta en parte de la compraventa.',
    ],
  },
  {
    title: 'Propiedad intelectual y licencia de contenido',
    paragraphs: [
      'Conservas la titularidad del contenido que subes (textos, fotografías, vídeos, marcas). Nos concedes una licencia no exclusiva, gratuita y limitada a la duración de tu cuenta para alojarlo, reproducirlo y mostrarlo en la plataforma y en acciones promocionales de Origen. Garantizas que tienes derecho a concederla.',
      'Los contenidos, marca, diseño y software de la plataforma son propiedad de Origen o de sus licenciantes y no pueden usarse sin autorización.',
    ],
  },
  {
    title: 'Conducta prohibida y suspensión',
    items: [
      'Está prohibido suplantar identidades, manipular valoraciones, eludir la plataforma para evitar la comisión en pedidos iniciados en ella, o usar la plataforma para fines ilícitos o que perjudiquen a terceros o a su funcionamiento.',
      'Origen puede suspender o cancelar la cuenta, de forma temporal o definitiva, ante un incumplimiento grave o reiterado, informándote del motivo salvo que la ley lo impida. Las liquidaciones pendientes se resolverán conforme a lo que corresponda por los pedidos ya cumplidos.',
    ],
  },
  {
    title: 'Responsabilidad',
    paragraphs: [
      'Origen no garantiza un volumen de ventas ni la disponibilidad ininterrumpida del servicio, aunque se esforzará por mantenerlo operativo y avisará de los mantenimientos programados. Origen no es responsable de la calidad, seguridad o legalidad de los productos, que corresponde al productor, ni de los daños indirectos derivados del uso de la plataforma, salvo en los casos en que la ley no permita excluirlos.',
      'Te comprometes a mantener indemne a Origen frente a reclamaciones de terceros derivadas de un incumplimiento de estas condiciones o de la información que publiques.',
    ],
  },
  {
    title: 'Protección de datos',
    paragraphs: [
      'El tratamiento de datos personales se rige por nuestra Política de Privacidad. Cuando trates datos personales de compradores para gestionar sus pedidos, deberás hacerlo solo para esa finalidad y conforme al RGPD.',
    ],
  },
  {
    title: 'Modificaciones, duración y baja',
    items: [
      'Podemos actualizar estas condiciones. Te avisaremos de los cambios significativos en la plataforma o por correo electrónico con al menos 30 días de antelación; si no estás de acuerdo, puedes darte de baja antes de que entren en vigor.',
      'El contrato tiene duración indefinida. Puedes darte de baja en cualquier momento, tras cumplir los pedidos en curso, y Origen puede resolverlo en los supuestos previstos en estas condiciones.',
    ],
  },
  {
    title: 'Ley aplicable y jurisdicción',
    paragraphs: [
      'Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de Madrid, sin perjuicio del fuero que corresponda por ley a los consumidores.',
    ],
  },
  {
    title: 'Contacto',
    paragraphs: [
      company?.email
        ? 'Para cualquier consulta sobre estas condiciones puedes escribirnos a:'
        : 'Para cualquier consulta sobre estas condiciones puedes escribirnos desde la página de contacto.',
    ],
    contact: companyContact(company),
  },
  ];
}

export default async function TermsPage() {
  const company = await fetchCompanyInfo();
  return (
    <LegalPage
      icon={<FileText />}
      title="Términos y condiciones"
      updated="octubre 2026"
      intro="Estas condiciones regulan tu uso de Origen Marketplace como productor. Léelas con atención: al completar tu registro confirmas que las has leído y las aceptas."
      sections={buildSections(company)}
      related={[
        { href: '/privacidad', label: 'Política de privacidad' },
        { href: '/cookies', label: 'Política de cookies' },
        { href: '/aviso-legal', label: 'Aviso legal' },
      ]}
    />
  );
}
