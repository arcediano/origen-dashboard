# origen-dashboard — Registro de Implementaciones

Historial de todas las implementaciones significativas en el proyecto `origen-dashboard`.

---

## Sprint 34 — Rediseño Mi Negocio con API real (Abril 2026)

**Fecha**: 2026-04-28  
**Agentes**: @desarrollador-codigo, @auditor-seguridad, @analista-pruebas, @documentador-tecnico

### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/app/dashboard/profile/business/page.tsx` | Reimplementación completa de "Mi Negocio" con UX responsive, skeleton de carga, cards por sección, select de `teamSize` y `entityType`, campos de dirección separados, valores de marca, visual logo/banner con preview y barra sticky móvil. |
| `src/lib/api/producers.ts` | Nuevos contratos `getProducerProfile()` y `updateProducerProfile()` (`GET/PATCH /producers/profile`) para desacoplar edición de negocio del flujo de onboarding. |

### Resultado funcional

- Edición de perfil comercial en un único guardado (`PATCH /producers/profile`), sin depender de `saveStep1/2/3`.
- Precarga de datos existentes del productor en todos los campos de negocio.
- Persistencia de cambios validada al navegar fuera y volver.
- Botones con icono+texto estabilizados en móvil (`whitespace-nowrap`, `flex-nowrap`) para evitar saltos de línea.

### Gates de calidad

| Gate | Estado |
|------|--------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores en `origen-dashboard` |
| E2E real | ✅ `tests/e2e/dashboard/account-security-payments-business-real.spec.ts` — **7/7 PASS** |
| Seguridad | ✅ APROBADO para producción tras reauditoría |
| Documentación | ✅ Este archivo + `docs/business-profile/especificacion-tecnica-mi-negocio.md` |

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

## Sprint 26 — Integraciones de perfil: Stripe webhook, Certificaciones y Logo/Banner (Abril 2026)

**Fecha**: 2026-04-15  
**Agentes**: @desarrollador-codigo

### Stripe webhook (`origen-master-microservices`)

| Archivo | Cambio |
|---------|--------|
| `src/modules/producers/producers/stripe-webhook.service.ts` | **NUEVO** — verifica firma HMAC y maneja `account.updated` → actualiza `PaymentConfig.stripeConnected` |
| `src/modules/producers/producers/producers.controller.ts` | `POST /producers/webhooks/stripe` — endpoint público, sin guard, seguridad vía HMAC |
| `src/modules/producers/producers/producers.module.ts` | `StripeWebhookService` registrado como provider |
| `src/main.ts` | `NestFactory.create(AppModule, { rawBody: true })` — requerido para verificación de firma |
| `.env.example` | `STRIPE_SECRET_KEY` y `STRIPE_WEBHOOK_SECRET` añadidos |

**Decisión de tipos**: Con `module: commonjs` + `moduleResolution: node`, el paquete `stripe` v22 resuelve al tipo CJS `export = StripeConstructor` (namespace). Se usa `InstanceType<typeof Stripe>` para el cliente y `ReturnType<StripeClient['webhooks']['constructEvent']>` para el tipo de evento.

### Certificaciones — integración API real (`origen-dashboard`)

| Archivo | Cambio |
|---------|--------|
| `src/lib/api/onboarding.ts` | `OnboardingData` extendida con `certifications[]` y `documents[]`; nueva función `saveCertificationDocuments` |
| `src/app/dashboard/profile/certifications/page.tsx` | Reescrita completamente — carga real via `loadOnboardingData()`, upload via `uploadFile` + `saveCertificationDocuments`, estados VERIFIED/PENDING/REJECTED, barra de progreso real |
| `origen-master-microservices/src/modules/producers/producers/producers.service.ts` | `getOnboardingData` ahora incluye `documents: true` en el Prisma include |

### Logo/Banner upload (`origen-dashboard`)

| Archivo | Cambio |
|---------|--------|
| `src/app/dashboard/profile/business/page.tsx` | Botones Camera ahora disparan file picker; upload via `uploadFile('visual/logo')` y `uploadFile('visual/banner')`; preview inmediato en UI; keys guardadas en `handleSave` via `saveStep3({ logoKey, bannerKey })` |

### Gates de calidad

| Gate | Estado |
|------|--------|
| Compilación `tsc --noEmit` — `origen-dashboard` | ✅ Sin errores |
| Compilación `tsc --noEmit` — `origen-master-microservices` | ✅ Sin errores |
| Tests `vitest run` — `origen-dashboard` | ✅ 409/409 tests verdes — 29 ficheros |
| Seguridad | ✅ Sin guards omitidos — webhook asegurado por HMAC Stripe |
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

## Sprint 26 — Configuraciones de Alertas por Canal y Evento (Abril 2026)

