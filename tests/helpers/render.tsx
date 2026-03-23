/**
 * Helper de render para tests de integración.
 * Envuelve los componentes con los proveedores necesarios.
 *
 * Nota: next/navigation NO se mockea aquí — cada test file lo hace
 * con su propia implementación para controlar mockRouterPush.
 */

import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock de next/link (sin next/navigation — cada test lo controla)
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock del AuthContext — exportados para que los tests puedan setear valores de retorno
export const mockSetUserFromLogin = vi.fn();
export const mockClearUser = vi.fn();
export const mockRefreshUser = vi.fn();
export const mockSetUser = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    isProducer: false,
    setUserFromLogin: mockSetUserFromLogin,
    clearUser: mockClearUser,
    refreshUser: mockRefreshUser,
    setUser: mockSetUser,
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// Mock de framer-motion para evitar problemas con AnimatePresence en jsdom/happy-dom
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement> & { children?: ReactNode }) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  useAnimation: () => ({ start: vi.fn(), stop: vi.fn(), set: vi.fn() }),
  useMotionValue: (initial: unknown) => ({ get: () => initial, set: vi.fn() }),
  useTransform: () => ({ get: () => 0 }),
}));

function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function renderWithProviders(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from '@testing-library/react';
export { renderWithProviders as render };
