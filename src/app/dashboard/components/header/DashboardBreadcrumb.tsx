// 📁 /src/app/dashboard/components/header/DashboardBreadcrumb.tsx
'use client';

import * as React from 'react'; // AÑADIR
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export function DashboardBreadcrumb() {
  const pathname = usePathname();
  
  // Generar los segmentos de la ruta, excluyendo 'dashboard' si es el primer elemento
  const segments = pathname.split('/').filter(Boolean);
  
  // Si solo estamos en /dashboard, no mostramos breadcrumb
  if (segments.length === 1 && segments[0] === 'dashboard') {
    return null;
  }

  // Construir las rutas para los links
  const breadcrumbs = segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    // Mapear slugs a nombres más amigables
    const labelMap: Record<string, string> = {
      'dashboard': 'Inicio',
      'profile': 'Perfil',
      'business': 'Mi Negocio',
      'settings': 'Configuración',
      'certifications': 'Certificaciones',
      'products': 'Productos',
      'orders': 'Pedidos'
    };
    
    label = labelMap[segment] || label;
    
    return { href, label };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm">
      <ol className="flex items-center space-x-1">
        <li>
          <Link 
            href="/dashboard" 
            className="text-muted-foreground hover:text-origen-pradera transition-colors"
          >
            <Home className="w-4 h-4" />
          </Link>
        </li>
        {breadcrumbs.slice(1).map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-text-subtle mx-1" />
            {index === breadcrumbs.slice(1).length - 1 ? (
              <span className="font-medium text-origen-bosque" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="text-muted-foreground hover:text-origen-pradera transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}