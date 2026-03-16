import { StaticLayout } from './static-layout';

export default function LegalNoticePage() {
  return (
    <StaticLayout>
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Aviso Legal
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Información legal sobre el uso de Origen Marketplace
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 prose max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">1. Identificación</h2>
              <p className="text-gray-700 mt-4">
                ORIGEN MARKETPLACE S.L. con CIF B12345678, inscrita en el Registro Mercantil de Madrid, Tomo 12345, Folio 123, Hoja M-123456.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">2. Objeto</h2>
              <p className="text-gray-700 mt-4">
                Plataforma digital que pone en contacto a productores artesanales con compradores interesados en productos de calidad.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">3. Condiciones de Uso</h2>
              <p className="text-gray-700 mt-4">
                El acceso y uso de la plataforma implica la aceptación plena de las condiciones aquí establecidas.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">4. Propiedad Intelectual</h2>
              <p className="text-gray-700 mt-4">
                Todos los contenidos de la plataforma son propiedad de ORIGEN MARKETPLACE S.L. o de sus licenciantes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">5. Responsabilidad</h2>
              <p className="text-gray-700 mt-4">
                ORIGEN MARKETPLACE actúa como intermediario, no siendo responsable de las transacciones entre usuarios.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">6. Legislación Aplicable</h2>
              <p className="text-gray-700 mt-4">
                Estos términos se rigen por la legislación española.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 border-b pb-2">7. Contacto</h2>
              <p className="text-gray-700 mt-4">
                Para cualquier consulta sobre este aviso legal:
                <br />
                Email: legal@origen.com
                <br />
                Dirección: Calle Ejemplo 123, Madrid, España
              </p>
            </section>
          </div>
        </div>
      </div>
    </StaticLayout>
  );
}