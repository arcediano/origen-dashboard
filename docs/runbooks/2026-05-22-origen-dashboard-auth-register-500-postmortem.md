# Postmortem P1 - origen-dashboard recibe 500 en POST /auth/register

**Fecha del incidente**: 2026-05-22  
**Severidad**: P1  
**Servicios involucrados**: origen-dashboard, origen-gateway, origen-master-microservices (auth-service)  
**Estado**: Cerrado con hotfix temporal aplicado

## Timeline del incidente

1. Se detecta error 500 en el flujo de alta desde origen-dashboard al invocar `POST /auth/register` por medio de gateway.
2. Gateway registra respuesta upstream 500 proveniente de `https://origen-master.onrender.com/auth/register`.
3. Se analiza trazabilidad del flujo de registro en auth-service y se identifica fallo en la generacion del token de verify-email durante `register()`.
4. Se aplica hotfix en auth-service para encapsular el bloque de verify-email en `try/catch` y evitar que la falla interrumpa el alta.
5. Se valida cierre operativo del incidente con continuidad del registro y se documenta riesgo residual.

## Causa raiz

La causa raiz fue una falta o configuracion invalida de `JWT_EMAIL_VERIFY_SECRET` en auth-service.

Tecnica y funcionalmente, el error se materializa como `InternalServerErrorException` en `getEmailVerifySecret()`, metodo utilizado durante `register()` para crear el token de `verify-email`. Al fallar ese paso, el registro quedaba abortado con 500.

## Impacto

- Usuarios de origen-dashboard no podian completar el registro cuando el flujo alcanzaba la generacion de token de verificacion de email.
- Gateway propagaba un 500 al cliente al recibir falla upstream desde origen-master.
- Afectacion directa de conversion en onboarding durante la ventana del incidente.

## Fix aplicado

Se aplico hotfix en:

- `origen-master-microservices/src/modules/auth/auth/auth.service.ts`

Cambio realizado:

- El bloque de verify-email fue encapsulado en `try/catch` para no interrumpir `register()` ante fallas de configuracion asociadas al secreto de verificacion.

Evidencia tecnica asociada:

- Gateway reporto upstream 500 desde `https://origen-master.onrender.com/auth/register`.
- El stack funcional coincide con excepcion interna en `getEmailVerifySecret()` durante la emision del token de verify-email.

## Acciones preventivas

1. Corregir y validar `JWT_EMAIL_VERIFY_SECRET` en todos los entornos (local, preview, produccion) con checklist de paridad de variables.
2. Agregar health check/config check de arranque para secretos criticos, incluyendo `JWT_EMAIL_VERIFY_SECRET`, con fail-fast controlado y mensaje operativo claro.
3. Incluir prueba automatizada de registro con modo degradado para asegurar que fallo en envio/creacion de verify-email no bloquee alta.
4. Definir observabilidad minima para errores de seguridad/config en auth-service (metrica + alerta por tasa de 5xx en `POST /auth/register`).
5. Documentar policy de rollback del hotfix una vez regularizado el entorno:
   - Riesgo residual actual: alta sin email de verificacion.
   - Timebox: retirar hotfix temporal cuando el env este correcto y validado en preview + produccion.

## Riesgo residual y decisiones operativas

- Riesgo residual activo: posibilidad de alta sin verificacion de email mientras se mantenga el hotfix degradado.
- Decision: mantener hotfix por tiempo acotado para proteger disponibilidad del registro.
- Criterio de salida: rollback del hotfix en cuanto `JWT_EMAIL_VERIFY_SECRET` quede estable y validado operacionalmente.

## Limitaciones de esta investigacion

En este canal no se consultaron logs de Render/Vercel por MCP, por lo que la evidencia de observabilidad se basa en traza funcional reportada y en inspeccion de codigo/documentacion disponible.
