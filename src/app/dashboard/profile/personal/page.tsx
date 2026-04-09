// 📁 /src/app/dashboard/profile/personal/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Save,
  Camera,
  CheckCircle,
  Edit,
  X
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ProfileSectionNav } from '@/app/dashboard/profile/components/ProfileSectionNav';
import { Card, CardContent, CardHeader, CardTitle } from '@arcediano/ux-library';
import { Button, Input, Label, Badge } from '@arcediano/ux-library';
import { Avatar, AvatarFallback, AvatarImage } from '@arcediano/ux-library';
import { Alert, AlertDescription } from '@arcediano/ux-library';

// Variants corregidos
const itemVariants: Variants = {
  hidden: { 
    opacity: 0 
  },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.2
    }
  }
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05
    }
  }
};

export default function PersonalInfoPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: 'María Martínez',
    email: 'maria@origen.es',
    phone: '+34 612 345 678',
    birthDate: '1985-06-15',
    address: 'Calle Mayor 123',
    city: 'Madrid',
    postalCode: '28001',
    province: 'Madrid',
    country: 'España',
    bio: 'Productora artesanal de quesos con más de 15 años de experiencia. Apasionada de la tradición y la calidad.',
    avatar: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email no válido';
    if (!form.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Elementos decorativos sutiles */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 py-4 sm:px-6 lg:px-8 lg:py-6 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8">
        {/* PageHeader con sus márgenes internos */}
        <PageHeader
          title="Perfil comercial"
          description="Gestiona tus datos personales, de negocio y certificaciones desde una única estructura"
          badgeIcon={User}
          badgeText="Datos personales"
          showBackButton={true}
          onBack={() => router.back()}
        />

        <ProfileSectionNav className="mt-3" />

        {/* Contenido con el mismo espaciado que en Mi Negocio */}
        <div className="mt-6">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            {/* TARJETA DE AVATAR - COMPACTA Y CUADRADA */}
            <motion.div variants={itemVariants}>
              <Card className="border border-border shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Avatar cuadrado con esquinas redondeadas */}
                    <div className="relative group flex-shrink-0">
                      <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-origen-pradera to-origen-hoja flex items-center justify-center shadow-md overflow-hidden">
                        {form.avatar ? (
                          <img src={form.avatar} alt={form.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white text-3xl font-semibold">
                            {form.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        )}
                      </div>
                      
                      {/* Overlay elegante para hover - solo visible en edición */}
                      {isEditing && (
                        <>
                          <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-surface-alt rounded-full p-2 shadow-lg">
                              <Camera className="w-4 h-4 text-origen-bosque" />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Información del usuario */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-origen-bosque truncate">{form.name}</h2>
                          <p className="text-sm text-muted-foreground truncate">{form.email}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="success" size="xs" className="flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Verificado
                            </Badge>
                            <Badge variant="leaf" size="xs">Productor</Badge>
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2 flex-shrink-0">
                          {!isEditing ? (
                            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline" className="border-origen-pradera text-origen-pradera hover:bg-origen-pradera/10">
                              <span className="flex items-center gap-1">
                                <Edit className="w-3.5 h-3.5" />
                                Editar
                              </span>
                            </Button>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" />
                                  Cancelar
                                </span>
                              </Button>
                              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                                <span className="flex items-center gap-1">
                                  {isSaving ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      Guardando
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-3.5 h-3.5" />
                                      Guardar
                                    </>
                                  )}
                                </span>
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* GRID DE 2 COLUMNAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* COLUMNA IZQUIERDA - Datos personales */}
              <motion.div variants={itemVariants}>
                <Card className="border border-border shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <User className="w-4 h-4 text-origen-pradera" />
                      Datos personales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nombre completo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="Tu nombre completo"
                      />
                      {errors.name && <p className="text-xs text-feedback-danger">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="tu@email.com"
                      />
                      {errors.email && <p className="text-xs text-feedback-danger">{errors.email}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Teléfono <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="+34 612 345 678"
                      />
                      {errors.phone && <p className="text-xs text-feedback-danger">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="birthDate" className="text-sm font-medium">
                        Fecha de nacimiento
                      </Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* COLUMNA DERECHA - Dirección */}
              <motion.div variants={itemVariants}>
                <Card className="border border-border shadow-sm h-full">
                  <CardHeader className="pb-3 border-b border-border-subtle">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MapPin className="w-4 h-4 text-origen-pradera" />
                      Dirección
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-1">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Dirección
                      </Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        disabled={!isEditing}
                        className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        placeholder="Calle, número, piso..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="city" className="text-sm">Ciudad</Label>
                        <Input
                          id="city"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="postalCode" className="text-sm">Código postal</Label>
                        <Input
                          id="postalCode"
                          value={form.postalCode}
                          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="province" className="text-sm">Provincia</Label>
                        <Input
                          id="province"
                          value={form.province}
                          onChange={(e) => setForm({ ...form, province: e.target.value })}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="country" className="text-sm">País</Label>
                        <Input
                          id="country"
                          value={form.country}
                          disabled={!isEditing}
                          className={`h-10 ${!isEditing ? 'bg-surface' : ''}`}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* BIOGRAFÍA */}
            <motion.div variants={itemVariants}>
              <Card className="border border-border shadow-sm">
                <CardHeader className="pb-3 border-b border-border-subtle">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-origen-pradera" />
                    Biografía
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-1">
                    <textarea
                      id="bio"
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      disabled={!isEditing}
                      rows={4}
                      className="w-full p-3 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-origen-menta/50 focus:border-origen-pradera disabled:bg-surface"
                      placeholder="Cuéntanos algo sobre ti..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Esta información aparecerá en tu perfil público
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* ALERTA DE VERIFICACIÓN */}
            <motion.div variants={itemVariants}>
              <Alert className="bg-origen-crema/20 border-origen-pradera/30 py-3">
                <CheckCircle className="w-4 h-4 text-origen-pradera" />
                <AlertDescription className="text-sm text-origen-bosque">
                  Tu identidad ha sido verificada. Si necesitas actualizar tu documento, contacta con soporte.
                </AlertDescription>
              </Alert>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}


