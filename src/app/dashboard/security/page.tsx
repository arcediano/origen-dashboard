// 📁 /src/app/dashboard/profile/settings/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, Shield, Globe, Moon, Sun, Save, Key } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Input, Label, Separator } from '@arcediano/ux-library';
import { Toggle } from '@arcediano/ux-library';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('notifications');
  const [isSaving, setIsSaving] = useState(false);

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

  // Estado para preferencias
  const [preferences, setPreferences] = useState({
    language: 'es',
    theme: 'light',
    compactMode: false
  });

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
    <div className="px-4 py-5 sm:px-6 sm:py-6 lg:py-8 lg:max-w-4xl lg:mx-auto">
      {/* Botón volver — solo desktop (MobileTopBar lo gestiona en móvil) */}
      <button 
        onClick={() => router.back()}
        className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground hover:text-origen-pradera mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al perfil
      </button>

      {/* Cabecera — solo desktop (MobileTopBar muestra "Seguridad" en móvil) */}
      <div className="hidden lg:block mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-origen-bosque">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-1">
          Gestiona tus preferencias, notificaciones y seguridad
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="flex items-center gap-1.5 px-2 sm:px-4">
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Avisos</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-1.5 px-2 sm:px-4">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5 px-2 sm:px-4">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs sm:text-sm">Ajustes</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB: NOTIFICACIONES */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-origen-pradera" />
                Notificaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-origen-crema/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium text-origen-bosque">Notificaciones por email</p>
                  <p className="text-sm text-muted-foreground">Nuevos pedidos, confirmaciones</p>
                </div>
                <Toggle
                  checked={notifications.emailOrders}
                  onCheckedChange={() => toggleNotification('emailOrders')}
                  variant="leaf"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-origen-crema/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium text-origen-bosque">Marketing y promociones</p>
                  <p className="text-sm text-muted-foreground">Ofertas y novedades</p>
                </div>
                <Toggle
                  checked={notifications.emailMarketing}
                  onCheckedChange={() => toggleNotification('emailMarketing')}
                  variant="leaf"
                />
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between p-4 bg-origen-crema/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium text-origen-bosque">Nuevos pedidos</p>
                  <p className="text-sm text-muted-foreground">Notificaciones push en tiempo real</p>
                </div>
                <Toggle
                  checked={notifications.pushNewOrder}
                  onCheckedChange={() => toggleNotification('pushNewOrder')}
                  variant="leaf"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-origen-crema/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium text-origen-bosque">Stock bajo</p>
                  <p className="text-sm text-muted-foreground">Alertas cuando queden pocas unidades</p>
                </div>
                <Toggle
                  checked={notifications.pushLowStock}
                  onCheckedChange={() => toggleNotification('pushLowStock')}
                  variant="leaf"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-origen-crema/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium text-origen-bosque">Nuevas reseñas</p>
                  <p className="text-sm text-muted-foreground">Cuando los clientes te valoren</p>
                </div>
                <Toggle
                  checked={notifications.pushReviews}
                  onCheckedChange={() => toggleNotification('pushReviews')}
                  variant="leaf"
                />
              </div>

              <Separator className="my-2" />

              <div className="flex items-center justify-between p-4 bg-origen-crema/30 rounded-lg">
                <div className="space-y-0.5">
                  <p className="font-medium text-origen-bosque">Informe semanal</p>
                  <p className="text-sm text-muted-foreground">Resumen de actividad cada lunes</p>
                </div>
                <Toggle
                  checked={notifications.weeklyReport}
                  onCheckedChange={() => toggleNotification('weeklyReport')}
                  variant="leaf"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveNotifications} disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar preferencias'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: SEGURIDAD */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-origen-pradera" />
                Seguridad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Key className="w-4 h-4 text-origen-pradera" />
                  Cambiar contraseña
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <div className="flex items-end">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={!password.current || !password.new || !password.confirm || isSaving}
                      className="w-full"
                    >
                      Actualizar contraseña
                    </Button>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-origen-bosque">Verificación en dos pasos</h4>
                  <p className="text-sm text-muted-foreground">Añade una capa extra de seguridad a tu cuenta</p>
                </div>
                <Button variant="outline">Activar</Button>
              </div>

              <Alert className="mt-4">
                <Shield className="w-4 h-4" />
                <AlertDescription>
                  Recomendamos usar una contraseña única y activar la verificación en dos pasos para mayor seguridad.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: PREFERENCIAS */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-origen-pradera" />
                Preferencias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Idioma</Label>
                  <select 
                    className="w-full h-10 px-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-menta/50 focus:border-origen-pradera"
                    value={preferences.language}
                    onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                  >
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                    <option value="ca">Catalán</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={preferences.theme === 'light' ? 'primary' : 'outline'}
                      className="flex-1"
                      onClick={() => setPreferences({...preferences, theme: 'light'})}
                    >
                      <Sun className="w-4 h-4 mr-2" />
                      Claro
                    </Button>
                    <Button 
                      variant={preferences.theme === 'dark' ? 'primary' : 'outline'}
                      className="flex-1"
                      onClick={() => setPreferences({...preferences, theme: 'dark'})}
                    >
                      <Moon className="w-4 h-4 mr-2" />
                      Oscuro
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Modo compacto</Label>
                  <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <span className="text-sm">Reducir espaciado en las vistas</span>
                    <Toggle
                      checked={preferences.compactMode}
                      onCheckedChange={(v) => setPreferences({...preferences, compactMode: v})}
                      variant="leaf"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar preferencias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

