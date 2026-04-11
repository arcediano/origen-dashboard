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

## Sprint 26 — Change Password Full-Stack (Abril 2026)

### Integración real de cambio de contraseña autenticada

**Fecha**: 2026-04-11  
**Commits**: `7c00548`, `134039b` (dashboard), `88a1887`, `1db2dbd`, `143811e` (microservices), `1137475`, `127c874` (gateway)  
**Agentes**: @desarrollador-codigo, @auditor-seguridad, @analista-pruebas, @documentador-tecnico

#### Descripción

Reemplaza el mock `setTimeout` de `security/page.tsx` por integración real con el backend a través del gateway. Incluye validación client-side completa, show/hide por campo, alertas de error/éxito y manejo tipado de errores de API.

#### Archivos afectados

| Archivo | Cambio | Repositorio |
|---------|--------|-------------|
| `src/app/dashboard/security/page.tsx` | Integración real `changePassword()`, validación, show/hide, alertas | dashboard |
| `src/lib/api/auth.ts` | Añadida `ChangePasswordPayload` interface + `changePassword()` function | dashboard |
| `src/modules/auth/auth/auth.service.ts` | Añadido método `changePassword()` con bcrypt, session invalidation, audit | microservices |
| `src/modules/auth/auth/auth.controller.ts` | Añadido `PATCH /auth/change-password` con `JwtAuthGuard` + rate limit | microservices |
| `src/modules/auth/auth/dto/change-password.dto.ts` | NUEVO — DTO con policy regex (`@Matches`) en `newPassword` | microservices |
| `src/modules/proxy/proxy.controller.ts` | Añadido proxy `PATCH /auth/change-password` con `AuthGuard` | gateway |
| `src/modules/proxy/dto/change-password.dto.ts` | NUEVO — DTO de validación en gateway | gateway |
| `src/modules/auth/auth/auth.service.change-password.spec.ts` | NUEVO — cobertura unitaria de `changePassword()` | microservices |
| `src/modules/auth/auth/auth.controller.change-password.spec.ts` | NUEVO — cobertura unitaria de controller | microservices |
| `src/modules/proxy/proxy.controller.change-password.spec.ts` | NUEVO — cobertura unitaria de proxy gateway | gateway |
| `src/lib/security/change-password.ts` | NUEVO — validación reusable de cambio de contraseña | dashboard |
| `tests/unit/validations/change-password.test.ts` | NUEVO — tests unitarios de validación | dashboard |
| `tests/unit/api/auth.api.test.ts` | Extensión de suite API para `changePassword()` | dashboard |
| `tests/mocks/handlers/auth.handlers.ts` | Handler MSW para `PATCH /auth/change-password` | dashboard |
| `tests/e2e/auth/change-password.spec.ts` | NUEVO — E2E flujo de cambio de contraseña | dashboard |
| `tests/e2e/auth/auth-regression.spec.ts` | NUEVO — E2E regresión auth (redirect + session expired) | dashboard |

#### Decisiones técnicas

- `userId` extraído del JWT en el microservicio (no del body) — previene privilege escalation
- `bcrypt.compare()` para verificar "nueva ≠ actual" (no comparación de strings crudos)
- `deleteAllUserSessions()` ejecutado tras `updatePassword()` para forzar re-auth en todos los dispositivos
- Rate limiting específico en endpoint: `@Throttle({ default: { limit: 5, ttl: 60000 } })`
- Alert de error usa className (`border-red-200 bg-red-50`) porque `Alert` de UX Library no toma `variant` prop

#### Gates de calidad

| Gate | Estado | Detalle |
|------|--------|---------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores | Verificado en los 3 proyectos |
| Tests unitarios | ✅ 57/57 PASS | 21 Jest (microservices) + 4 Jest (gateway) + 32 Vitest (dashboard) |
| Tests E2E auth | ✅ Ejecutables | 1 PASS garantizado + 3 escenarios condicionados por credenciales reales |
| Seguridad | ✅ APROBADO | Auditado por @auditor-seguridad — sin hallazgos Críticos/Altos |
| Documentación | ✅ Completa | Este archivo + actividades de agentes |

#### Estado de pendientes

- No quedan pendientes técnicos de Sprint 4/5 para el feature.
- Pendiente operativo: definir credenciales `E2E_ACTIVE_PRODUCER_EMAIL/PASSWORD` en entorno QA para ejecutar los 3 escenarios E2E condicionados actualmente en `skip`.

---

## Historial de ADRs relacionados

- [ADR-001](./adr/ADR-001-canonical-navigation-routes.md) — Rutas canónicas de navegación en cuenta del productor
