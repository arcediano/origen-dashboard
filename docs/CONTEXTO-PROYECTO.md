# Contexto de Proyecto - origen-dashboard

**Ultima actualizacion**: 2026-05-28  
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

## UX Pendiente (post-análisis 2026-05-28)

### Componentes a genericizar (handoff → @desarrollador-codigo)

| Prioridad | Componente propuesto | Reemplaza | Destino |
|---|---|---|---|
| 🔴 Alta | `StatGrid` + migrar `SoftStatCard` | `ProductStats`, `OrderStats`, `ReviewStats` | `@arcediano/ux-library` molecules |
| 🔴 Alta | Corrección de tokens `amber`/`blue` | Clases hardcodeadas en Stats | origen-dashboard src |
| 🟡 Media | `PageContainer` (variant: default/gradient/crema/transparent) | Padding/bg inline en páginas | `@arcediano/ux-library` molecules |
| 🟡 Media | `MobileCardList` | Wrapper `div` repetido en products/orders/reviews | `@arcediano/ux-library` atoms |
| 🟡 Media | Extraer `containerVariants`/`itemVariants` → `@/lib/animations.ts` | Framer Motion copiado en 3 páginas | origen-dashboard lib |
| 🟢 Baja | `FilterBar` genérico | `ProductFilters`, `OrderFilters`, `ReviewFilters` | `@arcediano/ux-library` molecules |
| 🟢 Baja | `DataTableCard` wrapper | Table sin Card wrapper | `@arcediano/ux-library` molecules |
| 🟢 Baja | Limpiar props no usados de `PageHeader` | `badgeIcon`, `badgeText`, `tooltip`, `tooltipDetailed` | origen-dashboard src |

### Tokens a corregir

| Componente | Incorrecto | Correcto |
|---|---|---|
| `ProductStats`, `OrderStats` | `text-amber-500`, `from-amber-400/8`, `border-amber-200/60` | `text-origen-mandarina`, `from-origen-mandarina/10`, `border-origen-mandarina/20` |
| `ReviewStats` | `text-blue-500`, `border-blue-200/50` | `text-origen-hoja`, `border-origen-hoja/20` |

### Gaps de accesibilidad pendientes

- Animaciones Framer Motion sin `prefers-reduced-motion`.
- Área táctil 44×44 px pendiente de verificar en `ProductCard` y `ReviewCard` mobile.
- Loading states sin `aria-busy` en contenedores.

> Documento completo: `../../_workspace/docs/actividades/2026-05-28_18-00_analisis-ux-rediseño-dashboard_disenador-ux.md`

## Proximos pasos

1. Implementar `StatGrid` + migrar `SoftStatCard` (🔴 prioridad alta).
2. Corregir tokens hardcodeados `amber`/`blue` en Stats (🔴 prioridad alta).
3. Corregir y validar `JWT_EMAIL_VERIFY_SECRET` en entornos objetivo.
4. Definir ventana de rollback del hotfix temporal tras validacion operativa.
5. Agregar controles preventivos de configuracion y alertado temprano para rutas de registro.
6. Localizar o recrear `_workspace/docs/manual-de-marca-origen.md`.

## Riesgos y notas

- Riesgo residual: alta sin verificacion de email mientras persista el hotfix.
- Limitacion operativa de la sesion: sin consulta de logs Render/Vercel por MCP.

## Enlaces utiles

- Implementations: ./IMPLEMENTATIONS.md
- Runbooks: ./runbooks/
- Actividad multirol por portal: ../../_workspace/docs/actividades/2026-05-24_19-00_contexto-activo-por-portal-multirol_arquitecto-tecnico-documentador-tecnico.md
- Actividades de agentes: ../../_workspace/docs/actividades/