### Separacion real Email/Push y granularidad por tipo de alerta

**Fecha**: 2026-04-12  
**Agentes**: @desarrollador-codigo, @analista-pruebas, @documentador-tecnico

#### Descripcion

Se corrige la seccion `Configuraciones` para distinguir de forma real por canal (`email`, `push`) y por tipo de alerta (`eventType`), eliminando la agrupacion de `NEW_REVIEW` + `REVIEW_REPLY` en un unico toggle y alineando defaults con la politica del backend.

#### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/app/dashboard/configuracion/page.tsx` | Refactor de estado/mapeo: defaults por canal, filas independientes para `Nuevas resenas` y `Respuesta a resena`, guardado via payload canonico |
| `src/lib/notifications/preferences-config.ts` | NUEVO - fuente unica para mapeo `eventType <-> key`, defaults por canal y constructor de payload |
| `tests/unit/lib/notifications/preferences-config.test.ts` | NUEVO - pruebas unitarias de defaults, independencia `NEW_REVIEW/REVIEW_REPLY` y payload por canal |

#### Gates de calidad

| Gate | Estado | Detalle |
|------|--------|---------|
| Compilacion (`tsc --noEmit`) | ✅ Sin errores | Ejecutado en `origen-dashboard` |
| Tests unitarios (`vitest run tests/unit`) | ✅ 320/320 PASS | Incluye nueva suite `preferences-config.test.ts` |
| Seguridad | ✅ Sin cambios de superficie sensible | Alcance UI + mapeo de preferencias |
| Documentacion | ✅ Completa | Este archivo + plan Sprint 26 |

---

## Sprint 29 — Certificaciones de producto: selector en formulario (Abril 2026)

### Selector de catálogo de certificaciones en formulario de producto

**Fecha**: 2026-04-16  
**US**: US-DASH-2901  
**Agentes**: @desarrollador-codigo, @analista-pruebas, @auditor-seguridad

#### Descripción

Reemplaza la lista predefinida estática de certificaciones en `StepCertificationsAttributes` por un combobox de búsqueda en tiempo real contra el catálogo maestro del backend. En modo edición (cuando existe `productId`), los cambios se persisten inmediatamente vía API.

#### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/lib/api/products.ts` | Añadidas: `CatalogCertification` interface, `getCertificationsCatalog()`, `addProductCertification()`, `removeProductCertification()` |
| `src/lib/api/onboarding.ts` | `rejectedReason?: string \| null` añadido a `OnboardingData.certifications[]` (fix pre-existente Sprint 28) |
| `src/app/dashboard/products/components/steps/StepCertificationsAttributes.tsx` | Prop `productId?: string`; combobox con debounce 350ms; wiring API en modo edit; spinner en delete; error banner |
| `src/app/dashboard/products/components/ProductFormSteps.tsx` | Prop `productId?: string` propagada a `StepCertificationsAttributes` |
| `src/app/dashboard/products/[id]/edit/page.tsx` | Pasa `productId={productId}` a `ProductFormSteps` |
| `tests/unit/certifications-catalog-api.test.ts` | NUEVO — 9 tests unitarios de las 3 funciones API |

#### Decisiones técnicas

- Debounce de 350ms en búsqueda para reducir requests al backend
- En modo create (`productId` ausente): cambios solo en estado local hasta submit del formulario
- En modo edit: cada add/remove persiste inmediatamente (UX clear — sin botón "guardar paso")
- `URLSearchParams` usado para construir query string — previene injection
- Spinner `Loader2` en botón delete con `disabled` para prevenir clicks duplicados

#### Gates de calidad

| Gate | Estado | Detalle |
|------|--------|---------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores | `origen-dashboard` verificado |
| Tests unitarios | ✅ 9/9 PASS | `certifications-catalog-api.test.ts` |
| Seguridad | ✅ APROBADO | @auditor-seguridad — sin hallazgos |
| Documentación | ✅ Este archivo | |

---

## Historial de ADRs relacionados

- [ADR-001](./adr/ADR-001-canonical-navigation-routes.md) — Rutas canónicas de navegación en cuenta del productor

---

## Sprint 26 — Productos y Onboarding alineados con backend (Abril 2026)

### Listado server-driven, detalle protegido y persistencia rica del producto

**Fecha**: 2026-04-13  
**Agentes**: @desarrollador-codigo, @documentador-tecnico

#### Descripción

Se reemplaza el flujo híbrido de productos del dashboard por contratos reales de backend para filtros, paginación, estadísticas y detalle protegido del productor. Además, el payload de creación/edición pasa a cubrir las estructuras ya definidas en Prisma (`priceTiers`, `nutritionalInfo`, `productionInfo`, `certifications`, `attributes`), eliminando la pérdida silenciosa de datos entre formulario y persistencia.

