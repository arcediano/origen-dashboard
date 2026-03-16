export default function CookiePolicyPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Política de Cookies</h1>
      <div className="prose max-w-none">
        <p className="text-gray-700 mb-4">
          Esta Política de Cookies explica qué son las cookies, cómo las utilizamos en Origen Marketplace y cómo puede controlarlas.
        </p>
        
        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">1. ¿Qué Son las Cookies?</h2>
        <p className="text-gray-700 mb-4">
          Las cookies son archivos de texto pequeños que se almacenan en su dispositivo cuando visita un sitio web. Nos permiten recordar su visita y mejorar su experiencia.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">2. Cookies que Usamos</h2>
        <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">Cookies Necesarias</h3>
        <p className="text-gray-700 mb-4">
          Estas cookies son esenciales para el funcionamiento del sitio. Sin ellas, algunas funciones no funcionarían correctamente.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li>Autenticación de usuarios</li>
          <li>Funciones de seguridad básica</li>
          <li>Preferencias de idioma</li>
        </ul>

        <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">Cookies Analíticas</h3>
        <p className="text-gray-700 mb-4">
          Estas cookies nos ayudan a entender cómo interactúa con nuestro sitio, permitiéndonos mejorar continuamente la experiencia del usuario.
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-4">
          <li>Google Analytics</li>
          <li>Medición de rendimiento</li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">3. Control de Cookies</h2>
        <p className="text-gray-700 mb-4">
          Puede controlar o eliminar las cookies según sus preferencias. Puede gestionar estas configuraciones desde la configuración de su navegador.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">4. Cambios en la Política</h2>
        <p className="text-gray-700 mb-4">
          Podemos actualizar esta Política de Cookies ocasionalmente. Le notificaremos cualquier cambio mediante una notificación en el sitio.
        </p>

        <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">5. Contacto</h2>
        <p className="text-gray-700 mb-4">
          Para cualquier pregunta sobre nuestra Política de Cookies, puede contactarnos en:
        </p>
        <p className="text-gray-700 mb-4">
          Email: soporte@origen.com<br />
          Dirección: Calle Ejemplo 123, Madrid, España
        </p>
      </div>
    </div>
  );
}