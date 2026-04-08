# ADR-001 — Arquitectura Canónica de Rutas del Dashboard del Productor

**Estado**: Aceptado  
**Fecha**: 2026-04-08  
**Autores**: @arquitecto-tecnico  
**Revisores**: @propietario-producto, @desarrollador-codigo  
**Sprint**: 22 — Account Navigation Foundation  

---

## Contexto

El dashboard de productor (`origen-dashboard`) ha acumulado rutas con solapamientos funcionales y semánticos. Existen al menos tres entrypoints para notificaciones, dos para seguridad/ajustes, y etiquetas que no representan la funcionalidad real de su destino. Esto genera confusión de usuario y dificulta el mantenimiento.

## Problema

1. **Solapamiento de notificaciones**: la campana del header, la opción del UserMenu y una tarjeta en `/dashboard/configuracion` apuntan al mismo dominio funcional con diferentes rutas.
2. **Solapamiento de seguridad**: existe `/dashboard/security` (dedicada) y `/dashboard/profile/settings` (legacy mixto con seguridad + notificaciones).
3. **Ruta `/dashboard/configuracion/perfil`** duplica funcionalidad ya cubierta en `/dashboard/profile`.
4. **Etiqueta "Pagos y ajustes"** en UserMenu sugiere un hub amplio, pero el destino es solo `/dashboard/configuracion/pagos`.

## Decisión

### Tabla de rutas canónicas (objetivo)

| Ruta canónica | Descripción | Accesible desde |
|---------------|-------------|-----------------|
| `/dashboard` | Home — métricas y acciones rápidas | Sidebar, logo |
| `/dashboard/profile` | Hub de perfil del productor | UserMenu > Mi perfil |
| `/dashboard/profile/personal` | Datos personales | Perfil > navegar |
| `/dashboard/profile/business` | Datos del negocio | Perfil > navegar |
| `/dashboard/profile/certifications` | Certificaciones | Perfil > navegar |
| `/dashboard/security` | Seguridad de la cuenta (única fuente de verdad) | UserMenu > Seguridad |
| `/dashboard/notifications?view=inbox` | Bandeja de notificaciones | Campana > Ver todas |
| `/dashboard/notifications?view=preferences` | Preferencias de notificación | UserMenu > Preferencias de notificación |
| `/dashboard/configuracion/pagos` | Pagos y métodos de cobro | UserMenu > Pagos |
| `/dashboard/orders` | Pedidos | Sidebar |
| `/dashboard/products` | Catálogo | Sidebar |
| `/dashboard/reviews` | Reseñas | Sidebar |
| `/ayuda` | Centro de ayuda (externo al dashboard) | UserMenu > Centro de ayuda |

### Rutas a deprecar / redirigir

| Ruta legacy | Destino canónico | Estrategia |
|-------------|-----------------|------------|
| `/dashboard/profile/settings` | Redirigir a `/dashboard/security` si tab=security o notifications; a `/dashboard/profile` si tab=profile | Redirect en `page.tsx` |
| `/dashboard/configuracion` | Mantener como hub pero sin duplicar destinos ya canónicos | Limpiar tarjetas redundantes en Sprint 23 |
| `/dashboard/configuracion/perfil` | `/dashboard/profile` | Redirect en `page.tsx` |
| `/dashboard/business` | `/dashboard/profile/business` | Redirect en `page.tsx` |
| `/dashboard/notifications` (sin `?view=`) | `/dashboard/notifications?view=inbox` | Redirect en middleware o `page.tsx` |

### Reglas para nuevas rutas

1. Toda ruta bajo `/dashboard/` debe estar documentada en este ADR o en una extensión explícita.
2. Ninguna opción del UserMenu puede apuntar a una ruta que también esté en la campana para la misma intención.
3. Los query params `?view=` son la única forma de separar sub-vistas de una misma página; no crear rutas separadas para sub-tabs.
4. Las rutas de contenido editorial (ejemplo `/dashboard/business`) deben redirigir al hub canónico (`/dashboard/profile/business`) — no crear duplicados.

## Consecuencias

- **Positivo**: navegación predecible, sin entrypoints duplicados, mantención simplificada.
- **Positivo**: el UserMenu queda con 5 opciones claras sin solapamiento funcional.
- **Negativo controlado**: usuarios con bookmarks en rutas legacy verán un redirect (transparente).
- **Deuda reconocida**: `/dashboard/configuracion` como hub necesita revisión de tarjetas en Sprint 23 para remover duplicados visibles.

## Implementación

Sprint 22: ADR aprobado + redirects críticos en rutas legacy.  
Sprint 23: limpieza completa de `/dashboard/configuracion` y `/dashboard/profile/settings`.

## Referencias

- Análisis funcional: `_workspace/docs/actividades/2026-04-08_19-08_analisis-opciones-menu-cuenta_arquitecto-tecnico-propietario-producto.md`
- Análisis técnico: `_workspace/docs/actividades/2026-04-08_19-20_arquitectura-navegacion-cuenta-notificaciones_arquitecto-tecnico.md`
- Sprint 22: `_workspace/docs/sprints/sprint-22-account-navigation-foundation.md`
