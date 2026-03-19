/**
 * @page NotificationsPage
 * @description Preferencias de notificaciones
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Mail, 
  Smartphone, 
  ShoppingBag, 
  Star, 
  Package,
  Megaphone,
  Save
} from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Button } from '@/components/ui/atoms/button';
import { Toggle } from '@/components/ui/atoms/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/atoms/tabs';

export default function NotificationsPage() {
  const [emailSettings, setEmailSettings] = useState({
    orders: true,
    marketing: false,
    reviews: true,
    security: true
  });

  const [pushSettings, setPushSettings] = useState({
    orders: true,
    lowStock: true,
    reviews: true,
    campaigns: false
  });

  const handleSave = () => {
    console.log('Guardar preferencias');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-6 py-8 space-y-8"
    >
      <PageHeader
        title="Notificaciones"
        description="Configura cómo y cuándo quieres recibir notificaciones"
        badgeIcon={Bell}
        badgeText="Preferencias"
        tooltip="Notificaciones"
        tooltipDetailed="Elige qué notificaciones recibir por email y push."
        actions={
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar preferencias
          </Button>
        }
      />

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="push">
            <Smartphone className="w-4 h-4 mr-2" />
            Push
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <Card variant="elevated">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <ShoppingBag className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Nuevos pedidos</p>
                    <p className="text-sm text-muted-foreground">Recibe un email cuando haya un nuevo pedido</p>
                  </div>
                </div>
                <Toggle
                  checked={emailSettings.orders}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, orders: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Nuevas reseñas</p>
                    <p className="text-sm text-muted-foreground">Cuando un cliente deje una reseña</p>
                  </div>
                </div>
                <Toggle
                  checked={emailSettings.reviews}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, reviews: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Marketing y promociones</p>
                    <p className="text-sm text-muted-foreground">Ofertas, novedades y recomendaciones</p>
                  </div>
                </div>
                <Toggle
                  checked={emailSettings.marketing}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, marketing: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Stock bajo</p>
                    <p className="text-sm text-muted-foreground">Alertas cuando un producto tenga stock bajo</p>
                  </div>
                </div>
                <Toggle
                  checked={emailSettings.orders}
                  onCheckedChange={(checked) => setEmailSettings({...emailSettings, orders: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="push" className="mt-6">
          <Card variant="elevated">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <ShoppingBag className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Nuevos pedidos</p>
                    <p className="text-sm text-muted-foreground">Notificaciones push para nuevos pedidos</p>
                  </div>
                </div>
                <Toggle
                  checked={pushSettings.orders}
                  onCheckedChange={(checked) => setPushSettings({...pushSettings, orders: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Stock bajo</p>
                    <p className="text-sm text-muted-foreground">Alertas de inventario en tiempo real</p>
                  </div>
                </div>
                <Toggle
                  checked={pushSettings.lowStock}
                  onCheckedChange={(checked) => setPushSettings({...pushSettings, lowStock: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Nuevas reseñas</p>
                    <p className="text-sm text-muted-foreground">Notificaciones cuando recibas una reseña</p>
                  </div>
                </div>
                <Toggle
                  checked={pushSettings.reviews}
                  onCheckedChange={(checked) => setPushSettings({...pushSettings, reviews: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Megaphone className="w-5 h-5 text-origen-pradera mt-0.5" />
                  <div>
                    <p className="font-medium">Campañas</p>
                    <p className="text-sm text-muted-foreground">Resultados y actualizaciones de campañas</p>
                  </div>
                </div>
                <Toggle
                  checked={pushSettings.campaigns}
                  onCheckedChange={(checked) => setPushSettings({...pushSettings, campaigns: checked})}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}