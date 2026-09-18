/**
 * Página de Restablecimiento de Contraseña - Origen Marketplace
 * @module app/auth/reset-password/page
 * @description Consume el token del enlace enviado por `SimpleForgotPassword`
 * y permite establecer una nueva contraseña sin salir de origen-dashboard.
 */

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/features/auth/components/reset-password-form';
import { AuthFooter } from '@arcediano/ux-library';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-origen-crema/30">
      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16 xl:py-20">
        {/* Logo mínimo — solo móvil */}
        <div className="flex justify-center pb-6 lg:hidden">
          <Link
            href="/"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-origen-pradera rounded-lg p-1"
          >
            <img src="/origen-icon.svg" alt="" width={36} height={36} className="h-9 w-9" />
            <div className="flex flex-col leading-none">
              <span className="text-base font-bold text-origen-bosque tracking-tight">Origen.</span>
              <span className="text-[10px] text-hoja-tinta -mt-0.5">Productores locales</span>
            </div>
          </Link>
        </div>

        <div className="max-w-md mx-auto">
          {/* Badge — solo escritorio */}
          <div className="hidden lg:flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
              <ShieldCheck className="w-4 h-4 text-hoja-tinta" />
              <span className="text-xs md:text-sm font-semibold text-origen-bosque">
                Restablecimiento seguro
              </span>
            </div>
          </div>

          <Suspense>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>

      <AuthFooter variant="forgot" linkComponent={Link} />
    </div>
  );
}
