import { StaticLayout } from './static-layout';
import { ProcessSection } from '@/components/features/landing/components/sections/process-section';

export default function HowItWorksPage() {
  return (
    <StaticLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Cómo funciona Origen Marketplace
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Conectamos directamente a productores artesanales con compradores que valoran la autenticidad
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Para Productores</h2>
            <ProcessSection 
              steps={[
                {
                  title: "Registro sencillo",
                  description: "Completa nuestro formulario de registro con tus datos básicos",
                  icon: "user-plus"
                },
                {
                  title: "Configura tu perfil",
                  description: "Añade información detallada sobre tu negocio y productos",
                  icon: "settings"
                },
                {
                  title: "Publica tus productos",
                  description: "Sube fotos, descripciones y precios de tus productos",
                  icon: "upload"
                },
                {
                  title: "Gestiona pedidos",
                  description: "Recibe y gestiona pedidos directamente desde la plataforma",
                  icon: "shopping-cart"
                }
              ]}
            />
          </div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Para Compradores</h2>
            <ProcessSection 
              steps={[
                {
                  title: "Descubre productos",
                  description: "Explora artículos artesanales de alta calidad",
                  icon: "search"
                },
                {
                  title: "Compra segura",
                  description: "Proceso de pago protegido y garantizado",
                  icon: "credit-card"
                },
                {
                  title: "Entrega directa",
                  description: "Recibe tus productos directamente del productor",
                  icon: "truck"
                },
                {
                  title: "Soporte dedicado",
                  description: "Nuestro equipo está disponible para ayudarte",
                  icon: "help-circle"
                }
              ]}
            />
          </div>
        </div>
      </div>
    </StaticLayout>
  );
}