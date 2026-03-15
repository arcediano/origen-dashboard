/**
 * @page ProducerDashboard
 * @description Dashboard principal - ESTILO UNIFICADO CON REGISTER
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DashboardFooter } from '@/app/dashboard/components/footer/DashboardFooter';
import { Button } from '@/components/ui/atoms/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/atoms/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/atoms/tabs';
import { Alert } from '@/components/ui/atoms/alert';
import { StatsCard } from '@/components/features/dashboard/components/stats/stats-card';
import { QuickActionCard } from '@/components/features/dashboard/components/quick-actions/quick-action-card';
import { OrderItem } from '@/components/features/dashboard/components/recent/order-item';
import { ProductItem } from '@/components/features/dashboard/components/recent/product-item';

// Iconos
import {
  Eye,
  ShoppingBag,
  DollarSign,
  Star,
  MapPin,
  Calendar,
  Users,
  Shield,
  Clock,
  Package,
  Truck,
  BarChart3,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Store,
  Award,
  Leaf
} from 'lucide-react';

// ============================================================================
// DATOS DE EJEMPLO (Mocks)
// ============================================================================
const MOCK_PRODUCER = {
  id: 'prod_1',
  businessName: 'Quesería Artesana Valle del Tajo',
  tagline: 'El auténtico sabor de la tradición manchega desde 1985',
  city: 'Talavera de la Reina',
  province: 'Toledo',
  foundedYear: 1985,
  teamSize: '6-10',
  certifications: [
    { id: 'cert_1', name: 'Agricultura Ecológica', verified: true },
    { id: 'cert_2', name: 'DOP Queso Manchego', verified: true },
  ],
  verified: true,
  logoUrl: ''
};

const MOCK_STATS = {
  profileViews: { today: 245, trend: 12.5 },
  orders: { today: 18, trend: 8.3 },
  revenue: { today: 1230, trend: 24.8 },
  rating: { average: 4.9, total: 128 }
};

const MOCK_RECENT_ORDERS = [
  {
    id: '1',
    orderNumber: 'ORD-2024-1234',
    customer: 'Ana García Martínez',
    items: 3,
    total: 89.70,
    status: 'pending' as const,
    date: '12 Mar'
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-1233',
    customer: 'Carlos Rodríguez López',
    items: 2,
    total: 45.90,
    status: 'processing' as const,
    date: '11 Mar'
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-1232',
    customer: 'María López Sánchez',
    items: 1,
    total: 28.50,
    status: 'shipped' as const,
    date: '10 Mar'
  }
];

const MOCK_TOP_PRODUCTS = [
  {
    id: 'prod_1',
    name: 'Queso Curado 6 meses',
    sku: 'QSC-001',
    price: 24.50,
    stock: 23,
    sales: 45,
    trend: 15
  },
  {
    id: 'prod_2',
    name: 'Queso Semi 3 meses',
    sku: 'QSS-002',
    price: 19.00,
    stock: 15,
    sales: 38,
    trend: 8
  },
  {
    id: 'prod_3',
    name: 'Queso Fresco de Cabra',
    sku: 'QFC-003',
    price: 13.00,
    stock: 8,
    sales: 32,
    trend: 22
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ProducerDashboard() {
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 20) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
    
    setCurrentTime(new Date().toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  if (!mounted) return null;

  const yearsOfExperience = new Date().getFullYear() - MOCK_PRODUCER.foundedYear;
  const producerInitials = MOCK_PRODUCER.businessName
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Header - INTEGRADO EN EL GRADIENTE */}
      <div className="bg-transparent">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Badge - EJEMPLO PARA TODOS LOS BADGES */}
              <div className="inline-flex items-center gap-2 bg-origen-pradera/10 text-origen-bosque rounded-full px-4 py-2 mb-4 border border-origen-pradera/30">
                <Sparkles className="w-4 h-4 text-origen-pradera" />
                <span className="text-sm font-medium">Panel de control</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-origen-bosque mb-2">
                {greeting}, María
              </h1>
              <p className="text-gray-500 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {currentTime}
              </p>
            </div>
            
            {/* Botón - CORREGIDO */}
            <Button 
              variant="outline" 
              size="lg"
              className="border-origen-pradera text-origen-pradera hover:bg-origen-pradera/10 h-auto py-3 px-6"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Ver tienda pública
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-6 py-8 space-y-8"
      >
        {/* Perfil rápido con BADGES CORREGIDOS - MISMA ESTRUCTURA QUE "Panel de control" */}
        <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6 items-start">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-4 ring-white shadow-xl">
              <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-xl">
                {producerInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-origen-bosque">{MOCK_PRODUCER.businessName}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <MapPin className="w-4 h-4 text-origen-pradera" />
                <span>{MOCK_PRODUCER.city}, {MOCK_PRODUCER.province}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <Calendar className="w-4 h-4 text-origen-pradera" />
                <span>{yearsOfExperience} años</span>
              </div>
            </div>
          </div>
          
          {/* BADGES - EXACTAMENTE IGUALES QUE "Panel de control" */}
          <div className="flex flex-wrap gap-2">
            {MOCK_PRODUCER.certifications.map(cert => (
              <div 
                key={cert.id} 
                className="inline-flex items-center gap-2 bg-origen-pradera/10 text-origen-bosque rounded-full px-4 py-2 border border-origen-pradera/30"
              >
                <Shield className="w-4 h-4 text-origen-pradera" />
                <span className="text-sm font-medium whitespace-nowrap">{cert.name}</span>
              </div>
            ))}
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-2 border border-green-200">
              <Award className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium whitespace-nowrap">Verificado</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            label="Visitas hoy"
            value={MOCK_STATS.profileViews.today}
            icon={Eye}
            trend={{ value: MOCK_STATS.profileViews.trend, isPositive: true }}
            gradient="from-origen-pradera to-origen-hoja"
          />
          <StatsCard
            label="Pedidos hoy"
            value={MOCK_STATS.orders.today}
            icon={ShoppingBag}
            trend={{ value: MOCK_STATS.orders.trend, isPositive: true }}
            gradient="from-origen-pradera to-origen-hoja"
          />
          <StatsCard
            label="Ingresos hoy"
            value={`${MOCK_STATS.revenue.today}€`}
            icon={DollarSign}
            trend={{ value: MOCK_STATS.revenue.trend, isPositive: true }}
            gradient="from-origen-hoja to-origen-pino"
          />
          <StatsCard
            label="Valoración"
            value={MOCK_STATS.rating.average.toFixed(1)}
            sublabel={`${MOCK_STATS.rating.total} reseñas`}
            icon={Star}
            gradient="from-origen-pino to-origen-bosque"
          />
        </motion.div>

        {/* Acciones rápidas */}
        <motion.div variants={itemVariants}>
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">
            Acciones rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              title="Nuevo producto"
              description="Añade un producto a tu catálogo"
              icon={Package}
              href="/dashboard/dashboard/dashboard/dashboard/dashboard/dashboard/dashboard/products/create"
              gradient="from-origen-pradera to-origen-hoja"
            />
            <QuickActionCard
              title="Ver pedidos"
              description="Gestiona tus pedidos pendientes"
              icon={ShoppingBag}
              href="/dashboard/pedidos"
              badge={3}
              gradient="from-origen-pradera to-origen-hoja"
            />
            <QuickActionCard
              title="Mi perfil"
              description="Actualiza la información de tu negocio"
              icon={Store}
              href="/dashboard/profile"
              gradient="from-origen-hoja to-origen-pino"
            />
            <QuickActionCard
              title="Estadísticas"
              description="Analiza el rendimiento de tu tienda"
              icon={BarChart3}
              href="/dashboard/estadisticas"
              gradient="from-origen-pino to-origen-bosque"
            />
          </div>
        </motion.div>

        {/* Alertas */}
        <motion.div variants={itemVariants} className="space-y-3">
          <Alert 
            variant="warning" 
            dismissible 
            title="Stock bajo: Queso Fresco (8 uds)" 
            description="Revisa el inventario para reabastecer."
          />
          <Alert 
            variant="info" 
            dismissible 
            title="Certificación por renovar" 
            description="Bienestar Animal expira en 30 días."
          />
        </motion.div>

        {/* Grid principal - Pedidos y productos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna izquierda: Pedidos recientes */}
          <motion.div variants={itemVariants} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Pedidos recientes
              </h3>
              <Link 
                href="/dashboard/pedidos" 
                className="text-sm text-origen-pradera hover:text-origen-hoja flex items-center gap-1"
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {MOCK_RECENT_ORDERS.map(order => (
                <OrderItem key={order.id} {...order} />
              ))}
            </div>
          </motion.div>

          {/* Columna derecha: Productos top */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
                Productos top
              </h3>
              <Link 
                href="/products" 
                className="text-sm text-origen-pradera hover:text-origen-hoja flex items-center gap-1"
              >
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {MOCK_TOP_PRODUCTS.map(product => (
                <ProductItem key={product.id} {...product} />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="overview" variant="minimal" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="overview" icon={<Sparkles className="w-4 h-4" />}>
                Visión general
              </TabsTrigger>
              <TabsTrigger value="products" icon={<Package className="w-4 h-4" />}>
                Productos
              </TabsTrigger>
              <TabsTrigger value="orders" icon={<ShoppingBag className="w-4 h-4" />}>
                Pedidos
              </TabsTrigger>
              <TabsTrigger value="analytics" icon={<BarChart3 className="w-4 h-4" />}>
                Analíticas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="bg-white/50 rounded-xl p-8 text-center text-gray-500 border border-gray-200">
                Contenido detallado próximamente...
              </div>
            </TabsContent>
            
            <TabsContent value="products">
              <div className="bg-white/50 rounded-xl p-8 text-center text-gray-500 border border-gray-200">
                Gestión de productos próximamente...
              </div>
            </TabsContent>
            
            <TabsContent value="orders">
              <div className="bg-white/50 rounded-xl p-8 text-center text-gray-500 border border-gray-200">
                Gestión de pedidos próximamente...
              </div>
            </TabsContent>
            
            <TabsContent value="analytics">
              <div className="bg-white/50 rounded-xl p-8 text-center text-gray-500 border border-gray-200">
                Analíticas próximamente...
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>

      <DashboardFooter />
    </div>
  );
}