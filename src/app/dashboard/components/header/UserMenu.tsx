// ðŸ“ /src/app/dashboard/components/header/UserMenu.tsx
'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logoutUser } from '@/lib/api/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@origen/ux-library';
import { Badge } from '@origen/ux-library';
import { 
  User, 
  Settings,
  LogOut,
  ChevronRight,
  HelpCircle,
  Bell,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  userAvatar?: string;
  userType?: 'producer' | 'customer';
  onLogout?: () => void;
  notificationCount?: number;
}

export function UserMenu({ 
  userName, 
  userEmail, 
  userInitials, 
  userAvatar,
  userType = 'producer',
  notificationCount = 3,
  onLogout 
}: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logoutUser();
    } catch {
      // Continuar con el logout aunque el servidor falle
    }
    if (onLogout) onLogout();
    router.replace('/auth/login');
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative focus:outline-none group"
      >
        <Avatar className={cn(
          'w-10 h-10 ring-2 transition-all cursor-pointer',
          isOpen 
            ? 'ring-origen-menta ring-offset-2 scale-105' 
            : 'ring-white group-hover:ring-origen-pradera shadow-md'
        )}>
          {userAvatar ? (
            <AvatarImage src={userAvatar} alt={userName} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          )}
        </Avatar>
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-origen-menta text-white text-xs rounded-full flex items-center justify-center animate-pulse">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-72 bg-surface-alt rounded-2xl shadow-xl border border-border-subtle overflow-hidden z-50"
          >
            {/* Cabecera con datos del usuario */}
            <div className="px-5 py-5 bg-gradient-to-r from-origen-crema/40 to-transparent border-b border-border-subtle">
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14 ring-2 ring-surface-alt shadow-lg">
                  <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-lg font-semibold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-semibold text-origen-bosque truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{userEmail}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="leaf" size="xs" className="px-2 py-0.5">
                      {userType === 'producer' ? 'Productor' : 'Comprador'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* OpciÃ³n: Mi Perfil */}
            <div className="py-2">
              <Link href="/dashboard/profile" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-origen-crema/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-origen-pradera/10">
                    <User className="w-5 h-5 text-text-subtle group-hover:text-origen-pradera" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-origen-bosque">Mi Perfil</p>
                    <p className="text-xs text-muted-foreground">Datos personales y negocio</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-border group-hover:text-origen-pradera" />
                </div>
              </Link>
            </div>

            {/* SecciÃ³n: ConfiguraciÃ³n (con 2 subopciones) */}
            <div className="pt-1 pb-2 border-t border-border-subtle">
              <div className="px-4 py-2">
                <p className="text-xs font-medium text-text-disabled uppercase tracking-wider">ConfiguraciÃ³n</p>
              </div>
              
              <Link href="/dashboard/profile/settings?tab=security" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-origen-crema/50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-origen-pradera/10">
                    <Shield className="w-4 h-4 text-text-subtle group-hover:text-origen-pradera" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-origen-bosque">Seguridad</p>
                    <p className="text-xs text-muted-foreground">ContraseÃ±a y 2FA</p>
                  </div>
                </div>
              </Link>
              
              <Link href="/dashboard/profile/settings?tab=notifications" onClick={() => setIsOpen(false)}>
                <div className="flex items-center gap-3 px-4 py-2 hover:bg-origen-crema/50 transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center group-hover:bg-origen-pradera/10">
                    <Bell className="w-4 h-4 text-text-subtle group-hover:text-origen-pradera" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-origen-bosque">Notificaciones</p>
                    <p className="text-xs text-muted-foreground">Preferencias de avisos</p>
                  </div>
                </div>
              </Link>
            </div>

            {/* SecciÃ³n de ayuda */}
            <div className="px-5 py-3 bg-surface border-y border-border-subtle">
              <Link href="/ayuda" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-origen-pradera">
                <HelpCircle className="w-4 h-4" />
                <span>Centro de ayuda</span>
              </Link>
            </div>

            {/* Cerrar sesiÃ³n */}
            <div className="py-2">
              <button 
                onClick={handleLogout}
                className="w-full px-4 py-3 hover:bg-red-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-red-600">Cerrar sesiÃ³n</p>
                    <p className="text-xs text-muted-foreground">Salir de tu cuenta</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
