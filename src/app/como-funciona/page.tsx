export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cómo funciona Origen Marketplace</h1>
      
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Para Productores</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">1. Regístrate como productor</h3>
              <p className="text-gray-600 mt-1">Completa el formulario de registro con tus datos básicos y de negocio.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">2. Configura tu perfil</h3>
              <p className="text-gray-600 mt-1">Añade información sobre tu empresa, productos y certificaciones.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">3. Publica tus productos</h3>
              <p className="text-gray-600 mt-1">Sube fotos, descripciones y precios de tus productos artesanales.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Para Compradores</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">1. Explora productos</h3>
              <p className="text-gray-600 mt-1">Busca y descubre productos artesanales de calidad.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">2. Realiza pedidos</h3>
              <p className="text-gray-600 mt-1">Selecciona productos y completa el proceso de compra.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">3. Recibe tus productos</h3>
              <p className="text-gray-600 mt-1">Disfruta de entregas rápidas y seguras directamente del productor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}