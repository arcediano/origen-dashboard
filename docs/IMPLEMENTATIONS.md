# Registro de Implementaciones - origen-dashboard

## [IMPL-006] Follow-up pedidos dashboard: cobertura API de descarga de factura

**Fecha**: 2026-05-28  
**Sprint**: N/A  
**Historia de Usuario**: Pedido/facturacion seller dashboard  
**Proyecto(s) afectado(s)**: origen-dashboard  
**Agentes involucrados**: @desarrollador-codigo, @analista-pruebas

### Resumen

Se extendió la cobertura de tests de la API de pedidos para incluir el endpoint de descarga de factura seller y escenarios de error/permisos.

### Cambios realizados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| tests/mocks/handlers/orders.handlers.ts | Modificado | Nuevo handler MSW `GET /orders/seller/:id/invoice` y fixture backend con `invoice` opcional. |
| tests/unit/api/orders.api.test.ts | Modificado | Nueva suite `fetchSellerOrderInvoice` con casos 200, 403, 404 y factura sin PDF. |

### Validaciones realizadas

1. Diagnósticos TypeScript sin errores en tests modificados.
2. Diagnósticos sin errores a nivel de proyecto (`origen-dashboard`).

### Referencias

- Cliente API: src/lib/api/orders.ts

## [IMPL-005] Dashboard pedidos: contrato seller estable + visualizacion/descarga de factura

**Fecha**: 2026-05-28  
**Sprint**: N/A  
**Historia de Usuario**: Pedido/facturacion seller dashboard  
**Proyecto(s) afectado(s)**: origen-dashboard  
**Agentes involucrados**: @desarrollador-codigo

### Resumen

Se actualizo la capa API y UI de pedidos para tolerar estado backend `confirmed`, mapear `invoice` opcional y habilitar descarga de factura desde el detalle por URL prefirmada. Tambien se agregaron indicadores de factura en lista desktop/movil.

### Cambios realizados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| src/types/order.ts | Modificado | Nuevo tipo `OrderInvoice` y propiedad opcional `invoice` en `Order`. |
| src/lib/api/orders.ts | Modificado | Mapeo de `invoice`, normalizacion de estado `confirmed` y nuevo cliente `fetchSellerOrderInvoice`. |
| src/app/dashboard/orders/[id]/page.tsx | Modificado | Bloque de factura en tarjeta de pago + accion de descarga con manejo de errores. |
| src/app/dashboard/orders/components/OrdersTable.tsx | Modificado | Columna de estado de factura (`Sin factura`, `Borrador`, `Lista`). |
| src/app/dashboard/orders/components/OrderCard.tsx | Modificado | Indicador compacto de factura en tarjeta movil cuando hay PDF. |

### Validaciones realizadas

1. Revision de contrato UI para no romper render si `invoice` es ausente.
2. Integracion de descarga segura solo cuando `hasPdf=true`.
3. Validacion de compilacion TypeScript pendiente de ejecucion de `tsc --noEmit` en esta sesion.

### Referencias

- ADR: ../origen-master-microservices/docs/adr/ADR-013-order-invoices-and-seller-orders-stability.md
- Actividad multiagente: ../../_workspace/docs/actividades/2026-05-28_00-00_implementacion-invoice-por-pedido-dashboard-estabilidad_desarrollador-codigo-analista-pruebas-auditor-seguridad-documentador-tecnico.md

## [IMPL-004] Certificaciones del perfil comercial con estados, descarga y reemplazo con aviso de visibilidad

**Fecha**: 2026-05-28  
**Sprint**: N/A  
**Historia de Usuario**: Perfil comercial / certificaciones  
**Proyecto(s) afectado(s)**: origen-dashboard, origen-master-microservices  
**Agentes involucrados**: @desarrollador-codigo

### Resumen

Se reforzo la pantalla `/dashboard/profile/certifications` para que muestre con mayor claridad el estado de cada certificado y documento legal, permitiendo abrirlos, descargarlos y reemplazarlos con un aviso explicito cuando el archivo actual ya estaba verificado. El cambio de visibilidad publica del productor no se implemento de nuevo en backend porque ya existe en `origen-master-microservices`: al reemplazar un documento verificado, el flujo de onboarding lo lleva a `PENDING_VERIFICATION` y deja `profilePubliclyReady` en `false`.

### Cambios realizados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| src/app/dashboard/profile/certifications/page.tsx | Modificado | Se agrego un resumen documental con conteos de validados, en revision, caducados y rechazados, y se aclaro el impacto del reemplazo sobre la visibilidad del productor. |
| src/app/dashboard/profile/certifications/certification-utils.ts | Nuevo | Helper compartido para estados documentales, deteccion de reemplazo y ventana de caducidad. |
| tests/unit/certification-utils.test.ts | Nuevo | Cobertura unitaria del helper compartido para estados y referencias de documento. |

