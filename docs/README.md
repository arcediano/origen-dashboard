# origen-dashboard

Portal del productor/vendedor de Origen Marketplace. Permite gestionar productos, pedidos, notificaciones, perfil, certificaciones y configuración de pagos.

## Descripción

Aplicación Next.js 15 con App Router y React Server Components. Consume el API Gateway de Origen y está desplegada en Vercel. Requiere autenticación con rol `PRODUCER`.

## Stack

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Next.js | 15.5.15 | Framework frontend (App Router) |
| React | ^18.3 | UI |
| TypeScript | — | Tipado estático estricto |
| Tailwind CSS | — | Estilos utilitarios |
| `@arcediano/ux-library` | 0.2.14 | Componentes corporativos |
| Framer Motion | ^12 | Animaciones |
| React Hook Form + Zod | — | Formularios con validación |
| Recharts | ^2.14 | Gráficas de ventas y analytics |
| Stripe | ^17 | Onboarding de pagos Stripe Connect |
| Playwright | — | Tests e2e |
| Vitest | — | Tests unitarios e integración |

## Cómo arrancar

### Instalación

```bash
cd origen-dashboard
npm install
```

### Variables de entorno

```env
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000
```

### Scripts disponibles

```bash
npm run dev              # Desarrollo (puerto 3001)
npm run dev:local        # Desarrollo apuntando a gateway local
npm run build            # Build con tests previos
npm test                 # Tests unitarios e integración (Vitest)
npm run test:e2e         # Tests e2e con Playwright
npm run test:coverage    # Cobertura de tests
npm run lint             # Linting
npm run type-check       # Verificación de tipos TypeScript
```

## Despliegue

Desplegado en **Vercel**.

- **URL producción:** `https://producers.origen.delivery`
- **Rama:** `main`

Ver `vercel.json` para configuración de headers y rewrites.

## Estructura de la aplicación

```
src/
├── app/
│   ├── layout.tsx                    # Layout raíz con fuentes y providers
│   ├── page.tsx                      # Redirige a /dashboard
│   ├── auth/                         # Login, registro de productor
│   ├── onboarding/                   # Flujo de 6 pasos de onboarding
│   ├── dashboard/                    # Área protegida del productor
│   │   ├── layout.tsx                # Layout con sidebar y header
│   │   ├── page.tsx                  # Home del dashboard (métricas)
│   │   ├── products/                 # Gestión de productos
│   │   ├── orders/                   # Gestión de pedidos
│   │   ├── reviews/                  # Reseñas recibidas
│   │   ├── notifications/            # Centro de notificaciones
│   │   ├── account/                  # Mi cuenta
│   │   ├── business/                 # Datos del negocio
│   │   ├── configuracion/            # Alertas y preferencias
│   │   ├── profile/                  # Perfil público
│   │   ├── perfil/                   # Edición de perfil
│   │   └── security/                 # Seguridad: cambio de contraseña
│   ├── aviso-legal/ privacidad/ terminos/ cookies/  # Páginas legales
│   └── soporte/ ayuda/ contacto/    # Soporte y ayuda
├── components/                       # Componentes específicos del dashboard
├── contexts/                         # Context providers (auth, etc.)
├── hooks/                            # Custom hooks
├── lib/
│   ├── api/                          # Clientes de API por dominio
│   ├── notifications/                # Lógica de notificaciones
│   ├── products/                     # Lógica de productos
│   ├── security/                     # Cambio de contraseña
│   ├── stripe/                       # Onboarding Stripe
│   ├── utils/                        # Utilidades generales
│   └── validations/                  # Esquemas Zod
└── types/                            # Tipos TypeScript del dominio
```

## Documentación adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Arquitectura y flujos principales
- [API.md](./API.md) — Rutas Next.js y llamadas al gateway
- [IMPLEMENTATIONS.md](./IMPLEMENTATIONS.md) — Historial de implementaciones
