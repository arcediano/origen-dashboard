/**
 * @page BusinessPage
 * @description Información del negocio (solo para productores)
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Store, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  Calendar,
  Award,
  FileText,
  Users,
  Clock,
  Save,
  Edit,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@origen/ux-library';
import { Button, Input, Label, Badge } from '@origen/ux-library';
import { Textarea } from '@/components/ui/atoms/textarea';
import { TagsInput } from '@/components/ui/atoms/tags-input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/atoms/tabs';
import { cn } from '@/lib/utils';

export default function BusinessPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  
  // Datos de ejemplo - Información general
  const [generalData, setGeneralData] = useState({
    businessName: 'Quesería El Gazpacho',
    legalName: 'Quesería El Gazpacho S.L.',
    taxId: 'B12345678',
    yearFounded: '1985',
    employees: '5',
    description: 'Quesería artesanal familiar desde 1985. Elaboramos quesos de oveja con métodos tradicionales, respetando el medio ambiente y el bienestar animal. Nuestros productos son 100% naturales, sin conservantes ni aditivos.',
    shortDescription: 'Quesos artesanales de oveja elaborados en la Sierra de Grazalema'
  });

  // Datos de contacto
  const [contactData, setContactData] = useState({
    phone: '956 789 012',
    email: 'info@elgazpacho.es',
    website: 'www.elgazpacho.es',
    facebook: 'queseriaelgazpacho',
    instagram: '@elgazpacho_quesos',
    twitter: '@elgazpacho'
  });

  // Datos de ubicación
  const [locationData, setLocationData] = useState({
    address: 'Camino de la Sierra, 45',
    addressLine2: 'Finca El Gazpacho',
    city: 'Grazalema',
    province: 'Cádiz',
    postalCode: '11610',
    country: 'España',
    coordinates: '36.7594° N, 5.3694° W'
  });

  // Horario
  const [scheduleData, setScheduleData] = useState({
    monday: '9:00 - 14:00, 16:00 - 19:00',
    tuesday: '9:00 - 14:00, 16:00 - 19:00',
    wednesday: '9:00 - 14:00, 16:00 - 19:00',
    thursday: '9:00 - 14:00, 16:00 - 19:00',
    friday: '9:00 - 14:00, 16:00 - 19:00',
    saturday: '10:00 - 14:00',
    sunday: 'Cerrado'
  });

  // Certificaciones
  const [certifications, setCertifications] = useState([
    'ecológico', 'denominación origen', 'bienestar animal'
  ]);

  // Métodos de pago
  const [paymentMethods, setPaymentMethods] = useState([
    'Efectivo', 'Tarjeta', 'Transferencia', 'Bizum'
  ]);

  const handleSave = () => {
    setIsEditing(false);
    // Aquí iría la lógica para guardar los datos
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-6 py-8 space-y-8"
    >
      {/* Cabecera */}
      <PageHeader
        title="Mi negocio"
        description="Gestiona la información de tu tienda o negocio"
        badgeIcon={Store}
        badgeText="Información comercial"
        tooltip="Datos del negocio"
        tooltipDetailed="Esta información será visible para tus clientes en tu perfil público. Mantén tus datos actualizados para generar confianza."
        actions={
          !isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="gap-2">
              <Edit className="w-4 h-4" />
              Editar información
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Guardar cambios
              </Button>
            </div>
          )
        }
      />

      {/* Estado de verificación */}
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">Negocio verificado</p>
          <p className="text-xs text-green-600">Tu información ha sido verificada y es visible para los clientes.</p>
        </div>
        <Badge variant="success" size="sm">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verificado
        </Badge>
      </div>

      {/* Pestañas de información */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 p-1 bg-origen-crema/50 rounded-xl mb-6">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-surface-alt gap-2">
            <Store className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="rounded-lg data-[state=active]:bg-surface-alt gap-2">
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Contacto</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="rounded-lg data-[state=active]:bg-surface-alt gap-2">
            <MapPin className="w-4 h-4" />
            <span className="hidden sm:inline">Ubicación</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="rounded-lg data-[state=active]:bg-surface-alt gap-2">
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Horario</span>
          </TabsTrigger>
          <TabsTrigger value="extras" className="rounded-lg data-[state=active]:bg-surface-alt gap-2">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Extras</span>
          </TabsTrigger>
        </TabsList>

        {/* Pestaña: Información general */}
        <TabsContent value="general">
          <Card variant="elevated">
            <CardHeader spacing="md">
              <CardTitle size="md" className="flex items-center gap-2">
                <Store className="w-5 h-5 text-origen-pradera" />
                Información general
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label required tooltip="Nombre comercial que verán tus clientes">Nombre del negocio</Label>
                  <Input 
                    value={generalData.businessName}
                    onChange={(e) => setGeneralData({...generalData, businessName: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label optional tooltip="Razón social (para facturación)">Nombre legal</Label>
                  <Input 
                    value={generalData.legalName}
                    onChange={(e) => setGeneralData({...generalData, legalName: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label required tooltip="CIF / NIF para facturación">CIF / NIF</Label>
                  <Input 
                    value={generalData.taxId}
                    onChange={(e) => setGeneralData({...generalData, taxId: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label optional>Año de fundación</Label>
                  <Input 
                    value={generalData.yearFounded}
                    onChange={(e) => setGeneralData({...generalData, yearFounded: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label optional>Número de empleados</Label>
                  <Input 
                    value={generalData.employees}
                    onChange={(e) => setGeneralData({...generalData, employees: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label optional>Descripción corta</Label>
                  <Input 
                    value={generalData.shortDescription}
                    onChange={(e) => setGeneralData({...generalData, shortDescription: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="Breve descripción para vista previa"
                  />
                  <p className="text-[10px] text-text-subtle mt-1">Máximo 160 caracteres</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label optional>Descripción completa</Label>
                  <Textarea 
                    value={generalData.description}
                    onChange={(e) => setGeneralData({...generalData, description: e.target.value})}
                    disabled={!isEditing}
                    rows={5}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="Describe tu negocio, tu historia, tus productos..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Contacto */}
        <TabsContent value="contact">
          <Card variant="elevated">
            <CardHeader spacing="md">
              <CardTitle size="md" className="flex items-center gap-2">
                <Phone className="w-5 h-5 text-origen-pradera" />
                Información de contacto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label required>Teléfono</Label>
                  <Input 
                    value={contactData.phone}
                    onChange={(e) => setContactData({...contactData, phone: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="Ej: 956 789 012"
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Email</Label>
                  <Input 
                    type="email"
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="info@tunegocio.es"
                  />
                </div>
                <div className="space-y-2">
                  <Label optional>Sitio web</Label>
                  <Input 
                    value={contactData.website}
                    onChange={(e) => setContactData({...contactData, website: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="www.tunegocio.es"
                  />
                </div>
                <div className="space-y-2">
                  <Label optional>Facebook</Label>
                  <Input 
                    value={contactData.facebook}
                    onChange={(e) => setContactData({...contactData, facebook: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="usuario o página"
                  />
                </div>
                <div className="space-y-2">
                  <Label optional>Instagram</Label>
                  <Input 
                    value={contactData.instagram}
                    onChange={(e) => setContactData({...contactData, instagram: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="@usuario"
                  />
                </div>
                <div className="space-y-2">
                  <Label optional>Twitter / X</Label>
                  <Input 
                    value={contactData.twitter}
                    onChange={(e) => setContactData({...contactData, twitter: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="@usuario"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Ubicación */}
        <TabsContent value="location">
          <Card variant="elevated">
            <CardHeader spacing="md">
              <CardTitle size="md" className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-origen-pradera" />
                Dirección y ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label required>Dirección</Label>
                  <Input 
                    value={locationData.address}
                    onChange={(e) => setLocationData({...locationData, address: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label optional>Dirección línea 2</Label>
                  <Input 
                    value={locationData.addressLine2}
                    onChange={(e) => setLocationData({...locationData, addressLine2: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="Apartamento, local, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Ciudad</Label>
                  <Input 
                    value={locationData.city}
                    onChange={(e) => setLocationData({...locationData, city: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Provincia</Label>
                  <Input 
                    value={locationData.province}
                    onChange={(e) => setLocationData({...locationData, province: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label required>Código postal</Label>
                  <Input 
                    value={locationData.postalCode}
                    onChange={(e) => setLocationData({...locationData, postalCode: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label required>País</Label>
                  <Input 
                    value={locationData.country}
                    onChange={(e) => setLocationData({...locationData, country: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label optional>Coordenadas</Label>
                  <Input 
                    value={locationData.coordinates}
                    onChange={(e) => setLocationData({...locationData, coordinates: e.target.value})}
                    disabled={!isEditing}
                    className={!isEditing ? 'bg-surface' : ''}
                    placeholder="Ej: 36.7594° N, 5.3694° W"
                  />
                  <p className="text-[10px] text-text-subtle mt-1">Para mostrar tu ubicación exacta en el mapa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Horario */}
        <TabsContent value="schedule">
          <Card variant="elevated">
            <CardHeader spacing="md">
              <CardTitle size="md" className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-origen-pradera" />
                Horario de atención
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(scheduleData).map(([day, hours]) => (
                  <div key={day} className="flex items-start gap-4">
                    <div className="w-24 sm:w-28 pt-2">
                      <Label className="capitalize">
                        {day === 'monday' && 'Lunes'}
                        {day === 'tuesday' && 'Martes'}
                        {day === 'wednesday' && 'Miércoles'}
                        {day === 'thursday' && 'Jueves'}
                        {day === 'friday' && 'Viernes'}
                        {day === 'saturday' && 'Sábado'}
                        {day === 'sunday' && 'Domingo'}
                      </Label>
                    </div>
                    <div className="flex-1">
                      <Input 
                        value={hours}
                        onChange={(e) => setScheduleData({...scheduleData, [day]: e.target.value})}
                        disabled={!isEditing}
                        className={!isEditing ? 'bg-surface' : ''}
                        placeholder="Ej: 9:00 - 14:00, 16:00 - 19:00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña: Extras */}
        <TabsContent value="extras">
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader spacing="md">
                <CardTitle size="md" className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-origen-pradera" />
                  Certificaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <TagsInput
                    value={certifications}
                    onChange={setCertifications}
                    placeholder="Añadir certificación..."
                    maxTags={10}
                    suggestions={['ecológico', 'denominación origen', 'bienestar animal', 'comercio justo', 'artesanal', 'km 0']}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {certifications.map((cert, index) => (
                      <Badge key={index} variant="leaf" size="sm">
                        <Award className="w-3 h-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader spacing="md">
                <CardTitle size="md" className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-origen-pradera" />
                  Métodos de pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <TagsInput
                    value={paymentMethods}
                    onChange={setPaymentMethods}
                    placeholder="Añadir método de pago..."
                    maxTags={10}
                    suggestions={['Efectivo', 'Tarjeta', 'Transferencia', 'Bizum', 'PayPal', 'Contra reembolso']}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((method, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {method}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader spacing="md">
                <CardTitle size="md" className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-origen-pradera" />
                  Información adicional
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-origen-crema/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Política de cancelación</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cancelaciones gratuitas hasta 24 horas antes. Pasado ese plazo, se aplicará una penalización del 50%.
                      </p>
                      {isEditing && (
                        <Button variant="link" className="mt-2">
                          Editar política
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-origen-crema/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-origen-pradera mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Información de envío</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Envíos a toda España peninsular en 24-48h. Envío gratuito para pedidos superiores a 50€.
                      </p>
                      {isEditing && (
                        <Button variant="link" className="mt-2">
                          Editar información
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Vista previa pública */}
      <Card variant="elevated" className="border-2 border-dashed border-origen-pradera/30 bg-origen-crema/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-origen-pradera/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-origen-pradera" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-origen-bosque">Vista previa pública</h3>
                <p className="text-xs text-muted-foreground">Así verán los clientes tu perfil de negocio</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Ver perfil público
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}