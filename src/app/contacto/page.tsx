import { AuthFooter } from '@/components/features/auth/components/auth-footer';
import { ContactForm } from '@/components/features/contact/ContactForm';
import { ContactInfo } from '@/components/features/contact/ContactInfo';
import { MapSection } from '@/components/features/contact/MapSection';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-origen-pradera/5 flex flex-col">
      {/* Header similar al login */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-origen-pino flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 200 200" aria-hidden="true">
                <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="3"/>
                <path d="M100 140 L100 80" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/>
                <path d="M100 90 Q85 75, 75 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                <path d="M100 90 Q115 75, 125 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="100" cy="140" r="8" fill="currentColor"/>
                <circle cx="100" cy="140" r="5" fill="#74C69D"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">ORIGEN</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="/" className="text-sm font-medium text-gray-700 hover:text-origen-pino transition-colors">Inicio</a>
            <a href="/como-funciona" className="text-sm font-medium text-gray-700 hover:text-origen-pino transition-colors">Cómo funciona</a>
            <a href="/productores" className="text-sm font-medium text-gray-700 hover:text-origen-pino transition-colors">Productores</a>
          </nav>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="flex-grow container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contacta con nuestro equipo</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ¿Tienes alguna pregunta? Estamos aquí para ayudarte. Completa el formulario o utiliza nuestros datos de contacto directo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <ContactForm />
            <MapSection />
          </div>
          
          <div className="space-y-6">
            <ContactInfo />
          </div>
        </div>
      </main>

      {/* Footer de autenticación */}
      <AuthFooter variant="login" />
    </div>
  );
}