export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Soporte Técnico</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-3">¿Necesita ayuda?</h2>
        <p className="text-gray-600 mb-4">
          Nuestro equipo de soporte está aquí para ayudarle. Complete el formulario a continuación y nos pondremos en contacto con usted lo antes posible.
        </p>
        
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
              <input
                type="text"
                id="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:border-origen-pradera"
                placeholder="Su nombre"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:border-origen-pradera"
                placeholder="su@email.com"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
            <input
              type="text"
              id="subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:border-origen-pradera"
              placeholder="¿En qué podemos ayudarle?"
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
            <textarea
              id="message"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:border-origen-pradera"
              placeholder="Describa su problema o consulta..."
            ></textarea>
          </div>
          
          <button
            type="submit"
            className="px-6 py-2 bg-origen-pradera text-white font-medium rounded-lg hover:bg-origen-bosque transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-origen-pradera"
          >
            Enviar solicitud de soporte
          </button>
        </form>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-origen-crema/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-origen-pradera/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-origen-pradera" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Soporte Telefónico</h3>
          <p className="text-gray-600 text-sm">Llámenos de lunes a viernes de 9:00 a 18:00</p>
          <p className="font-medium text-origen-pradera mt-2">+34 91 123 45 67</p>
        </div>
        
        <div className="bg-origen-crema/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-origen-pradera/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-origen-pradera" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Email de Soporte</h3>
          <p className="text-gray-600 text-sm">Responda en menos de 24 horas hábiles</p>
          <p className="font-medium text-origen-pradera mt-2">soporte@origen.com</p>
        </div>
        
        <div className="bg-origen-crema/30 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-origen-pradera/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-origen-pradera" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">Horario de Atención</h3>
          <p className="text-gray-600 text-sm">Lunes a Viernes de 9:00 a 18:00</p>
          <p className="font-medium text-origen-pradera mt-2">Sábado 10:00 a 14:00</p>
        </div>
      </div>
    </div>
  );
}