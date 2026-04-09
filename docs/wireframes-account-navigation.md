# Wireframes — Pantallas Destino del Menú de Cuenta

**Fecha**: 2026-04-08  
**Agente**: @diseñador-ux  
**Sprint**: 22 — Account Navigation Foundation (US-DASH-2204)  
**Proyecto**: origen-dashboard  
**Estado**: Aprobado para implementación — Sprint 23

---

## Principios de diseño aplicados (Manual v5.0)

- Mobile-first: diseño base en 375px, escala hacia 1440px.
- Comercial: valor y acción visible en < 3 seg.
- Tokens semánticos: sin valores hardcoded; usar palette y tokens del sistema.
- Accesibilidad: WCAG AA mínimo, foco visible, contraste ≥ 4.5.
- Requisito canónico de cards dashboard: para cards de acceso/gestión usar el mismo patrón visual de `/dashboard/profile` (estructura `CardHeader + CardContent + CTA outline`, título `text-base`, descripción `text-sm leading-relaxed`).

---

## 1. Perfil — Hub del Productor (`/dashboard/profile`)

### Jerarquía visual

```
┌─────────────────────────────────────────────────────┐
│ [← Volver al dashboard]                             │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  AVATAR (80px)  Nombre Productor            │    │
│  │                 @handle / email             │    │
│  │                 [Badge: Verificado]         │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  Completitud del perfil  ████████░░  80%     │   │
│  │  [Ver qué falta →]                           │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  SECCIONES (cards navegables):                      │
│  ┌─────────────────┐  ┌─────────────────┐           │
│  │  👤 Información  │  │  🏪 Mi Negocio   │           │
│  │  personal       │  │                 │           │
│  │  [→]            │  │  [→]            │           │
│  └─────────────────┘  └─────────────────┘           │
│  ┌─────────────────┐                               │
│  │  📋 Certificaciones                             │
│  │  & Documentos   │                               │
│  │  [→]            │                               │
│  └─────────────────┘                               │
└─────────────────────────────────────────────────────┘
```

### Especificación de tokens

| Elemento | Token |
|----------|-------|
| Fondo de página | `bg-surface-alt` |
| Header card | `bg-gradient-to-r from-origen-crema/30 to-transparent` |
| Badge verificado | `Badge variant="leaf"` |
| Barra de progreso fill | `bg-origen-pradera` |
| Barra de progreso track | `bg-border-subtle` |
| Cards de sección | `bg-surface border border-border-subtle rounded-2xl` |
| Chevron de navegación | `text-text-subtle` |
| Hover card | `hover:border-origen-pradera/40 hover:shadow-md` |

### Estados necesarios

- **Cargando**: skeleton de 3 cards con shimmer
- **Sin verificar**: banner informativo `bg-amber-50 border-amber-200` con CTA a certificaciones
- **Perfil incompleto**: alerta contextual sobre barra de progreso

### Comportamiento mobile (375px)

- Avatar + datos en fila única
- Cards de sección en columna completa (no grid)
- Barra de progreso visible aunque sea pequeña

---

## 2. Seguridad (`/dashboard/security`)

### Jerarquía visual

