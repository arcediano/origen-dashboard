/**
 * Política de Privacidad - Origen Marketplace
 * Se enlaza desde el paso 5 del registro (/auth/register), el paso final del
 * onboarding y el pie de página.
 */

import { Shield } from 'lucide-react';
import { LegalPage, type LegalSection } from '@/components/features/legal/LegalPage';

export const metadata = {
  title: 'Política de privacidad · Origen',
  description: 'Cómo trata Origen Marketplace los datos personales de los productores.',
};

const CONTACT = { email: 'privacidad@origen.com', address: 'Calle Ejemplo 123, 28001 Madrid, España' };

const sections: LegalSection[] = [
  {
    title: 'Responsable del tratamiento',
    paragraphs: [
      'El responsable del tratamiento de tus datos es ORIGEN MARKETPLACE S.L. (en adelante, «Origen»), cuyos datos de identificación figuran en el Aviso Legal. Puedes contactar con nosotros para cualquier cuestión de privacidad en privacidad@origen.com.',
    ],
  },
  {
    title: 'Datos que tratamos',
    items: [
      'Datos de contacto y de cuenta: nombre, correo electrónico, teléfono y credenciales (la contraseña se almacena cifrada).',
      'Datos del negocio y del alta de productor: denominación, categorías, descripción de tu proyecto, ubicación y zonas de reparto, datos fiscales y de facturación, y la documentación y certificaciones que aportes para verificar tu actividad.',
      'Datos de cobro: la verificación de identidad y los datos bancarios necesarios para recibir pagos los recoge y trata directamente Stripe; Origen recibe únicamente el estado de la verificación y la información necesaria para las liquidaciones.',
      'Contenido que publicas: fichas de producto, fotografías, vídeos y textos.',
      'Datos de pedidos y comunicaciones: pedidos, liquidaciones, facturas, incidencias, reembolsos y mensajes con Origen. Para gestionar un pedido accedes a los datos del comprador estrictamente necesarios.',
      'Datos técnicos: dirección IP, tipo de dispositivo y navegador, registros de acceso y de actividad en la cuenta, con fines de seguridad. Para las cookies, consulta la Política de cookies.',
    ],
  },
  {
    title: 'Para qué usamos tus datos y con qué base jurídica',
    items: [
      'Gestionar tu registro, alta y cuenta de productor, y prestarte el servicio (publicación, pedidos, cobros y liquidaciones, atención al cliente). Base: ejecución del contrato.',
      'Cumplir obligaciones legales: facturación, contabilidad, fiscalidad, prevención del fraude y atención a requerimientos de las autoridades. Base: obligación legal.',
      'Garantizar la seguridad de la plataforma, detectar usos fraudulentos o abusivos, moderar contenidos y mejorar el servicio. Base: interés legítimo de Origen.',
      'Enviarte comunicaciones comerciales o novedades sobre Origen. Base: tu consentimiento, que puedes retirar en cualquier momento. Las comunicaciones del servicio (avisos de pedidos, cambios de condiciones, seguridad) no son comerciales.',
    ],
  },
  {
    title: 'Asistente de inteligencia artificial',
    paragraphs: [
      'Si usas el asistente de creación de productos, enviamos al proveedor de IA (Anthropic) las fotografías y textos que subas en esa pantalla, y puede realizarse una búsqueda en internet con el nombre del producto identificado para completar su ficha. Se usa solo para generar una propuesta que tú revisas y confirmas; no se toman decisiones automatizadas con efectos jurídicos sobre ti.',
      'Evita incluir en esas fotos y textos datos personales que no sean necesarios para describir el producto.',
    ],
  },
  {
    title: 'Destinatarios y encargados del tratamiento',
    paragraphs: ['No vendemos tus datos. Los comunicamos o ponemos a disposición de terceros solo cuando es necesario:'],
    items: [
      'Stripe, para la verificación de identidad, los cobros y las liquidaciones.',
      'Proveedores tecnológicos que actúan como encargados del tratamiento bajo contrato: alojamiento y base de datos (Render, Vercel), almacenamiento de archivos (Amazon Web Services), envío de correo electrónico (Brevo) y el proveedor de IA mencionado.',
      'Transportistas y operadores logísticos, cuando delegas el envío en Origen, y los compradores, que reciben los datos de la tienda necesarios para su pedido y su factura.',
      'Administraciones públicas, jueces y tribunales, cuando exista obligación legal.',
    ],
  },
  {
    title: 'Transferencias internacionales',
    paragraphs: [
      'Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo. En ese caso nos aseguramos de que existan garantías adecuadas, como decisiones de adecuación de la Comisión Europea o cláusulas contractuales tipo.',
    ],
  },
  {
    title: 'Cuánto tiempo conservamos tus datos',
    paragraphs: [
      'Conservamos los datos mientras tu cuenta esté activa. Tras la baja, los mantenemos bloqueados durante los plazos en que puedan derivarse responsabilidades, y la documentación contable y fiscal (facturas, liquidaciones) durante los plazos que exige la normativa mercantil y tributaria. Transcurridos esos plazos, se suprimen o anonimizan.',
    ],
  },
  {
    title: 'Seguridad',
    paragraphs: [
      'Aplicamos medidas técnicas y organizativas para proteger tus datos frente a accesos no autorizados, pérdida, alteración o divulgación, entre ellas cifrado de las comunicaciones, almacenamiento seguro de contraseñas, control de accesos por roles y registro de actividad.',
    ],
  },
  {
    title: 'Tus derechos',
    paragraphs: ['Conforme al RGPD y a la LOPDGDD, puedes ejercer en cualquier momento los siguientes derechos escribiendo a privacidad@origen.com:'],
    items: [
      'Acceso a tus datos personales.',
      'Rectificación de datos inexactos o incompletos.',
      'Supresión («derecho al olvido»), cuando proceda.',
      'Oposición y limitación del tratamiento.',
      'Portabilidad de los datos que nos has facilitado.',
      'Retirada del consentimiento, sin efecto retroactivo.',
    ],
    footnote:
      'Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).',
  },
  {
    title: 'Cambios en esta política',
    paragraphs: [
      'Podemos actualizar esta política. Te avisaremos de los cambios significativos mediante un aviso en la plataforma o por correo electrónico con al menos 30 días de antelación.',
    ],
  },
  {
    title: 'Contacto',
    paragraphs: ['Si tienes preguntas sobre esta política o quieres ejercer tus derechos:'],
    contact: CONTACT,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      icon={<Shield />}
      title="Política de privacidad"
      updated="octubre 2026"
      intro="Esta política describe cómo recopilamos, usamos y protegemos tu información personal cuando te registras y vendes en Origen Marketplace, conforme al RGPD y a la LOPDGDD."
      sections={sections}
      related={[
        { href: '/terminos', label: 'Términos y condiciones' },
        { href: '/cookies', label: 'Política de cookies' },
        { href: '/aviso-legal', label: 'Aviso legal' },
      ]}
    />
  );
}
