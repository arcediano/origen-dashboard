// /src/app/dashboard/components/header/UserMenu.tsx
'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { logoutUser } from '@/lib/api/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@arcediano/ux-library';
import { Badge } from '@arcediano/ux-library';
import { User, LogOut, ChevronRight, HelpCircle, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  userInitials: string;
  userAvatar?: string;
  userType?: 'producer' | 'customer';
  onLogout?: () => void;
}

export function UserMenu({
  userName,
  userEmail,
  userInitials,
  userAvatar,
  userType = 'producer',
  onLogout,
}: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  const closeMenu = () => {
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  const toggleMenu = () => {
    setIsOpen((prev) => !prev);
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMenu();
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return;
      closeMenu();
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
      // Continue logout flow even if API fails
    }
    if (onLogout) onLogout();
    router.replace('/auth/login');
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Navegación por teclado dentro del menú (Arrow Up/Down, Home, End)
  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      dropdownRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
    );
    const idx = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(idx + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  // Mover foco al primer menuitem cuando el menú se abre
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const first = dropdownRef.current.querySelector<HTMLElement>('[role="menuitem"]');
      first?.focus();
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        onKeyDown={handleTriggerKeyDown}
        className="relative focus:outline-none group"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label="Abrir menú de usuario"
        type="button"
      >
        <Avatar
          className={cn(
            'w-10 h-10 ring-2 transition-all cursor-pointer',
            isOpen
              ? 'ring-origen-menta ring-offset-2 scale-105'
              : 'ring-white group-hover:ring-origen-pradera shadow-md',
          )}
        >
          {userAvatar ? (
            <AvatarImage src={userAvatar} alt={userName} />
          ) : (
            <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-sm font-semibold">
              {userInitials}
            </AvatarFallback>
          )}
        </Avatar>
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
            id={menuId}
            role="menu"
            aria-label="Opciones de cuenta"
            onKeyDown={handleMenuKeyDown}
          >
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

            <div className="py-2">
              <Link href="/dashboard/account" onClick={closeMenu} role="menuitem">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-origen-crema/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-origen-pradera/10">
                    <User className="w-5 h-5 text-text-subtle group-hover:text-origen-pradera" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-origen-bosque">Mi cuenta</p>
                    <p className="text-xs text-muted-foreground">Seguridad, cobros y perfil comercial</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-border group-hover:text-origen-pradera" />
                </div>
              </Link>
            </div>

            <div className="py-2 border-t border-border-subtle">
              <Link href="/dashboard/configuracion" onClick={closeMenu} role="menuitem">
                <div className="flex items-center gap-3 px-4 py-3 hover:bg-origen-crema/50 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center group-hover:bg-origen-pradera/10">
                    <Settings2 className="w-5 h-5 text-text-subtle group-hover:text-origen-pradera" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-origen-bosque">Configuraciones</p>
                    <p className="text-xs text-muted-foreground">Preferencias de notificaciones por email y push</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-border group-hover:text-origen-pradera" />
                </div>
              </Link>
            </div>

            <div className="px-5 py-3 bg-surface border-y border-border-subtle">
              <Link href="/ayuda" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-origen-pradera" onClick={closeMenu} role="menuitem">
                <HelpCircle className="w-4 h-4" />
                <span>Centro de ayuda</span>
              </Link>
            </div>

            <div className="py-2">
              <button onClick={handleLogout} className="w-full px-4 py-3 hover:bg-red-50 transition-colors group" type="button" role="menuitem">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-red-600">Cerrar sesion</p>
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
