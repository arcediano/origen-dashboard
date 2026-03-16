export default function SuccessStoriesPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Casos de Éxito</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-origen-pradera/10 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-origen-pradera flex items-center justify-center text-white text-2xl font-bold">
              Q
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Quesería Artesanal Valle del Tajo</h2>
            <p className="text-gray-600 mb-4">Talavera de la Reina, Toledo</p>
            <p className="text-gray-700">
              "Gracias a Origen Marketplace hemos podido expandir nuestro negocio familiar, llegando a clientes en toda España que valoran la autenticidad de nuestros quesos manchegos."
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-origen-pradera/10 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-origen-pradera flex items-center justify-center text-white text-2xl font-bold">
              V
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Viñedos de la Sierra</h2>
            <p className="text-gray-600 mb-4">San Martín de Valdeiglesias, Madrid</p>
            <p className="text-gray-700">
              "La plataforma nos ha permitido dar a conocer nuestros vinos ecológicos a un público que busca productos de proximidad y con historia."
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-origen-pradera/10 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-origen-pradera flex items-center justify-center text-white text-2xl font-bold">
              M
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Mieles del Mediterráneo</h2>
            <p className="text-gray-600 mb-4">Gandía, Valencia</p>
            <p className="text-gray-700">
              "Nuestras mieles artesanales ahora llegan a restaurantes y consumidores finales que buscan productos naturales y de máxima calidad."
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="h-48 bg-origen-pradera/10 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-origen-pradera flex items-center justify-center text-white text-2xl font-bold">
              E
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Ecológicos del Norte</h2>
            <p className="text-gray-600 mb-4">Logroño, La Rioja</p>
            <p className="text-gray-700">
              "La venta online a través de Origen ha supuesto un aumento del 40% en nuestros ingresos, permitiéndonos mantener nuestra producción ecológica."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}