### Validaciones realizadas

1. `get_errors` sin errores en el archivo modificado.
2. `get_errors` sin errores a nivel de `origen-dashboard`.
3. No se ejecutaron suites `vitest` o `playwright` en esta sesion.

### Referencias

- Flujo backend ya existente: `origen-master-microservices/src/modules/producers/producers/producers.service.ts`

## [IMPL-003] Hotfix P1 en alta de producto por categorias/subcategorias no cargadas

**Fecha**: 2026-05-27  
**Sprint**: N/A  
**Historia de Usuario**: N/A  
**Proyecto(s) afectado(s)**: origen-dashboard  
**Agentes involucrados**: @desarrollador-codigo, @analista-pruebas, @documentador-tecnico

### Resumen

Se aplico hotfix en cliente para recuperar resiliencia en la carga de categorias/subcategorias durante el alta de producto, incorporando parsing tolerante de payload, fallback operativo y senalizacion visible de error en UI.

### Cambios realizados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| src/lib/api/categories.ts | Modificado | `unwrap` de respuesta (`[]` o `{ data: [] }`), fallback `/categories/tree` -> `/categories` y reconstruccion de arbol desde lista plana. |
| src/app/dashboard/products/components/steps/StepBasic.tsx | Modificado | Estado `categoriesError` y aviso visible cuando falla la carga o no hay categorias. |
| docs/runbooks/2026-05-27-origen-dashboard-categorias-producto-postmortem.md | Nuevo | Postmortem P1 con timeline, causa raiz, impacto, fix y acciones preventivas. |

### Validaciones realizadas

1. `get_errors` reportado sin errores en los archivos modificados.
2. Revision de happy-path por agente de pruebas.
3. En esta sesion no se ejecutaron suites `vitest` ni `playwright`.

### Referencias

- Runbook: ./runbooks/2026-05-27-origen-dashboard-categorias-producto-postmortem.md

## [IMPL-002] Limpieza de scripts de package.json para build/deploy

**Fecha**: 2026-05-27  
**Sprint**: N/A  
**Historia de Usuario**: N/A  
**Proyecto(s) afectado(s)**: origen-dashboard  
**Agentes involucrados**: @desarrollador-codigo, @documentador-tecnico

### Resumen

Se simplifico `package.json` para conservar un set minimo de scripts orientados a build y deploy del dashboard.

### Cambios realizados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| package.json | Modificado | Scripts reducidos a `dev`, `build`, `start`, `lint`, `type-check`. |

### Validaciones realizadas

1. Verificacion documental del alcance de limpieza de scripts reportado para el proyecto.
2. En esta sesion no se ejecutaron comandos de tests ni build.

### Referencias

- Solicitud de actualizacion documental: 2026-05-27 (limpieza de scripts orientada a build/deploy).

## [IMPL-001] Postmortem P1 por error 500 en registro via /auth/register

**Fecha**: 2026-05-22  
**Sprint**: N/A  
**Historia de Usuario**: N/A  
**Proyecto(s) afectado(s)**: origen-dashboard, origen-gateway, origen-master-microservices  
**Agentes involucrados**: @documentador-tecnico

### Resumen

Se documento el incidente P1 donde origen-dashboard recibia 500 al consumir `POST /auth/register` a traves de gateway. Se registro causa raiz en auth-service por `JWT_EMAIL_VERIFY_SECRET` faltante/invalido y hotfix temporal aplicado en backend para no interrumpir `register()`.

### Cambios realizados

| Archivo | Tipo | Descripcion |
|---------|------|-------------|
| docs/runbooks/2026-05-22-origen-dashboard-auth-register-500-postmortem.md | Nuevo | Postmortem completo con timeline, causa raiz, impacto, fix aplicado y acciones preventivas. |
| docs/CONTEXTO-PROYECTO.md | Nuevo | Contexto actualizado del incidente, estado y proximos pasos. |

### Tests

| Archivo de test | Suite | Estado |
|----------------|-------|--------|
| N/A | N/A | No aplica (actualizacion documental) |

### Decisiones tomadas

- Registrar hotfix como mitigacion temporal y explicitar riesgo residual de alta sin verify-email.
- Definir retiro del hotfix condicionado a correccion y validacion de entorno para `JWT_EMAIL_VERIFY_SECRET`.

### Referencias

- Actividad: ../../_workspace/docs/actividades/2026-05-22_12-10_postmortem-p1-auth-register_documentador-tecnico.md
- Runbook: ./runbooks/2026-05-22-origen-dashboard-auth-register-500-postmortem.md
