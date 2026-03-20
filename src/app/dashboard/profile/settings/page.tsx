// 📁 /src/app/dashboard/profile/settings/page.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Shield, 
  Bell, 
  Key,
  Save,
  Mail,
  Smartphone,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Label } from '@/components/ui/atoms/label';
import { Toggle } from '@/components/ui/atoms/toggle';
import { Alert, AlertDescription } from '@/components/ui/atoms/alert';
import { Separator } from '@/components/ui/atoms/separator';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25
    }
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  // Estado para notificaciones
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailMarketing: false,
    pushNewOrder: true,
    pushLowStock: true,
    pushReviews: true,
    weeklyReport: true
  });

  // Estado para seguridad
  const [password, setPassword] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (password.new !== password.confirm) {
      alert('Las contraseñas no coinciden');
      return;
    }
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPassword({ current: '', new: '', confirm: '' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Elementos decorativos */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-4xl">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-origen-pradera mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al perfil
        </button>

        <PageHeader
          title="Configuración"
          description="Gestiona la seguridad de tu cuenta y tus preferencias de notificaciones"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          
          {/* CARD 1: Seguridad */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card className={`h-full ${tab === 'security' ? 'ring-2 ring-origen-pradera' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-origen-pradera" />
                  Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Cambiar contraseña */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Key className="w-4 h-4 text-origen-pradera" />
                    Cambiar contraseña
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Contraseña actual</Label>
                      <Input
                        type="password"
                        value={password.current}
                        onChange={(e) => setPassword({...password, current: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nueva contraseña</Label>
                      <Input
                        type="password"
                        value={password.new}
                        onChange={(e) => setPassword({...password, new: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirmar contraseña</Label>
                      <Input
                        type="password"
                        value={password.confirm}
                        onChange={(e) => setPassword({...password, confirm: e.target.value})}
                        placeholder="••••••••"
                      />
                    </div>
                    <Button 
                      onClick={handleChangePassword}
                      disabled={!password.current || !password.new || !password.confirm || isSaving}
                      className="w-full"
                    >
                      {isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Doble factor de autenticación */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-origen-bosque">Verificación en dos pasos</h4>
                      <p className="text-xs text-muted-foreground">Añade una capa extra de seguridad</p>
                    </div>
                    <Toggle
                      checked={twoFactorEnabled}
                      onCheckedChange={setTwoFactorEnabled}
                      variant="leaf"
                    />
                  </div>
                  
                  {twoFactorEnabled && (
                    <Alert className="mt-2">
                      <Lock className="w-4 h-4" />
                      <AlertDescription className="text-xs">
                        La verificación en dos pasos está activada. Recibirás un código adicional al iniciar sesión.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 2: Notificaciones */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Card className={`h-full ${tab === 'notifications' ? 'ring-2 ring-origen-pradera' : ''}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="w-5 h-5 text-origen-pradera" />
                  Notificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Email - Nuevos pedidos</p>
                      <p className="text-xs text-muted-foreground">Confirmaciones y actualizaciones</p>
                    </div>
                  </div>
                  <Toggle
                    checked={notifications.emailOrders}
                    onCheckedChange={() => toggleNotification('emailOrders')}
                    variant="leaf"
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Email - Marketing</p>
                      <p className="text-xs text-muted-foreground">Ofertas y novedades</p>
                    </div>
                  </div>
                  <Toggle
                    checked={notifications.emailMarketing}
                    onCheckedChange={() => toggleNotification('emailMarketing')}
                    variant="leaf"
                    size="sm"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Push - Nuevos pedidos</p>
                      <p className="text-xs text-muted-foreground">Notificaciones en tiempo real</p>
                    </div>
                  </div>
                  <Toggle
                    checked={notifications.pushNewOrder}
                    onCheckedChange={() => toggleNotification('pushNewOrder')}
                    variant="leaf"
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Push - Stock bajo</p>
                      <p className="text-xs text-muted-foreground">Alertas de inventario</p>
                    </div>
                  </div>
                  <Toggle
                    checked={notifications.pushLowStock}
                    onCheckedChange={() => toggleNotification('pushLowStock')}
                    variant="leaf"
                    size="sm"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Push - Nuevas reseñas</p>
                      <p className="text-xs text-muted-foreground">Cuando te valoren</p>
                    </div>
                  </div>
                  <Toggle
                    checked={notifications.pushReviews}
                    onCheckedChange={() => toggleNotification('pushReviews')}
                    variant="leaf"
                    size="sm"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 bg-origen-crema/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-origen-bosque">Informe semanal</p>
                      <p className="text-xs text-muted-foreground">Resumen de actividad</p>
                    </div>
                  </div>
                  <Toggle
                    checked={notifications.weeklyReport}
                    onCheckedChange={() => toggleNotification('weeklyReport')}
                    variant="leaf"
                    size="sm"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveNotifications} disabled={isSaving} size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Guardar cambios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}