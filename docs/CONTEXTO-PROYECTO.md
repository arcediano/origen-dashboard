# Contexto de Proyecto - origen-dashboard

**Ultima actualizacion**: 2026-05-24  
**Responsable**: @documentador-tecnico  
**Proyecto**: origen-dashboard/

## Resumen actual

Se registro postmortem P1 por incidente de error 500 en registro (`POST /auth/register`) consumido desde origen-dashboard via gateway hacia origen-master-microservices/auth-service, con hotfix temporal aplicado en backend para continuidad operativa.

## Objetivo de la sesion

- Documentar formalmente el incidente P1 en formato runbook/postmortem.
- Dejar trazabilidad de causa raiz, impacto, fix, riesgo residual y acciones preventivas.

## Estado del proyecto

- Flujo de registro dependiente de origen-gateway y auth-service en origen-master-microservices.
- Incidente mitigado por hotfix de degradacion en auth-service.
- Pendiente saneamiento completo de configuracion de `JWT_EMAIL_VERIFY_SECRET` para retiro del hotfix.

## Archivos clave

- origen-dashboard/docs/runbooks/2026-05-22-origen-dashboard-auth-register-500-postmortem.md: postmortem P1 con timeline, causa raiz, impacto, fix y prevencion.
- origen-master-microservices/src/modules/auth/auth/auth.service.ts: ubicacion del hotfix temporal en bloque verify-email dentro de `register()`.

## Decisiones recientes

- Mantener continuidad del registro aunque falle la emision de verify-email, mediante `try/catch` temporal.
- Tratar el hotfix como mitigacion transitoria con salida condicionada a correccion de entorno.
- En cuentas multirol con membresia de productor, `AuthContext` fuerza `PRODUCER` como rol activo en refresh y post-login mediante `setActiveRole`.

## Proximos pasos

1. Corregir y validar `JWT_EMAIL_VERIFY_SECRET` en entornos objetivo.
2. Definir ventana de rollback del hotfix temporal tras validacion operativa.
3. Agregar controles preventivos de configuracion y alertado temprano para rutas de registro.

## Riesgos y notas

- Riesgo residual: alta sin verificacion de email mientras persista el hotfix.
- Limitacion operativa de la sesion: sin consulta de logs Render/Vercel por MCP.

## Enlaces utiles

- Implementations: ./IMPLEMENTATIONS.md
- Runbooks: ./runbooks/
- Actividad multirol por portal: ../../_workspace/docs/actividades/2026-05-24_19-00_contexto-activo-por-portal-multirol_arquitecto-tecnico-documentador-tecnico.md
- Actividades de agentes: ../../_workspace/docs/actividades/
