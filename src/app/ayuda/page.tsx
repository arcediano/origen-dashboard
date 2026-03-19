export default function HelpCenterPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Centro de Ayuda</h1>
      <div className="space-y-6">
        <div className="bg-surface-alt rounded-xl shadow-sm border border-border-subtle p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Preguntas Frecuentes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-900">¿Cómo registro mi producto?</h3>
              <p className="text-muted-foreground mt-1">Acceda a la sección "Mis Productos" y haga clic en "Crear Producto". Siga las instrucciones paso a paso.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">¿Qué tipos de productos puedo vender?</h3>
              <p className="text-muted-foreground mt-1">Solo productos agrícolas y artesanales producidos localmente pueden ser vendidos en la plataforma.</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">¿Cómo proceso un pedido?</h3>
              <p className="text-muted-foreground mt-1">Ingrese a la sección "Pedidos" y utilice las herramientas disponibles para gestionar y procesar los pedidos recibidos.</p>
            </div>
          </div>
        </div>

        <div className="bg-surface-alt rounded-xl shadow-sm border border-border-subtle p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Recursos de Apoyo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Documentación</h3>
              <p className="text-muted-foreground text-sm mt-1">Guías detalladas sobre todas las funcionalidades de la plataforma.</p>
              <button className="mt-2 text-sm text-origen-pradera hover:text-origen-bosque font-medium">
                Ver documentación
              </button>
            </div>
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-gray-900">Video Tutoriales</h3>
              <p className="text-muted-foreground text-sm mt-1">Vídeos explicativos paso a paso para cada función.</p>
              <button className="mt-2 text-sm text-origen-pradera hover:text-origen-bosque font-medium">
                Ver tutoriales
              </button>
            </div>
          </div>
        </div>

        <div className="bg-surface-alt rounded-xl shadow-sm border border-border-subtle p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Contacto</h2>
          <p className="text-muted-foreground mb-4">
            Si necesita ayuda adicional, puede contactarnos a través de los siguientes canales:
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-origen-crema flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-origen-pradera" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Email de Soporte</p>
                <p className="text-muted-foreground">soporte@origen.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-origen-crema flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-origen-pradera" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Teléfono</p>
                <p className="text-muted-foreground">+34 91 123 45 67</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
