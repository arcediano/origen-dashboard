# Registro de Implementaciones - origen-dashboard

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
