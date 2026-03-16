import { StaticLayout } from './static-layout';
import { ContactForm } from '@/components/features/contact/ContactForm';
import { ContactInfo } from '@/components/features/contact/ContactInfo';
import { MapSection } from '@/components/features/contact/MapSection';

export default function ContactPage() {
  return (
    <StaticLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Contacta con Nosotros
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Estamos aquí para ayudarte. Envíanos un mensaje y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <ContactForm />
            <MapSection />
          </div>
          
          <div className="space-y-8">
            <ContactInfo />
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Preguntas Frecuentes</h2>
              <div className="space-y-4">
                {/* FAQ items would go here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaticLayout>
  );
}