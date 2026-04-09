# origen-dashboard — Registro de Implementaciones

Historial de todas las implementaciones significativas en el proyecto `origen-dashboard`.

---

## Sprint 24–25 — Cuenta del Productor + Notificaciones (Abril 2026)

### Conectividad de páginas de perfil y pagos a APIs reales

**Fecha**: 2026-04-09  
**Commits**: `dd66a25`, `6c487a0`, `7af7599`, `ab2d175`  
**Agentes**: @desarrollador-codigo, @auditor-seguridad, @analista-pruebas

#### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/app/dashboard/profile/personal/page.tsx` | Conectado a auth API real — carga y guarda nombre del productor via `updateProducerName()` |
| `src/app/dashboard/profile/business/page.tsx` | Conectado a onboarding API real — persiste datos comerciales via `updateOnboardingStep()` |
| `src/app/dashboard/configuracion/pagos/page.tsx` | Muestra estado Stripe real desde onboarding — eliminados valores hardcoded |
| `src/lib/api/auth.ts` | Añadida función `updateProducerName(firstName, lastName)` |
| `src/lib/api/onboarding.ts` | Tipos fuertes `OnboardingResponse` para contratos de API |
| `tests/e2e/dashboard/notifications-regression.spec.ts` | Suite E2E estabilizada — skip condicional cuando no hay notificaciones sin leer |

#### Gates de calidad

| Gate | Estado |
|------|--------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores |
| Tests unitarios (`vitest run`) | ✅ 375/375 tests verdes — 25 ficheros |
| Seguridad | ✅ Sin vulnerabilidades altas/críticas en prod — 9 highs sólo en dependencias de test (vitest, vite, happy-dom) — riesgo 0 en producción |
| Documentación | ✅ Este archivo |

---

### Limpieza de código muerto (chore)

**Fecha**: 2026-04-09  
**Commit**: `dd66a25`  
**Agentes**: @desarrollador-codigo

#### Archivos eliminados

| Archivo | Motivo |
|---------|--------|
| `src/components/features/dashboard/data.ts` | Sin referencias externas — mock data huérfano |
| `src/components/features/dashboard/data/index.ts` | Barrel del módulo mock eliminado |
| `src/components/features/dashboard/data/mock-orders.ts` | Sin consumidores reales |
| `src/components/features/dashboard/data/mock-products.ts` | Sin consumidores reales |
| `src/components/features/dashboard/data/mock-producer.ts` | Sin consumidores reales |
| `src/components/features/dashboard/data/mock-stats.ts` | Sin consumidores reales |
| `src/hooks/use-responsive.ts` | Hook sin importaciones en todo el proyecto |
| `src/mocks/sellers.ts` | Sin referencias activas en producción |
| `src/components/features/contact/ContactInfo.tsx` | Componente sin uso |
| `src/components/features/contact/MapSection.tsx` | Componente sin uso |

#### Impacto

- 373 líneas eliminadas, cero errores de compilación tras limpieza.
- Reducción de superficie de mantenimiento y confusión de mock vs real.

---

## Historial de ADRs relacionados

- [ADR-001](./adr/ADR-001-canonical-navigation-routes.md) — Rutas canónicas de navegación en cuenta del productor
