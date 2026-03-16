export default function LegalNoticePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Aviso Legal</h1>
      <div className="prose max-w-none">
        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. Identificación</h2>
        <p className="text-gray-700 mb-4">
          ORIGEN MARKETPLACE S.L. con CIF B12345678, inscrita en el Registro Mercantil de Madrid, Tomo 12345, Folio 123, Hoja M-123456.
        </p>
        
        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. Objeto</h2>
        <p className="text-gray-700 mb-4">
          Plataforma digital que pone en contacto a productores artesanales con compradores interesados en productos de calidad.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. Condiciones de Uso</h2>
        <p className="text-gray-700 mb-4">
          El acceso y uso de la plataforma implica la aceptación plena de las condiciones aquí establecidas.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Propiedad Intelectual</h2>
        <p className="text-gray-700 mb-4">
          Todos los contenidos de la plataforma son propiedad de ORIGEN MARKETPLACE S.L. o de sus licenciantes.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Responsabilidad</h2>
        <p className="text-gray-700 mb-4">
          ORIGEN MARKETPLACE actúa como intermediario, no siendo responsable de las transacciones entre usuarios.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">6. Legislación Aplicable</h2>
        <p className="text-gray-700 mb-4">
          Estos términos se rigen por la legislación española.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">7. Contacto</h2>
        <p className="text-gray-700 mb-4">
          Para cualquier consulta sobre este aviso legal:
          <br />
          Email: legal@origen.com
          <br />
          Dirección: Calle Ejemplo 123, Madrid, España
        </p>
      </div>
    </div>
  );
}