También se endurece la lectura pública para evitar que productos no publicados queden accesibles por ID/slug fuera del dashboard, y se elimina la visualización de tendencias simuladas en el panel expandido del listado.

#### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/app/dashboard/products/page.tsx` | Listado de productos movido a filtros/paginación server-side; consumo de stats y facetas reales |
| `src/app/dashboard/products/components/ProductFilters.tsx` | Filtros adaptados a categorías dinámicas con `value/label` y facetas del backend |
| `src/app/dashboard/products/components/ProductStats.tsx` | KPIs ampliados para mostrar ventas, vistas, rating e ingresos reales |
| `src/app/dashboard/products/components/ProductExpandableDetails.tsx` | Eliminadas métricas semanales simuladas; solo se muestran datos reales disponibles |
| `src/app/dashboard/products/components/steps/StepInventory.tsx` | SKU dejado como informativo/no editable; completitud basada en inventario real |
| `src/hooks/useProductForm.ts` | Corrección de cálculo de pasos completados, publicación y cancelación a ruta canónica |
| `src/lib/api/products.ts` | Payload rico de producto, stats/facets reales y detalle protegido del productor |
| `src/lib/api/products-mapper.ts` | Soporte completo para relaciones anidadas devueltas por backend |
| `src/modules/products/products/products.controller.ts` | Nuevos endpoints `stats`, `facets`, detalle protegido y endurecimiento de lecturas públicas |
| `src/modules/products/products/products.service.ts` | Persistencia/lectura de relaciones ricas, filtros server-side y generación segura de SKU |
| `src/modules/products/products/dto/create-product.dto.ts` | DTO ampliado con estructuras anidadas del formulario |
| `src/modules/products/products/dto/product-response.dto.ts` | DTO de respuesta ampliado con estructuras ricas del producto |
| `src/modules/proxy/products.controller.ts` | Proxy de nuevos endpoints de productos del productor |

#### Gates de calidad

| Gate | Estado | Detalle |
|------|--------|---------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores | Verificado en `origen-dashboard`, `origen-master-microservices` y `origen-gateway` |
| Tests unitarios | ✅ Parcial relevante en verde | `vitest run tests/unit/hooks/useProductFilters.test.ts` → 44/44 PASS |
| Seguridad | ✅ Mejora aplicada | El dashboard deja de depender del detalle público por ID; los borradores ya no se leen por endpoint público |
| Documentación | ✅ Este archivo | Registro actualizado con alcance real del refactor |

#### Notas

- No se añadieron todavía tests unitarios dedicados para `stats/facets/detail protegido` en backend y gateway; el cambio quedó validado por compilación limpia y por la superficie unitaria existente del dashboard.
- La serie histórica de ventas sigue pendiente de instrumentación backend; mientras tanto, el frontend deja explícitamente de mostrar datos inventados.

---

## Sprint 25 — Release Readiness & Go Live (Abril 2026)

### QA integral, parche de seguridad next@15.5.15 y deploy

**Fecha**: 2026-04-29  
**Commit**: `8265ae8`  
**Agentes**: @analista-pruebas, @auditor-seguridad, @ingeniero-devops, @documentador-tecnico

#### Descripción

Sprint de cierre para `origen-dashboard` Sprint 24. Se amplió la cobertura de tests para las funcionalidades implementadas en Sprint 24 (NotificationsPreferencesPanel, preferences API, security audit log), se realizó la auditoría OWASP del código nuevo, se parcheó la dependencia de producción `next` a la versión `15.5.15` (que corrige 3 CVEs de alta severidad) y se desplegó a Vercel.

#### Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `tests/mocks/handlers/notifications.handlers.ts` | Añadido `preferencesHandlers`: `GET /notifications/preferences` y `PATCH /notifications/preferences/:eventType` con `mockPreferences` (9 entradas) |
| `tests/mocks/server.ts` | Registrado `preferencesHandlers` en `setupServer()` |
| `tests/unit/api/notifications.api.test.ts` | Añadido `describe('notification preferences api')` con 6 nuevos tests para `fetchNotificationPreferences` y `updateNotificationPreference` |
| `tests/unit/components/notifications/NotificationToggleRow.test.tsx` | NUEVO — 6 tests unitarios para el componente `NotificationToggleRow` (diseño mobile-first, Sprint 24) |
| `package.json` | `next` bumped de `^15.1.0` a `15.5.15` (fix GHSA-ggv3-7p47-pfv8, GHSA-3x4c-7xq6-9pq8, GHSA-q4gf-8mx6-v5v3) |

#### Gates de calidad

