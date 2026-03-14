// /**
//  * @file Constantes para el Dashboard del Productor
//  * @version 2.0.0 - Añadida estructura de menús con submenús
//  */

// import {
//   LayoutDashboard,
//   Package,
//   ShoppingBag,
//   TrendingUp,
//   Store,
//   Settings,
//   Truck,
//   CreditCard,
//   Shield,
//   Users,
//   FileText,
//   Image,
//   Award,
//   BarChart3,
//   Bell,
//   HelpCircle,
//   LogOut,
//   ChevronDown,
//   ChevronRight,
//   Home,
//   MapPin,
//   Euro,
//   Clock,
//   Leaf,
//   Heart,
//   Sparkles
// } from 'lucide-react';

// // ============================================================================
// // ESTRUCTURA DEL MENÚ PRINCIPAL CON SUBMENÚS
// // ============================================================================

// export const DASHBOARD_MENU = [
//   {
//     id: 'inicio',
//     label: 'Inicio',
//     icon: LayoutDashboard,
//     href: '/dashboard',
//     exact: true
//   },
//   {
//     id: 'productos',
//     label: 'Productos',
//     icon: Package,
//     href: '/dashboard/products',
//     submenu: [
//       { id: 'todos-productos', label: 'Todos los productos', href: '/dashboard/products' },
//       { id: 'nuevo-producto', label: 'Añadir producto', href: '/dashboard/products/create' },
//       { id: 'categorias', label: 'Categorías', href: '/dashboard/products/categorias' },
//       { id: 'inventario', label: 'Inventario', href: '/dashboard/products/inventario' }
//     ]
//   },
//   {
//     id: 'pedidos',
//     label: 'Pedidos',
//     icon: ShoppingBag,
//     href: '/dashboard/pedidos',
//     submenu: [
//       { id: 'todos-pedidos', label: 'Todos los pedidos', href: '/dashboard/pedidos' },
//       { id: 'pendientes', label: 'Pendientes', href: '/dashboard/pedidos?status=pending' },
//       { id: 'enviados', label: 'Enviados', href: '/dashboard/pedidos?status=shipped' },
//       { id: 'entregados', label: 'Entregados', href: '/dashboard/pedidos?status=delivered' }
//     ]
//   },
//   {
//     id: 'estadisticas',
//     label: 'Estadísticas',
//     icon: TrendingUp,
//     href: '/dashboard/estadisticas',
//     submenu: [
//       { id: 'ventas', label: 'Ventas', href: '/dashboard/estadisticas?tab=ventas' },
//       { id: 'productos-top', label: 'Productos top', href: '/dashboard/estadisticas?tab=top' },
//       { id: 'clientes', label: 'Clientes', href: '/dashboard/estadisticas?tab=clientes' },
//       { id: 'informes', label: 'Informes', href: '/dashboard/estadisticas/informes' }
//     ]
//   },
//   {
//     id: 'perfil',
//     label: 'Mi perfil',
//     icon: Store,
//     href: '/dashboard/profile',
//     submenu: [
//       { id: 'informacion', label: 'Información del negocio', href: '/dashboard/profile' },
//       { id: 'certificaciones', label: 'Certificaciones', href: '/dashboard/profile/certificaciones' },
//       { id: 'imagenes', label: 'Imágenes y logo', href: '/dashboard/profile/imagenes' },
//       { id: 'historia', label: 'Historia y valores', href: '/dashboard/profile/historia' }
//     ]
//   },
//   {
//     id: 'configuracion',
//     label: 'Configuración',
//     icon: Settings,
//     href: '/dashboard/configuracion',
//     submenu: [
//       { id: 'envios', label: 'Envíos', href: '/dashboard/configuracion/envios' },
//       { id: 'pagos', label: 'Pagos', href: '/dashboard/configuracion/pagos' },
//       { id: 'notificaciones', label: 'Notificaciones', href: '/dashboard/configuracion/notificaciones' },
//       { id: 'privacidad', label: 'Privacidad', href: '/dashboard/configuracion/privacidad' }
//     ]
//   }
// ];

// // ============================================================================
// // MENÚ SECUNDARIO (PARTE INFERIOR)
// // ============================================================================

// export const DASHBOARD_SECONDARY_MENU = [
//   {
//     id: 'ayuda',
//     label: 'Centro de ayuda',
//     icon: HelpCircle,
//     href: '/ayuda'
//   },
//   {
//     id: 'cerrar-sesion',
//     label: 'Cerrar sesión',
//     icon: LogOut,
//     href: '/auth/logout'
//   }
// ];

// export const TEAM_SIZES = {
//   '1-2': 'Emprendedor individual (1-2 personas)',
//   '3-5': 'Pequeño equipo (3-5 personas)',
//   '6-10': 'Equipo mediano (6-10 personas)',
//   '11+': 'Gran equipo (más de 11 personas)'
// } as const;

// export const VALUE_ICONS: Record<string, { icon: string; color: string; label: string }> = {
//   tradicion: { icon: 'Clock', color: 'bg-amber-100 text-amber-800', label: 'Tradición' },
//   calidad: { icon: 'Award', color: 'bg-blue-100 text-blue-800', label: 'Calidad' },
//   familiar: { icon: 'Users', color: 'bg-green-100 text-green-800', label: 'Familiar' },
//   artesanal: { icon: 'Heart', color: 'bg-red-100 text-red-800', label: 'Artesanal' },
//   ecologico: { icon: 'Leaf', color: 'bg-origen-pastel text-origen-bosque', label: 'Ecológico' },
//   local: { icon: 'MapPin', color: 'bg-purple-100 text-purple-800', label: 'Local' },
//   innovacion: { icon: 'Sparkles', color: 'bg-indigo-100 text-indigo-800', label: 'Innovación' },
//   sostenibilidad: { icon: 'Leaf', color: 'bg-emerald-100 text-emerald-800', label: 'Sostenibilidad' }
// };

// export const ORDER_STATUS = {
//   pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700' },
//   shipped: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
//   delivered: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
//   cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700' }
// } as const;

// export const PRODUCT_STATUS = {
//   active: { label: 'Activo', color: 'bg-green-100 text-green-700' },
//   inactive: { label: 'Inactivo', color: 'bg-gray-100 text-gray-700' },
//   out_of_stock: { label: 'Sin stock', color: 'bg-red-100 text-red-700' }
// } as const;