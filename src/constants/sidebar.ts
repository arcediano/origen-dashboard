/**
 * @file sidebar.ts
 * @description Fuente unica de navegacion del dashboard
 */

import {
  CreditCard,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Star,
  Truck,
  User,
} from 'lucide-react';

export interface SubmenuItem {
  id: string;
  label: string;
  href: string;
  icon?: React.ElementType;
  badge?: number;
  matchPaths?: string[];
}

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  badge?: number;
  submenu?: (SubmenuItem | NestedMenuItem)[];
  matchPaths?: string[];
}

export interface NestedMenuItem extends SubmenuItem {
  submenu: SubmenuItem[];
}

export interface NavigationSection {
  id: string;
  label: string;
  items: MenuItem[];
}

export interface RootTabItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: number;
  matchPaths: string[];
  isCentral?: boolean;
}

export interface DashboardBreadcrumbItem {
  href: string;
  label: string;
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/perfil': 'Perfil',
  '/dashboard': 'Inicio',
  '/dashboard/orders': 'Pedidos',
  '/dashboard/products': 'Productos',
  '/dashboard/products/create': 'Nuevo producto',
  '/dashboard/reviews': 'Resenas',
  '/dashboard/profile': 'Perfil comercial',
  '/dashboard/profile/personal': 'Informacion personal',
  '/dashboard/profile/business': 'Mi negocio',
  '/dashboard/profile/certifications': 'Certificaciones',
  '/dashboard/profile/settings': 'Ajustes de perfil',
  '/dashboard/account': 'Cuenta',
  '/dashboard/notifications': 'Notificaciones',
  '/dashboard/security': 'Seguridad',
  '/dashboard/configuracion': 'Configuraciones',
  '/dashboard/configuracion/envios': 'Envios',
  '/dashboard/configuracion/pagos': 'Cobros',
  '/dashboard/configuracion/perfil': 'Ajustes de perfil',
  '/dashboard/business': 'Mi negocio',
};

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Inicio',
  orders: 'Pedidos',
  products: 'Productos',
  create: 'Nuevo producto',
  reviews: 'Resenas',
  profile: 'Perfil comercial',
  personal: 'Informacion personal',
  business: 'Mi negocio',
  certifications: 'Certificaciones',
  account: 'Cuenta',
  settings: 'Ajustes de perfil',
  notifications: 'Notificaciones',
  security: 'Seguridad',
  configuracion: 'Configuraciones',
  envios: 'Envios',
  pagos: 'Cobros',
};

const GENERAL_ITEMS: MenuItem[] = [
  {
    id: 'inicio',
    label: 'Inicio',
    icon: LayoutDashboard,
    href: '/dashboard',
    matchPaths: ['/dashboard'],
  },
];

const OPERATIONS_ITEMS: MenuItem[] = [
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ShoppingBag,
    href: '/dashboard/orders',
    matchPaths: ['/dashboard/orders*'],
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: Package,
    href: '/dashboard/products',
    matchPaths: ['/dashboard/products*'],
  },
  {
    id: 'resenas',
    label: 'Resenas',
    icon: Star,
    href: '/dashboard/reviews',
    matchPaths: ['/dashboard/reviews*'],
  },
];

const BUSINESS_ITEMS: MenuItem[] = [
  {
    id: 'perfil-comercial',
    label: 'Perfil comercial',
    icon: User,
    href: '/dashboard/profile',
    matchPaths: ['/dashboard/profile', '/dashboard/profile/personal*', '/dashboard/profile/business*', '/dashboard/profile/certifications*', '/dashboard/business*'],
  },
  {
    id: 'envios',
    label: 'Logistica',
    icon: Truck,
    href: '/dashboard/configuracion/envios',
    matchPaths: ['/dashboard/configuracion/envios*'],
  },
  {
    id: 'cobros',
    label: 'Cobros',
    icon: CreditCard,
    href: '/dashboard/configuracion/pagos',
    matchPaths: ['/dashboard/configuracion/pagos*'],
  },
];

export const DASHBOARD_NAV_SECTIONS: NavigationSection[] = [
  { id: 'general', label: 'General', items: GENERAL_ITEMS },
  { id: 'operacion', label: 'Operacion', items: OPERATIONS_ITEMS },
  { id: 'negocio', label: 'Negocio', items: BUSINESS_ITEMS },
];

export const MENU_ITEMS: MenuItem[] = DASHBOARD_NAV_SECTIONS.flatMap((section) => section.items);

