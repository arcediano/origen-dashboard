// 📁 /src/app/dashboard/security/page.tsx
'use client';

import { Shield, Globe, Moon, Sun, Save, Key } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Input, Label, Separator } from '@arcediano/ux-library';
import { Toggle } from '@arcediano/ux-library';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('security');
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema">

      {/* Cabecera canónica */}
      <PageHeader
        title="Seguridad"
        description="Contraseña, verificación en dos pasos y preferencias de cuenta"
        badgeIcon={Shield}
        badgeText="Seguridad"
        tooltip="Seguridad"
        tooltipDetailed="Gestiona tu contraseña, verificación en dos pasos y preferencias generales de tu cuenta."
      />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8 max-w-5xl">

      <div className="mb-5 rounded-[28px] border border-origen-pradera/25 bg-gradient-to-br from-origen-crema via-surface-alt to-surface p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex-shrink-0">
            <Shield className="h-5 w-5 text-origen-pradera" />
          </div>
          <div>
            <p className="text-sm font-semibold text-origen-bosque leading-tight">Protege tu cuenta</p>
            <p className="mt-1 text-xs text-text-subtle sm:text-sm">Actualiza tu contraseña y activa capas extra de seguridad para reducir riesgos de acceso.</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-border-subtle bg-surface p-1.5 min-h-[44px]">
          <TabsTrigger value="security" className="flex items-center gap-1.5 px-3 sm:px-4 min-h-[40px] rounded-xl text-sm font-semibold">
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Seguridad</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-1.5 px-3 sm:px-4 min-h-[40px] rounded-xl text-sm font-semibold">
            <Globe className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Ajustes</span>
          </TabsTrigger>
        </TabsList>

        {/* ── PLACEHOLDER: TAB NOTIFICACIONES ELIMINADO ─────────────────────────
            Las preferencias de notificación se gestionan en /dashboard/notifications
            Ruta canónica según ADR-001 (Sprint 22)
        ──────────────────────────────────────────────────────────────────────── */}

        {/* TAB: SEGURIDAD — único contenido de /dashboard/security */}
        <TabsContent value="security">
          <Card className="rounded-2xl border border-border-subtle shadow-sm">
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
          <Card className="rounded-2xl border border-border-subtle shadow-sm">
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
                    className="w-full h-10 px-3 border border-border-subtle bg-surface rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-menta/50 focus:border-origen-pradera"
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
                  <span className="inline-flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    <span>Guardar preferencias</span>
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      </div>
    </div>
  );
}

