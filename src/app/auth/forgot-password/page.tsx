// app/recuperar/page.tsx
/**
 * Página de Recuperación de Contraseña - Origen Marketplace
 * @module app/recuperar/page
 * @description Página para solicitar el restablecimiento de contraseña
 */

import { SimpleForgotPassword } from '@/components/features/auth/components/forgot-password-form';
import { AuthFooter } from '@arcediano/ux-library';
import Link from 'next/link';
import {
  Shield,
  Leaf,
  Sparkles,
  CheckCircle,
  Lock,
  ChevronRight,
  Mail,
  Phone,
  Clock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export default function RecuperarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema/30">
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16 xl:py-20">
        {/* Logo mínimo — solo móvil */}
        <div className="flex justify-center pb-6 lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-origen-pradera rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-origen-bosque to-origen-pino flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-origen-bosque tracking-tight">ORIGEN</span>
              <span className="text-[10px] text-origen-hoja -mt-0.5">Productores locales</span>
            </div>
          </Link>
        </div>
        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* COLUMNA IZQUIERDA — oculta en móvil */}
            <div className="hidden lg:block lg:col-span-6 space-y-8 lg:pr-8 xl:pr-12">

              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
                <ShieldCheck className="w-4 h-4 text-origen-pradera" />
                <span className="text-xs md:text-sm font-semibold text-origen-bosque">
                  Recuperación segura de cuenta
                </span>
              </div>

              {/* Título */}
              <div className="text-left max-w-xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-origen-bosque mb-4 md:mb-6">
                  Recupera el acceso
                  <span className="block text-origen-hoja">a tu panel</span>
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  Sin acceso a tu cuenta no puedes gestionar tu tienda.
                  Restablece tu contraseña en menos de 2 minutos.
                </p>
              </div>

              {/* Pasos */}
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-origen-pradera" />
                  Cómo funciona
                </h3>

                <div className="space-y-3">
                  {[
                    {
                      step: '1',
                      title: 'Introduce tu email',
                      desc: 'El email con el que te registraste en Origen',
                    },
                    {
                      step: '2',
                      title: 'Revisa tu correo',
                      desc: 'Recibirás un enlace seguro en menos de 2 minutos',
                    },
                    {
                      step: '3',
                      title: 'Crea tu nueva contraseña',
                      desc: 'El enlace es válido durante 30 minutos',
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 bg-surface-alt rounded-xl p-4 border border-border hover:border-origen-pradera transition-all hover:shadow-sm">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-origen-pradera/60 to-origen-hoja/60 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white text-sm font-bold">{item.step}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-origen-bosque">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seguridad */}
              <div className="space-y-4 pt-2">
                <h3 className="text-sm font-bold text-origen-bosque uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-4 h-4 text-origen-pradera" />
                  Tu seguridad es lo primero
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Enlace de un solo uso',
                    'Expira en 30 minutos',
                    'Cifrado SSL 256-bit',
                    'Sin datos expuestos',
                  ].map((benefit) => (
                    <div key={benefit} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-origen-pradera" />
                      </div>
                      <span className="text-sm text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA — formulario */}
            <div className="lg:col-span-6">
              <div className="lg:pl-8 xl:pl-12">
                <SimpleForgotPassword />

                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-3 bg-surface-alt rounded-full px-5 py-2.5 border border-border shadow-sm hover:border-origen-pradera transition-all">
                    <span className="text-sm text-muted-foreground">💬 ¿Necesitas ayuda?</span>
                    <Link
                      href="/contacto"
                      className="text-sm font-medium text-origen-pradera hover:text-origen-bosque transition-colors flex items-center gap-1"
                    >
                      Contactar soporte
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <AuthFooter variant="forgot" linkComponent={Link} />
    </div>
  );
}