export const MOBILE_ROOT_TABS: RootTabItem[] = [
  {
    id: 'pedidos',
    label: 'Pedidos',
    icon: ShoppingBag,
    href: '/dashboard/orders',
    matchPaths: ['/dashboard/orders*'],
  },
  {
    id: 'productos',
    label: 'Productos',
    icon: Package,
    href: '/dashboard/products',
    matchPaths: ['/dashboard/products*'],
  },
  {
    id: 'inicio',
    label: 'Inicio',
    icon: LayoutDashboard,
    href: '/dashboard',
    matchPaths: ['/dashboard'],
    isCentral: true,
  },
  {
    id: 'cobros',
    label: 'Cobros',
    icon: CreditCard,
    href: '/dashboard/configuracion/pagos',
    matchPaths: ['/dashboard/configuracion/pagos*'],
  },
  {
    id: 'perfil',
    label: 'Perfil',
    icon: User,
    href: '/dashboard/perfil',
    matchPaths: [
      '/dashboard/perfil*',
      '/dashboard/account*',
      '/dashboard/configuracion*',
      '/dashboard/security*',
      '/dashboard/profile/settings*',
    ],
  },
];

function matchesPattern(pathname: string, pattern: string): boolean {
  if (pattern.endsWith('*')) {
    const base = pattern.slice(0, -1);
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname === pattern;
}

export function matchesNavigationItem(pathname: string, item: { href?: string; matchPaths?: string[] }): boolean {
  const patterns = item.matchPaths && item.matchPaths.length > 0
    ? item.matchPaths
    : item.href
      ? [item.href]
      : [];

  return patterns.some((pattern) => matchesPattern(pathname, pattern));
}

export function getDashboardSectionLabel(pathname: string): string | null {
  for (const section of DASHBOARD_NAV_SECTIONS) {
    if (section.items.some((item) => matchesNavigationItem(pathname, item))) {
      return section.label;
    }
  }
  return null;
}

export function getDashboardPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (pathname.startsWith('/dashboard/products/') && pathname.endsWith('/edit')) return 'Editar producto';
  if (pathname.startsWith('/dashboard/products/') && pathname !== '/dashboard/products/create') return 'Detalle del producto';
  if (pathname.startsWith('/dashboard/orders/') && pathname !== '/dashboard/orders') return 'Detalle del pedido';
  return 'Dashboard';
}

export function isRootMobileTab(pathname: string): boolean {
  return MOBILE_ROOT_TABS.some((tab) => matchesNavigationItem(pathname, { matchPaths: tab.matchPaths }) && pathname === tab.href);
}

const CRUMB_LOGICAL_PARENT: Record<string, DashboardBreadcrumbItem> = {
  '/dashboard/security': { href: '/dashboard/account', label: 'Cuenta' },
  '/dashboard/notifications': { href: '/dashboard/account', label: 'Cuenta' },
  '/dashboard/profile': { href: '/dashboard/account', label: 'Cuenta' },
};

const CRUMB_HREF_OVERRIDE: Record<string, string> = {};

export function getDashboardBreadcrumbs(pathname: string): DashboardBreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: DashboardBreadcrumbItem[] = [{ href: '/dashboard', label: 'Inicio' }];
  const isPaymentsPath = pathname.startsWith('/dashboard/configuracion/pagos');

  let accumulated = '';
  for (let index = 1; index < segments.length; index += 1) {
    const segment = segments[index];
    accumulated += `/${segment}`;
    const rawHref = `/dashboard${accumulated}`;
    const href = CRUMB_HREF_OVERRIDE[rawHref] ?? rawHref;

    let label = SEGMENT_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    if (isPaymentsPath && rawHref === '/dashboard/configuracion') {
      label = 'Mi cuenta';
    }

    if (/^\d+$/.test(segment) || /^[a-f0-9-]{8,}$/i.test(segment)) {
      if (segments[index - 1] === 'orders') label = 'Detalle del pedido';
      if (segments[index - 1] === 'products') label = 'Detalle del producto';
    }

    if (index === 1 && CRUMB_LOGICAL_PARENT[rawHref]) {
      breadcrumbs.push(CRUMB_LOGICAL_PARENT[rawHref]);
    }

    breadcrumbs.push({
      href: isPaymentsPath && rawHref === '/dashboard/configuracion' ? '/dashboard/account' : href,
      label,
    });
  }

  if (pathname.startsWith('/dashboard/products/') && pathname.endsWith('/edit')) {
    breadcrumbs[breadcrumbs.length - 1] = {
      href: pathname,
      label: 'Editar producto',
    };
  }

  return breadcrumbs;
}
