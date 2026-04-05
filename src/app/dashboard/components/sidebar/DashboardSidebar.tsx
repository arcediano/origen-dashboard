/**
 * @component DashboardSidebar
 * @description Menú lateral principal del dashboard
 * 
 * FUNCIONALIDADES:
 * - Navegación principal con submenús anidados
 * - Badges de notificaciones
 * - Indicador de sección activa animado
 * - Versión responsive con overlay en móvil
 * - Cierre automático al navegar en móvil
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@arcediano/ux-library';
import { 
  Leaf, 
  X, 
  HelpCircle, 
  LogOut 
} from 'lucide-react';
import { SidebarMenuItem } from './SidebarMenuItem';
import { MENU_ITEMS } from '@/constants/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/lib/api/auth';

interface DashboardSidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function DashboardSidebar({ isMobileOpen = false, onMobileClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleItemClick = () => {
    if (onMobileClose) onMobileClose();
  };

  // BUG FIX: Los botones de cerrar sesión no tenían onClick.
  // Ahora llaman al endpoint de logout del gateway, limpian el contexto
  // y redirigen al login.
  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Si el gateway falla, continuamos con el logout local igualmente
    } finally {
      clearUser();
      router.replace('/auth/login');
    }
  };

  if (!mounted) return null;

  // Versión móvil (overlay)
  if (isMobileOpen) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
        
        <motion.aside
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          transition={{ type: 'spring', damping: 30, stiffness: 200 }}
          className="fixed top-0 left-0 z-50 h-full w-80 bg-surface-alt shadow-2xl lg:hidden flex flex-col"
        >
          {/* Cabecera móvil */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <Link href="/dashboard" className="flex items-center gap-3" onClick={handleItemClick}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md"
                   style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #74C69D 100%)' }}>
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-semibold" style={{ color: '#1B4332' }}>origen.</span>
            </Link>
            <Button variant="ghost" size="icon-sm" onClick={onMobileClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navegación móvil */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            {MENU_ITEMS.map((item) => (
              <SidebarMenuItem
                key={item.id}
                {...item}
                onItemClick={handleItemClick}
              />
            ))}
          </nav>

          {/* Footer móvil */}
          <div className="p-3 border-t border-border-subtle">
            <Link href="/ayuda" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-surface transition-all">
              <HelpCircle className="w-5 h-5 text-text-subtle" />
              <span>Ayuda</span>
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all mt-1 disabled:opacity-50"
            >
              <LogOut className="w-5 h-5" />
              <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>
            </button>
          </div>
        </motion.aside>
      </>
    );
  }

  // Versión desktop
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-surface-alt/90 backdrop-blur-xl border-r border-border-subtle z-40 hidden lg:flex flex-col shadow-xl">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-7">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
             style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #74C69D 100%)' }}>
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-semibold" style={{ color: '#1B4332' }}>origen.</span>
        <span className="ml-auto text-[10px] font-medium px-2 py-1 bg-surface rounded-full text-muted-foreground">
          v2.0
        </span>
      </div>

      {/* Navegación desktop */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {MENU_ITEMS.map((item) => (
          <SidebarMenuItem
            key={item.id}
            {...item}
          />
        ))}
      </nav>

      {/* Footer desktop */}
      <div className="p-3 border-t border-border-subtle">
        <Link href="/ayuda" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-surface transition-all">
          <HelpCircle className="w-5 h-5 text-text-subtle" />
          <span>Ayuda</span>
        </Link>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-all mt-1 disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          <span>{isLoggingOut ? 'Cerrando...' : 'Salir'}</span>
        </button>
      </div>
    </aside>
  );
}