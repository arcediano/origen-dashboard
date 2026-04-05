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
import { Badge, Button } from '@origen/ux-library';
import { Progress } from '@/components/ui/atoms/progress';

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

export default function ProfilePage() {
  // Pendientes (simulado)
  const pendingItems = 2;
  const completion = 85;

  return (
    <div>
      {/* Cabecera de página */}
      <PageHeader
        title="Mi perfil"
        description="Información personal, negocio y certificaciones"
        badgeIcon={User}
        badgeText="Perfil"
        tooltip="Perfil"
        tooltipDetailed="Administra tu información personal, los datos de tu negocio y tus certificaciones."
      />

      {/* ── Barra de completitud ── */}
      <div className="px-4 sm:px-6 lg:px-8 mt-4 mb-5 sm:mt-6 sm:mb-8">

        {/* Móvil: fila compacta */}
        <div className="lg:hidden flex items-center gap-3 p-4 rounded-2xl bg-surface-alt border border-border-subtle">
          <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-origen-pradera" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-medium text-origen-bosque">Completitud del perfil</p>
              <span className="text-sm font-bold text-origen-pradera">{completion}%</span>
            </div>
            <Progress value={completion} className="h-1.5" />
            <p className="text-xs text-text-subtle mt-1">{pendingItems} elementos por completar</p>
          </div>
        </div>

        {/* Desktop: card completa */}
        <Card className="hidden lg:block border-origen-pradera/20 bg-gradient-to-r from-origen-crema/30 to-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-origen-pradera" />
                </div>
                <div>
                  <h3 className="font-semibold text-origen-bosque">Completitud del perfil</h3>
                  <p className="text-sm text-muted-foreground">Te faltan {pendingItems} elementos por completar</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32"><Progress value={completion} className="h-2" /></div>
                <span className="text-sm font-medium text-origen-bosque">{completion}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Móvil: lista de navegación nativa ── */}
      <div className="lg:hidden mx-4 rounded-2xl border border-border-subtle overflow-hidden bg-surface divide-y divide-border-subtle">

        <Link href="/dashboard/profile/personal" className="flex items-center gap-3 px-4 py-4 active:bg-surface-alt transition-colors">
          <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-origen-pradera" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-origen-bosque leading-tight">Información personal</p>
            <p className="text-xs text-text-subtle mt-0.5">Datos personales, contacto y dirección</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="success" size="xs">Verificado</Badge>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </div>
        </Link>

        <Link href="/dashboard/profile/business" className="flex items-center gap-3 px-4 py-4 active:bg-surface-alt transition-colors">
          <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-origen-pradera" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-origen-bosque leading-tight">Mi negocio</p>
            <p className="text-xs text-text-subtle mt-0.5">Empresa, ubicación y datos comerciales</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="success" size="xs">Verificado</Badge>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </div>
        </Link>

        <Link href="/dashboard/profile/certifications" className="flex items-center gap-3 px-4 py-4 active:bg-surface-alt transition-colors">
          <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center flex-shrink-0">
            <FileBadge className="w-5 h-5 text-origen-pradera" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-semibold text-origen-bosque leading-tight">Certificaciones</p>
            <p className="text-xs text-text-subtle mt-0.5">Certificaciones de calidad y documentos legales</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="warning" size="xs">2 pendientes</Badge>
            <ChevronRight className="w-4 h-4 text-text-subtle" />
          </div>
        </Link>

      </div>

      {/* ── Desktop: grid de cards ── */}
      <div className="hidden lg:grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 px-8">

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
  );
}