# Registro de Implementaciones - origen-dashboard

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
