import StaticLayout from '../static-layout';
import { TestimonialsSection } from '@/components/features/landing/components/sections/testimonials-section';

export default function SuccessStoriesPage() {
  return (
    <StaticLayout>
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Casos de Éxito
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Descubre cómo productores artesanales han transformado sus negocios con Origen Marketplace
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <TestimonialsSection 
            testimonials={[
              {
                name: "Quesería Artesanal Valle del Tajo",
                location: "Talavera de la Reina, Toledo",
                quote: "Gracias a Origen Marketplace hemos podido expandir nuestro negocio familiar, llegando a clientes en toda España que valoran la autenticidad de nuestros quesos manchegos.",
                avatar: "/avatars/queseria.jpg",
                category: "Quesos"
              },
              {
                name: "Viñedos de la Sierra",
                location: "San Martín de Valdeiglesias, Madrid",
                quote: "La plataforma nos ha permitido dar a conocer nuestros vinos ecológicos a un público que busca productos de proximidad y con historia.",
                avatar: "/avatars/vinedos.jpg",
                category: "Vinos"
              },
              {
                name: "Mieles del Mediterráneo",
                location: "Gandía, Valencia",
                quote: "Nuestras mieles artesanales ahora llegan a restaurantes y consumidores finales que buscan productos naturales y de máxima calidad.",
                avatar: "/avatars/mieles.jpg",
                category: "Miel"
              },
              {
                name: "Ecológicos del Norte",
                location: "Logroño, La Rioja",
                quote: "La venta online a través de Origen ha supuesto un aumento del 40% en nuestros ingresos, permitiéndonos mantener nuestra producción ecológica.",
                avatar: "/avatars/ecologicos.jpg",
                category: "Productos Ecológicos"
              }
            ]}
          />
        </div>
      </div>
    </StaticLayout>
  );
}