```
┌─────────────────────────────────────────────────────┐
│ [← Perfil]  Seguridad de cuenta                    │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  🔐 Contraseña                               │   │
│  │  Última actualización: hace 3 meses          │   │
│  │  [Cambiar contraseña →]                      │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  📱 Autenticación en dos pasos               │   │
│  │  Estado: Desactivado                         │   │
│  │  [Activar 2FA →]                             │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  🖥 Sesiones activas (2)                     │   │
│  │  • Este dispositivo (ahora)                  │   │
│  │  • Chrome — Windows (ayer)                   │   │
│  │  [Cerrar otras sesiones]                     │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  📋 Actividad reciente                       │   │
│  │  Inicio de sesión · hace 2h · Madrid         │   │
│  │  [Ver todo →]                                │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Especificación de tokens

| Elemento | Token |
|----------|-------|
| Icono de alerta (2FA desactivado) | `text-amber-500` dentro de `bg-amber-50 rounded-xl` |
| Icono de ok (contraseña actualizada) | `text-origen-pradera` dentro de `bg-origen-pastel rounded-xl` |
| CTA primario | `Button variant="default"` (`bg-gradient-origen`) |
| CTA destructivo (cerrar sesiones) | `Button variant="destructive"` |
| Card de sesión activa (este dispositivo) | `border-l-2 border-origen-pradera` |
| Card de sesión inactiva | `border border-border-subtle` |

### Estados necesarios

- **2FA activo**: icono verde, texto "Activado", botón "Gestionar"
- **Contraseña débil**: badge rojo "Actualizar recomendado"
- **Sin sesiones adicionales**: sección oculta o mensaje "Solo un dispositivo activo"
- **Cargando sesiones**: skeleton de lista

### Comportamiento mobile

- Cada sección como card full-width
- CTA de acción siempre visible sin scroll horizontal

---

## 3. Notificaciones (`/dashboard/notifications`)

### 3. Vista Unificada (Inbox + Preferencias en continuidad)

```
┌─────────────────────────────────────────────────────┐
│ Notificaciones                                      │
│ [Actualizar] [✓ Todo]                               │
│                                                     │
│  Filtros rápidos:                                   │
│  [Todos] [Pedidos] [Productos] [Sistema]            │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  🟢  Nuevo pedido #1234                      │   │
│  │       "Cesta de frutas ecológicas" — 28,90€  │   │
│  │       hace 5 min  [Ir al pedido →]           │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │  🟡  Stock bajo — Aceite de Oliva            │   │
│  │       Solo 3 unidades disponibles            │   │
│  │       hace 2h  [Ver producto →]              │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │     Nueva reseña 4★ — Laura G.               │   │
│  │       hace 1 día  [Ver reseña →]             │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  [Cargar más]                                       │
│                                                     │
│  ───────────────────────────────────────────────     │
│  Preferencias de notificación                        │
│  Email / Push en la misma pantalla                   │
│  [Guardar preferencias]                              │
└─────────────────────────────────────────────────────┘
```

### Especificación de tokens

| Elemento | Token |
|----------|-------|
| Selector de vista | Eliminado (Inbox y Preferencias visibles en la misma pantalla) |
| Notificación no leída | `border-l-2 border-origen-pradera bg-origen-pastel/30` |
| Notificación leída | `border border-border-subtle bg-surface` |
| Dot de prioridad URGENT | `bg-red-500` |
| Dot de prioridad HIGH | `bg-amber-500` |
| Dot de prioridad MEDIUM/LOW | `bg-origen-pradera` |
| Toggle activo | `bg-origen-pradera` |
| Toggle inactivo | `bg-border-subtle` |
| Botón guardar | `Button variant="default"` |

### Estados

- **Inbox vacío**: ilustración + "Todo al día" + CTA a filtros
- **Error de carga**: alerta + botón Reintentar
- **Actualizando**: spinner sobre lista sin bloquear scroll

---

## 4. Pagos (`/dashboard/configuracion/pagos`)

### Jerarquía visual

```
┌─────────────────────────────────────────────────────┐
│ [← Dashboard]  Pagos                               │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  💳 Método de cobro                          │   │
│  │  Stripe Connect  [Estado: ✅ Activo]          │   │
│  │  IBAN: ●●●●●●● 4231                          │   │
│  │  [Gestionar cuenta Stripe →]                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  📊 Comisiones                               │   │
│  │  Plataforma: 8% por venta                    │   │
│  │  Pasarela: 1.4% + 0.25€ (Stripe)            │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  ⚠️ Verificación KYC                         │   │
│  │  [Estado: Pendiente de documentos]           │   │
│  │  [Completar verificación →]                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │  💰 Próximo pago                             │   │
│  │  Estimado: 15 may 2026 — 284,50€             │   │
│  │  [Ver historial de pagos →]                  │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Especificación de tokens

| Elemento | Token |
|----------|-------|
| Estado "Activo" | `Badge variant="leaf"` |
| Estado "Pendiente KYC" | `Badge variant="amber"` (implementar en Sprint 23) |
| Estado "Bloqueado" | `Badge variant="danger"` |
| Card KYC pendiente | `bg-amber-50/50 border-amber-200` |
| Card Stripe activo | `bg-origen-pastel/30 border-origen-pradera/30` |
| CTA Stripe | `Button variant="outline"` |
| CTA KYC | `Button variant="default"` (alta prioridad) |

### Estados

- **Sin Stripe conectado**: CTA prominente "Conectar Stripe" → replace de la card de pagos
- **KYC bloqueado**: alerta de error + CTA urgente
- **Cargando**: skeleton de 4 cards

---

## Checklist de accesibilidad (todas las pantallas)

- [ ] Todos los botones tienen texto visible o `aria-label` descriptivo
- [ ] Iconos decorativos tienen `aria-hidden="true"`
- [ ] Foco visible en todos los elementos interactivos (`focus-visible:ring-2`)
- [ ] Contraste de texto ≥ 4.5:1 en todos los estados
- [ ] Navegación completa por teclado (Tab, Shift+Tab, Enter, Space, Escape)
- [ ] Roles ARIA correctos en listas, tabs y dialogs
- [ ] Labels asociados a todos los inputs de formulario

## Próximas acciones (Sprint 23)

1. Validar estos wireframes contra el código generado en sprint.
2. Definir si el `Badge variant="amber"` existe en UXLibrary o debe crearse.
3. Revisar pantalla de security — hoy es parcialmente mocked — antes de iterar UX.
4. Crear estados empty y error como componentes reutilizables si no existen en UXLibrary.

## Referencias

- ADR-001: `origen-dashboard/docs/adr/ADR-001-canonical-navigation-routes.md`
- Sprint 22: `_workspace/docs/sprints/sprint-22-account-navigation-foundation.md`
- Manual de marca: `_workspace/docs/manual-de-marca-origen.md`