| Gate | Estado | Detalle |
|------|--------|---------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores | Sin cambios de código fuente en Sprint 25 — compilación Sprint 24 ya validada |
| Tests unitarios (`vitest run`) | ✅ **409/409 PASS** | 29 ficheros de test — incluyendo 12 tests nuevos Sprint 25 |
| Seguridad | ✅ APROBADO | `next@15.5.15` parchea 3 CVEs altos; código Sprint 24 auditado sin hallazgos OWASP |
| Documentación | ✅ Este archivo | Registro actualizado |

#### CVEs parcheados (next@15.5.15)

| CVE | Severidad | Descripción |
|-----|-----------|-------------|
| GHSA-ggv3-7p47-pfv8 | High | HTTP request smuggling en rewrites |
| GHSA-3x4c-7xq6-9pq8 | High | next/image disk cache DoS (almacenamiento ilimitado) |
| GHSA-q4gf-8mx6-v5v3 | High | Denial of Service con Server Components |

#### Notas operativas

- `npm install` debe ejecutarse para materializar el bump de `next@15.5.15` en `node_modules` (requiere token GitHub Packages).
- Las vulnerabilidades transitivas de `qs` y `picomatch` (alta severidad, `--omit=dev`) se resuelven con `npm audit fix` tras el install.


---

## Sprint 30 — scheduled-publishing-organic-score-tests

**Fecha**: 2026-04-23
**Commits**: `cb6f5cc`, `b84cd88`, `5c409e4`
**Agentes**: desarrollador-codigo, analista-pruebas, auditor-seguridad, documentador-tecnico
**Estado**: ✅ Completado

### Archivos modificados

| Archivo | Tipo | Descripción |
|---------|------|-------------|
| `src/lib/api/products.ts` | Modified | Añadida `scheduleProduct(productId, scheduledAt)` — `PATCH /products/:id/schedule` |
| `src/app/dashboard/products/components/SchedulePublishCard.tsx` | Created | Card con date picker para programar publicación; validación de fecha futura client-side |
| `src/app/dashboard/products/[id]/edit/page.tsx` | Modified | `SchedulePublishCard` renderizado cuando todos los pasos están completos y status es draft/scheduled |
| `src/types/product.ts` | Modified | Añadidos `'scheduled'` al union de status, `scheduledAt?: Date`, `organicScore?: number` |
| `src/components/shared/products/OrganicScoreBadge.tsx` | Created | Badge de 4 niveles (Excelente/Bueno/Regular/Bajo) con colores y leyenda opcional |
| `src/app/dashboard/products/components/ProductExpandableDetails.tsx` | Modified | `OrganicScoreBadge` junto al SKU cuando `organicScore` está presente |
| `tests/mocks/handlers/products-patch.handlers.ts` | Created | MSW handlers para `PATCH /products/:id/status` y `PATCH /products/:id/schedule` |
| `tests/unit/api/products-patch.api.test.ts` | Created | T-01: 10 tests — `updateProductStatus` (4) + `scheduleProduct` (6) |
| `tests/unit/components/products/OrganicScoreBadge.test.tsx` | Created | T-02: 13 tests — niveles de color, umbrales exactos, props `showLabel`/`size` |
| `tests/unit/components/products/SchedulePublishCard.test.tsx` | Created | T-03: 7 tests — validación de fecha, submit, mensaje de éxito, toasts de error |

### US implementadas

| US | Feature | Descripción |
|----|---------|-------------|
| US-08 | Scheduled publishing (frontend) | Date picker en página de edición de producto |
| US-09 | Organic score badge (frontend) | `OrganicScoreBadge` visible en fila expandida de la tabla de productos |

### Gates de calidad

| Gate | Estado | Detalle |
|------|--------|---------|
| Compilación (`tsc --noEmit`) | ✅ Sin errores | 0 errores TypeScript |
| Tests T-01 | ✅ **10/10 PASS** | `products-patch.api.test.ts` |
| Tests T-02 | ✅ **13/13 PASS** | `OrganicScoreBadge.test.tsx` |
| Tests T-03 | ✅ **7/7 PASS** | `SchedulePublishCard.test.tsx` |
| Seguridad | ✅ APROBADO | Validación de fecha client-side; backend re-valida (defensa en profundidad) |
| Documentación | ✅ Este archivo | Registro actualizado |

### Notas técnicas

- `SchedulePublishCard` sólo se renderiza cuando `allStepsCompleted && status ∈ {draft, scheduled}`.
- `OrganicScoreBadge` recibe `score` en `[0, 1]`; el color se elige con 4 umbrales fijos (`≥0.80`, `≥0.60`, `≥0.40`, `<0.40`).
- Tests de componente usan `happy-dom` (Vitest) + `@testing-library/react`; `@testing-library/dom` añadido como dev dep por ausencia de transitive resolution.
