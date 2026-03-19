// 📁 /src/app/dashboard/profile/business/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Store, 
  FileText, 
  Calendar, 
  Users, 
  Save,
  MapPin,
  Globe,
  Phone,
  Mail,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Award,
  Edit,
  Camera,
  Image as ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Button } from '@/components/ui/atoms/button';
import { Input } from '@/components/ui/atoms/input';
import { Textarea } from '@/components/ui/atoms/textarea';
import { Label } from '@/components/ui/atoms/label';
import { Badge } from '@/components/ui/atoms/badge';
import { Alert, AlertDescription } from '@/components/ui/atoms/alert';
import { Separator } from '@/components/ui/atoms/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/atoms/tabs';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300, 
      damping: 25
    }
  }
};

export default function BusinessInfoPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    // Datos básicos
    businessName: 'Quesería El Gazpacho',
    legalName: 'Quesería El Gazpacho S.L.',
    taxId: 'B12345678',
    foundedYear: '1985',
    teamSize: '3-5',
    description: 'Quesería artesanal familiar desde 1985. Elaboramos quesos de oveja con métodos tradicionales, utilizando leche cruda de nuestro propio rebaño.',
    categories: ['quesos', 'lácteos'],
    
    // Contacto
    phone: '+34 956 789 012',
    email: 'info@elgazpacho.es',
    website: 'https://www.elgazpacho.es',
    
    // Dirección
    address: 'Camino de la Sierra, 45',
    city: 'Grazalema',
    province: 'Cádiz',
    postalCode: '11610',
    country: 'España',
    
    // Redes sociales
    socialMedia: {
      instagram: '@elgazpacho',
      facebook: 'queseriaelgazpacho',
      twitter: '',
      youtube: ''
    },
    
    // Logo y banner (mock)
    logo: null,
    banner: null
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.businessName.trim()) newErrors.businessName = 'El nombre del negocio es obligatorio';
    if (!form.taxId.trim()) newErrors.taxId = 'El CIF/NIF es obligatorio';
    if (!form.phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    if (!form.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email no válido';
    
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
      {/* Elementos decorativos */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <PageHeader
          title="Mi Negocio"
          description="Gestiona la información de tu empresa, imagen de marca y datos comerciales"
          badgeIcon={Store}
          badgeText="Información comercial"
          showBackButton={true}
          onBack={() => router.back()}
        />

        <div className="mt-8">
          {/* TARJETA DE BANNER Y LOGO */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-6">
            <Card className="overflow-hidden border border-border shadow-sm">
              {/* Banner */}
              <div className="h-48 bg-gradient-to-r from-origen-pradera to-origen-hoja relative">
                {form.banner ? (
                  <img src={form.banner} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-white/30" />
                  </div>
                )}
                {isEditing && (
                  <button className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-surface-alt shadow-lg flex items-center justify-center text-origen-bosque hover:text-origen-pradera transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              {/* Logo superpuesto */}
              <CardContent className="relative px-6 pb-6">
                <div className="flex items-end gap-6 -mt-16 mb-4">
                  <div className="relative group">
                    <div className="w-28 h-28 rounded-xl bg-surface-alt shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
                      {form.logo ? (
                        <img src={form.logo} alt={form.businessName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
                          <Store className="w-12 h-12 text-origen-pradera/50" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <h2 className="text-2xl font-bold text-origen-bosque">{form.businessName}</h2>
                    <p className="text-sm text-muted-foreground">CIF: {form.taxId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Barra de acciones */}
          <motion.div 
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="flex justify-end mb-8"
          >
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} size="lg">
                <span className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  Editar información del negocio
                </span>
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" size="lg" onClick={() => setIsEditing(false)}>
                  <span className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancelar
                  </span>
                </Button>
                <Button size="lg" onClick={handleSave} disabled={isSaving}>
                  <span className="flex items-center gap-2">
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar cambios
                      </>
                    )}
                  </span>
                </Button>
              </div>
            )}
          </motion.div>

          {/* Estado de verificación */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mb-8">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Tu negocio ha sido verificado. La información fiscal está confirmada.
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Tabs de navegación */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="basic">Información básica</TabsTrigger>
                <TabsTrigger value="contact">Contacto y ubicación</TabsTrigger>
                <TabsTrigger value="social">Redes sociales</TabsTrigger>
                <TabsTrigger value="description">Descripción</TabsTrigger>
              </TabsList>

              {/* TAB 1: INFORMACIÓN BÁSICA */}
              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Store className="w-5 h-5 text-origen-pradera" />
                      Datos principales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="businessName" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Nombre comercial
                        </Label>
                        <Input
                          id="businessName"
                          value={form.businessName}
                          onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                        {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="legalName">Razón social (si es diferente)</Label>
                        <Input
                          id="legalName"
                          value={form.legalName}
                          onChange={(e) => setForm({ ...form, legalName: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          CIF / NIF
                        </Label>
                        <Input
                          id="taxId"
                          value={form.taxId}
                          onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                        {errors.taxId && <p className="text-xs text-red-500">{errors.taxId}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="foundedYear">Año de fundación</Label>
                        <Input
                          id="foundedYear"
                          value={form.foundedYear}
                          onChange={(e) => setForm({ ...form, foundedYear: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                          placeholder="Ej: 1985"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="teamSize">Tamaño del equipo</Label>
                        <Input
                          id="teamSize"
                          value={form.teamSize}
                          onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5 text-origen-pradera" />
                      Categorías
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {form.categories.map((cat, i) => (
                        <Badge key={i} variant="leaf" size="md" className="px-3 py-1.5">
                          {cat}
                          {isEditing && (
                            <button className="ml-2 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </Badge>
                      ))}
                      {isEditing && (
                        <Button variant="outline" size="sm">
                          <Plus className="w-4 h-4 mr-2" />
                          Añadir categoría
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: CONTACTO Y UBICACIÓN */}
              <TabsContent value="contact" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Phone className="w-5 h-5 text-origen-pradera" />
                      Contacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="businessPhone" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Teléfono
                        </Label>
                        <Input
                          id="businessPhone"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessEmail" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                          Email
                        </Label>
                        <Input
                          id="businessEmail"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="website">Sitio web</Label>
                        <Input
                          id="website"
                          value={form.website}
                          onChange={(e) => setForm({ ...form, website: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="w-5 h-5 text-origen-pradera" />
                      Dirección
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="businessAddress">Dirección</Label>
                        <Input
                          id="businessAddress"
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessCity">Ciudad</Label>
                        <Input
                          id="businessCity"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessPostalCode">Código postal</Label>
                        <Input
                          id="businessPostalCode"
                          value={form.postalCode}
                          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessProvince">Provincia</Label>
                        <Input
                          id="businessProvince"
                          value={form.province}
                          onChange={(e) => setForm({ ...form, province: e.target.value })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="businessCountry">País</Label>
                        <Input
                          id="businessCountry"
                          value={form.country}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: REDES SOCIALES */}
              <TabsContent value="social">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="w-5 h-5 text-origen-pradera" />
                      Redes sociales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="instagram">Instagram</Label>
                        <Input
                          id="instagram"
                          value={form.socialMedia.instagram}
                          onChange={(e) => setForm({ 
                            ...form, 
                            socialMedia: { ...form.socialMedia, instagram: e.target.value }
                          })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                          placeholder="@usuario"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="facebook">Facebook</Label>
                        <Input
                          id="facebook"
                          value={form.socialMedia.facebook}
                          onChange={(e) => setForm({ 
                            ...form, 
                            socialMedia: { ...form.socialMedia, facebook: e.target.value }
                          })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                          placeholder="página o perfil"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter / X</Label>
                        <Input
                          id="twitter"
                          value={form.socialMedia.twitter}
                          onChange={(e) => setForm({ 
                            ...form, 
                            socialMedia: { ...form.socialMedia, twitter: e.target.value }
                          })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                          placeholder="@usuario"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="youtube">YouTube</Label>
                        <Input
                          id="youtube"
                          value={form.socialMedia.youtube}
                          onChange={(e) => setForm({ 
                            ...form, 
                            socialMedia: { ...form.socialMedia, youtube: e.target.value }
                          })}
                          disabled={!isEditing}
                          className={!isEditing ? 'bg-surface' : ''}
                          placeholder="url del canal"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: DESCRIPCIÓN */}
              <TabsContent value="description">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-origen-pradera" />
                      Descripción del negocio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">Descripción</Label>
                      <Textarea
                        id="businessDescription"
                        value={form.description}
                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                        disabled={!isEditing}
                        rows={6}
                        className={!isEditing ? 'bg-surface' : ''}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {form.description.length}/500
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}