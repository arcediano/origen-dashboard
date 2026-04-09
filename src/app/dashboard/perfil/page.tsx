/**
 * @page PerfilPage
 * @description Página de perfil de usuario — tab raíz mobile.
 * Contiene cabecera con avatar/nombre/email, accesos a Cuenta, Configuraciones,
 * Ayuda y botón de cerrar sesión.
 */

'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/api/auth';
import { Avatar, AvatarFallback, Badge } from '@arcediano/ux-library';
import { ChevronRight, HelpCircle, LogOut, Settings2, User } from 'lucide-react';

export default function PerfilPage() {
  const router = useRouter();
  const { user } = useAuth();

  const userName = useMemo(() => {
    const full = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    return full || 'Tu cuenta';
  }, [user?.firstName, user?.lastName]);

  const userInitials = useMemo(() => {
    return `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'OR';
  }, [user?.firstName, user?.lastName]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // Continuar con logout aunque el servidor falle
    }
    router.replace('/auth/login');
  };

  const menuItems = [
    {
      id: 'cuenta',
      label: 'Mi cuenta',
      description: 'Seguridad, cobros y perfil comercial',
      href: '/dashboard/account',
      icon: User,
    },
    {
      id: 'configuraciones',
      label: 'Configuraciones',
      description: 'Preferencias de notificaciones y ajustes',
      href: '/dashboard/notifications?view=preferences',
      icon: Settings2,
    },
    {
      id: 'ayuda',
      label: 'Centro de ayuda',
      description: 'Resuelve tus dudas y contacta soporte',
      href: '/ayuda',
      icon: HelpCircle,
    },
  ] as const;

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-origen-crema pb-[calc(88px+env(safe-area-inset-bottom))]">

      {/* ── Page title ── */}
      <div className="px-4 pt-6 pb-2 sm:px-6">
        <h1 className="text-xl font-semibold text-origen-bosque">Perfil</h1>
      </div>

      <div className="container mx-auto px-4 py-3 sm:px-6 space-y-4 max-w-lg">

        {/* ── User header card ── */}
        <div className="rounded-2xl border border-origen-pradera/20 bg-gradient-to-r from-origen-crema/60 to-surface-alt p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 ring-2 ring-white shadow-lg flex-shrink-0">
              <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-xl font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-semibold text-origen-bosque truncate">{userName}</p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{user?.email ?? ''}</p>
              <div className="mt-2">
                <Badge variant="leaf" size="xs" className="px-2 py-0.5">
                  Productor
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation options ── */}
        <div className="rounded-2xl border border-border-subtle bg-surface-alt overflow-hidden shadow-sm">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-4 hover:bg-origen-crema/50 active:bg-origen-crema/70 transition-colors group',
                  index > 0 && 'border-t border-border-subtle',
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-origen-pradera/10 transition-colors flex-shrink-0">
                  <Icon className="w-5 h-5 text-text-subtle group-hover:text-origen-pradera transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-origen-bosque">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-border group-hover:text-origen-pradera transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* ── Logout ── */}
        <div className="rounded-2xl border border-border-subtle bg-surface-alt overflow-hidden shadow-sm">
          <button
            onClick={() => { void handleLogout(); }}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-red-50 active:bg-red-100 transition-colors group"
            type="button"
          >
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors flex-shrink-0">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600">Cerrar sesión</p>
              <p className="text-xs text-muted-foreground mt-0.5">Salir de tu cuenta de forma segura</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
}
