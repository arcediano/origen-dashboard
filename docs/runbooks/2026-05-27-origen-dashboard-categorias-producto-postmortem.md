# Postmortem P1 - origen-dashboard no carga categorias/subcategorias en alta de producto

**Fecha del incidente**: 2026-05-27  
**Severidad**: P1  
**Sistema afectado**: origen-dashboard (`dashboard/products/new`, `StepBasic`)  
**Estado**: Cerrado con hotfix aplicado

## 1) Timeline del incidente

1. Se reporta que en el alta de producto no cargan categorias ni subcategorias en `StepBasic`, bloqueando la finalizacion del flujo.
2. Se identifica que el consumo de `/categories/tree` en cliente asume un shape estricto y no tolera payload envuelto (`{ data: [] }`).
3. Se confirma que el manejo de error retornaba `[]` en silencio, dejando selectores vacios sin senal operativa visible para el usuario.
4. Se define mitigacion: agregar fallback operativo desde `/categories/tree` hacia `/categories` cuando hay fallo o respuesta vacia.
5. Se aplica hotfix en cliente para `unwrap` de payload, fallback y reconstruccion de arbol desde lista plana.
6. Se agrega senalizacion UI de error/estado vacio en `StepBasic` para evitar falla silenciosa.
7. Se valida documentalmente el resultado tecnico con revision de errores y happy-path funcional.

## 2) Causa raiz

La causa raiz fue una combinacion de fragilidad de contrato en cliente y falta de degradacion operativa visible:

- El cliente de categorias asumia una respuesta estricta de `/categories/tree` y no procesaba de forma resiliente respuestas envueltas.
- Ante error, se devolvia `[]` silenciosamente, lo que ocultaba el problema y mantenia los selectores vacios sin feedback.
- No existia estrategia de fallback a `/categories` para preservar continuidad del flujo cuando el endpoint principal fallaba o devolvia vacio.

## 3) Impacto (usuarios afectados, duracion)

- Usuarios afectados: operadores de origen-dashboard que intentaron crear productos durante la ventana del incidente.
- Impacto funcional: imposibilidad de completar el alta por ausencia de categorias/subcategorias seleccionables.
- Duracion: activa hasta la aplicacion del hotfix el 2026-05-27 (la sesion no incluye sello horario exacto de inicio/fin).

## 4) Fix aplicado

### Cambios tecnicos

1. `origen-dashboard/src/lib/api/categories.ts`
   - `unwrap` de payload para soportar `[]` o `{ data: [] }`.
   - fallback de `/categories/tree` a `/categories` cuando falla o retorna vacio.
   - reconstruccion de arbol de categorias a partir de lista plana.

2. `origen-dashboard/src/app/dashboard/products/components/steps/StepBasic.tsx`
   - nuevo estado `categoriesError`.
   - aviso visible cuando la carga falla o no hay categorias disponibles.

### Validacion reportada

- `get_errors` sin errores en archivos modificados.
- Revision happy-path por agente de pruebas.
- En esta sesion no se ejecutaron `vitest` ni `playwright`.

## 5) Acciones preventivas

1. Estandarizar contrato de respuesta de catalogo (`/categories/tree` y `/categories`) con versionado y ejemplos canonicamente documentados.
2. Agregar pruebas unitarias de cliente para parsing resiliente (array directo, payload envuelto, vacio y error).
3. Incorporar prueba de integracion del flujo `dashboard/products/new` para validar carga de categorias en `StepBasic`.
4. Evitar retornos silenciosos en clientes criticos: log estructurado + estado UI explicito ante fallo de carga.
5. Definir metrica/alerta de disponibilidad de endpoints de categorias y de tasa de formularios bloqueados por datos maestros vacios.
