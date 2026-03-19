// 📁 /src/app/dashboard/profile/page.tsx
'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  User, 
  Store, 
  FileBadge,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/atoms/card';
import { Badge } from '@/components/ui/atoms/badge';
import { Button } from '@/components/ui/atoms/button';
import { Progress } from '@/components/ui/atoms/progress';

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

export default function ProfilePage() {
  // Pendientes (simulado)
  const pendingItems = 2;
  const completion = 85;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema">
      {/* Elementos decorativos */}
      <div className="fixed top-0 right-0 w-64 h-64 bg-origen-pradera/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-48 h-48 bg-origen-hoja/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
        <PageHeader
          title="Mi Perfil"
          description="Gestiona tu información personal, los datos de tu negocio y tus certificaciones"
        />

        {/* Barra de progreso */}
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="mt-6 mb-8"
        >
          <Card className="border-origen-pradera/20 bg-gradient-to-r from-origen-crema/30 to-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-origen-pradera" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-origen-bosque">Completitud del perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      Te faltan {pendingItems} elementos por completar
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <Progress value={completion} className="h-2" />
                  </div>
                  <span className="text-sm font-medium text-origen-bosque">{completion}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3 CARDS SIN DATOS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          
          {/* CARD 1: Información personal */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex">
            <Card className="hover:shadow-lg transition-all group flex flex-col w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-origen-pradera" />
                    Información personal
                  </CardTitle>
                  <Badge variant="success" size="xs">Verificado</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gestiona tus datos personales, información de contacto y dirección.
                </p>
                
                {/* Espaciador flexible que empuja el botón hacia abajo */}
                <div className="flex-1" />
                
                <div className="flex justify-end mt-4">
                  <Link href="/dashboard/profile/personal">
                    <Button variant="outline" size="sm">
                      <span className="flex items-center gap-1">
                        Ver detalles
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 2: Mi negocio */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex">
            <Card className="hover:shadow-lg transition-all group flex flex-col w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Store className="w-5 h-5 text-origen-pradera" />
                    Mi negocio
                  </CardTitle>
                  <Badge variant="success" size="xs">Verificado</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Administra la información de tu empresa, ubicación, categorías y datos comerciales.
                </p>
                
                <div className="flex-1" />
                
                <div className="flex justify-end mt-4">
                  <Link href="/dashboard/profile/business">
                    <Button variant="outline" size="sm">
                      <span className="flex items-center gap-1">
                        Ver detalles
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* CARD 3: Certificaciones y documentos */}
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex">
            <Card className="hover:shadow-lg transition-all group flex flex-col w-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileBadge className="w-5 h-5 text-origen-pradera" />
                    Certificaciones
                  </CardTitle>
                  <Badge variant="warning" size="xs">2 pendientes</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Gestiona tus certificaciones de calidad, sellos ecológicos y documentos legales.
                </p>
                
                <div className="flex-1" />
                
                <div className="flex justify-end mt-4">
                  <Link href="/dashboard/profile/certifications">
                    <Button variant="outline" size="sm">
                      <span className="flex items-center gap-1">
                        Ver detalles
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}