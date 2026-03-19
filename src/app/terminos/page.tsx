export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-foreground mb-4">Términos y Condiciones</h1>
      <div className="prose max-w-none">
        <p className="text-foreground mb-4">
          Bienvenido a Origen Marketplace. Estos Términos y Condiciones regulan su uso de nuestra plataforma.
        </p>
        
        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">1. Aceptación de los Términos</h2>
        <p className="text-foreground mb-4">
          Al acceder o utilizar nuestra plataforma, acepta quedar vinculado por estos Términos y Condiciones.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">2. Uso de la Plataforma</h2>
        <p className="text-foreground mb-4">
          Puede utilizar nuestra plataforma para:
        </p>
        <ul className="list-disc pl-6 text-foreground mb-4">
          <li>Publicar productos como productor</li>
          <li>Hacer pedidos como cliente</li>
          <li>Comunicarse con otros usuarios</li>
          <li>Acceder a información de productos y servicios</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">3. Responsabilidades del Usuario</h2>
        <p className="text-foreground mb-4">
          Como usuario, debe:
        </p>
        <ul className="list-disc pl-6 text-foreground mb-4">
          <li>Proporcionar información verdadera y completa</li>
          <li>Mantener segura su contraseña</li>
          <li>No usar la plataforma para actividades ilegales</li>
          <li>No interferir con el funcionamiento de la plataforma</li>
        </ul>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">4. Propiedad Intelectual</h2>
        <p className="text-foreground mb-4">
          Todos los contenidos de la plataforma son propiedad de Origen Marketplace o de sus licenciatarios.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">5. Limitación de Responsabilidad</h2>
        <p className="text-foreground mb-4">
          La plataforma se proporciona "tal cual". No garantizamos que esté libre de errores ni que cumpla con sus expectativas.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">6. Modificaciones de los Términos</h2>
        <p className="text-foreground mb-4">
          Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor inmediatamente después de su publicación.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">7. Ley Aplicable</h2>
        <p className="text-foreground mb-4">
          Estos términos se rigen por las leyes de España.
        </p>

        <h2 className="text-xl font-semibold text-foreground mt-6 mb-3">8. Contacto</h2>
        <p className="text-foreground mb-4">
          Para cualquier consulta sobre estos términos, puede contactarnos en:
        </p>
        <p className="text-foreground mb-4">
          Email: soporte@origen.com<br />
          Dirección: Calle Ejemplo 123, Madrid, España
        </p>
      </div>
    </div>
  );
}
