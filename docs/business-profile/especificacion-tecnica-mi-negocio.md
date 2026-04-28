# Mi Negocio — Especificación Técnica Completa

**Versión:** 1.0  
**Fecha:** 2026-04-28  
**Autores:** @propietario-producto + @arquitecto-tecnico  
**Revisión:** pendiente @auditor-seguridad antes de implementación  
**Ruta canónica:** `/dashboard/profile/business`  
**Fichero principal:** `origen-dashboard/src/app/dashboard/profile/business/page.tsx`

---

## Índice

1. [Sprints y User Stories](#1-sprints-y-user-stories)
2. [Arquitectura Backend](#2-arquitectura-backend)
3. [Arquitectura Frontend](#3-arquitectura-frontend)
4. [Contratos de API](#4-contratos-de-api)
5. [Análisis de reutilización de componentes](#5-análisis-de-reutilización-de-componentes)
6. [Matriz de riesgos](#6-matriz-de-riesgos)

---

## 1. Sprints y User Stories

### Contexto del problema

La página actual `business/page.tsx` guarda cambios de perfil llamando a `POST /producers/onboarding/step/1`, `step/2` y `step/3`. Esto es semánticamente incorrecto: onboarding es un proceso de alta inicial con side-effects (avance de progreso, notificaciones de bienvenida, creación de registros), mientras que la edición de perfil es una operación idempotente de actualización parcial. Los dos flujos deben estar separados tanto en backend como en frontend.

---

### Sprint 1 — Backend + Modelo de datos (semana 1)

**Objetivo del sprint:** Crear el endpoint `PATCH /producers/profile` independiente del onboarding, extender el GET para incluir visual, y garantizar que los datos del registro inicial estén siempre disponibles en el perfil.

---

#### US-001 — Endpoint PATCH /producers/profile

> Como productor autenticado, quiero que exista un endpoint `PATCH /producers/profile` que actualice mis datos de negocio en un único call, para no depender del flujo de onboarding y no disparar sus side-effects.

**Story Points:** 5

**Criterios de aceptación:**

```
Given: Soy un productor autenticado con token válido
When: Envío PATCH /producers/profile con un body parcial (solo los campos que quiero cambiar)
Then: El backend actualiza únicamente FiscalInfo, ProducerLocation, ProducerStory y/o ProducerVisual
  Y: No se modifica OnboardingProgress ni se disparan notificaciones de onboarding
  Y: La respuesta 200 incluye el perfil completo actualizado
  Y: Si envío un body vacío {}, la respuesta es 200 con los datos sin cambios

Given: Envío PATCH con un campo que falla validación (ej. taxId = "")
When: El backend procesa la petición
Then: La respuesta es 400 con un array de errores de validación por campo

Given: Soy un usuario sin productor vinculado
When: Envío PATCH /producers/profile
Then: La respuesta es 404 con mensaje "Productor no encontrado"
```

**DoD:**
- [ ] `UpdateProducerProfileDto` con class-validator completo (ver §2.1)
- [ ] Método `updateProducerProfile(userId, dto)` en `ProducersService`
- [ ] Handler `PATCH /producers/profile` en `ProducersController`
- [ ] Transacción Prisma si actualiza más de una tabla
- [ ] Tests unitarios del servicio con mocks de Prisma
- [ ] Sin side-effects sobre `OnboardingProgress`
- [ ] `npx tsc --noEmit` limpio

---

#### US-002 — Respuesta unificada del PATCH

> Como productor, quiero que el endpoint PATCH devuelva el perfil actualizado completo tras guardar, para que el frontend pueda sincronizar el estado sin necesitar un segundo GET.

**Story Points:** 2

**Criterios de aceptación:**

```
Given: Envío PATCH /producers/profile con nuevos datos
When: El backend guarda exitosamente
Then: La respuesta 200 incluye { success: true, data: ProducerProfileResponseDto }
  Y: ProducerProfileResponseDto incluye fiscal, location, story y visual con URLs resueltas
  Y: visual.logoUrl y visual.bannerUrl son URLs absolutas (CDN) o null

Given: El productor no tiene logo subido
When: Recibo la respuesta
Then: visual.logoUrl es null (no string vacío, no undefined)
```

**DoD:**
- [ ] `ProducerProfileResponseDto` definido (ver §2.1)
- [ ] `buildImageUrl()` del servicio reutilizado para resolver logoDocId y bannerDocId
- [ ] GET /producers/profile también incluye el campo `visual` con URLs resueltas

---

#### US-003 — Datos del registro inicial pre-cargados

> Como productor, quiero que mis datos del registro inicial (businessName, businessPhone, province, municipio) aparezcan pre-cargados en "Mi Negocio" desde el primer acceso, sin necesidad de haber completado el onboarding.

**Story Points:** 3

**Criterios de aceptación:**

```
Given: Completé el registro inicial pero aún no hice onboarding
When: Abro /dashboard/profile/business
Then: El campo "Nombre del negocio" muestra el businessName del registro
  Y: El campo "Provincia" muestra la provincia del registro
  Y: Los campos vacíos aparecen como vacíos, no con null/undefined visibles

Given: Completé onboarding con businessName diferente al del registro inicial
When: Abro /dashboard/profile/business
Then: Se muestra el businessName de ProducerStory (dato más reciente), con fallback a FiscalInfo
```

**DoD:**
- [ ] `getProducerProfile()` hace fallback a datos del registro inicial si los campos de onboarding están vacíos
- [ ] El frontend mapea correctamente la cadena `story.businessName ?? fiscal.businessName ?? ''`
- [ ] Test de integración que valida el fallback

---

### Sprint 2 — Frontend + UX (semana 2)

**Objetivo del sprint:** Rediseñar completamente la página `business/page.tsx` con arquitectura modular, consumiendo los nuevos endpoints del Sprint 1.

---

#### US-004 — Skeleton de carga

> Como productor, quiero ver un skeleton de carga mientras se obtienen mis datos de negocio, para percibir que la aplicación está respondiendo y no ver un flash de contenido vacío.

**Story Points:** 1

**Criterios de aceptación:**

```
Given: Abro /dashboard/profile/business
When: La petición GET /producers/profile está en vuelo
Then: Se muestra BusinessFormSkeleton con placeholders animados para cada sección
  Y: No se muestra el formulario real hasta que los datos llegan
  Y: Si la petición tarda más de 300ms, el skeleton es visible (no hay flash)

Given: La petición falla con error de red
When: El skeleton termina
Then: Se muestra un Alert de error con mensaje descriptivo y botón "Reintentar"
```

**DoD:**
- [ ] Componente `BusinessFormSkeleton.tsx` con animación pulse de Tailwind
- [ ] El hook `useBusinessProfile` expone `isLoading: boolean`
- [ ] No hay flash de contenido real antes del skeleton

---

#### US-005 — Formulario completo por secciones

> Como productor, quiero poder editar todos los campos de mi negocio en un formulario organizado por secciones colapsables o en tarjetas distintas, para encontrar fácilmente el campo que quiero modificar.

**Story Points:** 5

**Criterios de aceptación:**

```
Given: Estoy en /dashboard/profile/business en modo visualización
When: Presiono "Editar"
Then: Todos los campos del formulario se vuelven editables
  Y: Los campos están agrupados en secciones: Identidad, Contacto y Ubicación, Historia, Visual, Categorías

Given: Estoy en modo edición
When: Presiono "Cancelar"
Then: Los campos vuelven a sus valores originales sin llamada al API
  Y: El estado de modo vuelve a "visualización"

Given: Intento guardar con businessName vacío
When: Presiono "Guardar"
Then: El campo muestra error inline "El nombre del negocio es obligatorio"
  Y: No se hace ninguna llamada al API
```

**Campos obligatorios cubiertos:**
- `businessName`, `taxId`, `phone` (validados)
- `description` (mínimo 50 caracteres)
- `website` (formato URL si se rellena)

**Campos opcionales cubiertos:**
- `tagline`, `productionPhilosophy`, `values[]`
- `entityType`, `legalRepresentativeName`
- `foundedYear`, `teamSize`, `categories[]`
- `street`, `streetNumber`, `streetComplement`, `city`, `province`, `postalCode`
- `instagramHandle`, `website`

**DoD:**
- [ ] Todos los campos del modelo Prisma editables en el formulario
- [ ] Validación client-side antes de llamar al API
- [ ] Modo visualización / edición claramente diferenciados visualmente

---

#### US-006 — Selector de tamaño de equipo

> Como productor, quiero un selector visual de tipo de equipo (teamSize) con las opciones predefinidas, no un campo de texto libre, para no poder introducir valores inválidos.

**Story Points:** 2

**Criterios de aceptación:**

```
Given: Estoy en modo edición
When: Veo el campo "Tamaño del equipo"
Then: Aparece un grupo de botones/chips con opciones: "1-2", "3-5", "6-10", "11+"
  Y: Solo una opción puede estar seleccionada a la vez
  Y: La opción seleccionada tiene estilo visual diferenciado (bg-origen-pradera)

Given: Los datos cargados del API tienen teamSize = "ONE_TWO"
When: Se renderiza el campo
Then: El chip "1-2" aparece seleccionado

Given: Guardo con teamSize = "3-5"
When: El PATCH llega al backend
Then: El DTO contiene teamSize = "THREE_FIVE"
```

**Mapeo frontend → backend:**
| Display | Enum DB |
|---------|---------|
| 1-2 | ONE_TWO |
| 3-5 | THREE_FIVE |
| 6-10 | SIX_TEN |
| 11+ | ELEVEN_PLUS |

**DoD:**
- [ ] Componente de selección con 4 opciones fijas (no Input libre)
- [ ] Mapeo bidireccional display ↔ enum en el hook/cliente API

---

#### US-007 — Campos de dirección separados

> Como productor, quiero que mi dirección de producción tenga campos separados para calle, número, complemento, CP, ciudad y provincia, para poder rellenarlos con precisión sin concatenar en un solo campo de texto.

**Story Points:** 3

**Criterios de aceptación:**

```
Given: Los datos del API tienen street = "Camino Real" y streetNumber = "42"
When: Se carga el formulario
Then: El campo "Calle" muestra "Camino Real" y el campo "Número" muestra "42"
  Y: NO se concatenan en un solo campo

Given: Escribo en el campo "CP" un código postal válido de 5 dígitos
When: El campo pierde el foco
Then: El campo "Provincia" se auto-rellena usando getProvinciaFromCP()
  Y: Si el CP no coincide con la provincia, se muestra un aviso no bloqueante

Given: El campo "Número" está vacío
When: Guardo
Then: El DTO envía streetNumber = "S/N"
```

**DoD:**
- [ ] Eliminado el campo `address` (string concatenado) del estado del formulario
- [ ] Campos separados: `street`, `streetNumber`, `streetComplement`, `city`, `province`, `postalCode`
- [ ] Auto-detección de provincia por CP usando `getProvinciaFromCP` de `@/constants/cp-provincias`
- [ ] La función `splitStreet()` del fichero actual queda eliminada

---

#### US-008 — Logo y banner con preview

> Como productor, quiero ver mi logo y banner actuales al abrir la página y poder actualizarlos con preview en tiempo real, para saber qué imagen tengo subida antes de decidir si cambiarla.

**Story Points:** 3

**Criterios de aceptación:**

```
Given: El API devuelve visual.logoUrl = "https://cdn.origen.es/visual/logo/xxx.jpg"
When: Abro la página
Then: El logo actual se muestra en el área de preview del logo
  Y: No es necesario estar en modo edición para ver el logo actual

Given: Estoy en modo edición y selecciono un nuevo fichero de logo
When: El fichero se sube (POST /media/upload)
Then: La preview se actualiza inmediatamente con la nueva imagen
  Y: El logo anterior sigue visible en el servidor hasta que presione "Guardar"

Given: Presiono "Cancelar" después de haber subido una nueva imagen
When: El modo edición se cancela
Then: La preview vuelve al logo original del servidor
  Y: La nueva imagen subida queda huérfana (media-service la limpia por TTL)
```

**DoD:**
- [ ] `visual.logoUrl` y `visual.bannerUrl` se cargan desde el API al montar el componente
- [ ] Preview inmediata al seleccionar fichero nuevo
- [ ] Cancelar restaura la URL original del servidor

---

#### US-009 — Spinner en botón Guardar

> Como productor, quiero ver un spinner en el botón "Guardar" mientras se procesa la petición, para saber que mi acción fue registrada y evitar clicks múltiples.

**Story Points:** 1

**Criterios de aceptación:**

```
Given: Estoy en modo edición con datos válidos
When: Presiono "Guardar"
Then: El botón muestra un spinner (Loader2 de lucide-react animando)
  Y: El botón queda deshabilitado durante el procesamiento (disabled={isSaving})
  Y: El texto cambia a "Guardando..."

Given: La petición PATCH finaliza (éxito o error)
When: El botón vuelve a su estado normal
Then: El spinner desaparece y el texto vuelve a "Guardar cambios"
```

**DoD:**
- [ ] Estado `isSaving: boolean` del hook controla el botón
- [ ] `disabled` y spinner activos durante isSaving = true
- [ ] No es posible hacer doble-submit

---

#### US-010 — Botones sin salto de línea icono-texto

> Como productor, quiero que los botones con icono no tengan salto de línea entre el icono y el texto en pantallas pequeñas, para que los botones de acción sean legibles en móvil.

**Story Points:** 1

**Criterios de aceptación:**

```
Given: Estoy en un dispositivo con viewport < 375px
When: Veo los botones "Editar", "Guardar cambios", "Cancelar"
Then: El icono y el texto aparecen en la misma línea
  Y: El botón no tiene salto de línea interno

Given: El texto del botón es largo (ej. "Guardar cambios")
When: El viewport es estrecho
Then: El botón puede scrollear horizontalmente dentro de su contenedor, no rompe el layout
```

**Solución técnica:** Aplicar `whitespace-nowrap` + `inline-flex items-center gap-2` en todos los botones de acción de la página.

**DoD:**
- [ ] Todos los botones de la página usan `whitespace-nowrap`
- [ ] Validado en viewport 320px y 375px

---

#### US-011 — Campos Story editables

> Como productor, quiero poder editar mi tagline, filosofía de producción y valores de marca desde "Mi Negocio", para mantener actualizada mi propuesta de valor sin volver al flujo de onboarding.

**Story Points:** 3

**Criterios de aceptación:**

```
Given: El API devuelve story.tagline = "Miel artesanal de la sierra"
When: Abro el formulario en modo edición
Then: El campo "Tagline" muestra "Miel artesanal de la sierra"

Given: Selecciono los valores "Sostenibilidad" y "Artesanal" del selector de valores
When: Guardo
Then: El PATCH envía story.values = ["sostenibilidad", "artesanal"]

Given: El tagline tiene más de 120 caracteres
When: Intento guardar
Then: Se muestra error inline "El tagline no puede superar 120 caracteres"
```

**DoD:**
- [ ] Campos `tagline` (Input, max 120), `productionPhilosophy` (Textarea, max 500), `values[]` (chips seleccionables de CORE_VALUES)
- [ ] Validación de longitud máxima
- [ ] Datos precargados desde `story.*` del API

---

## 2. Arquitectura Backend

### 2.1 DTOs

#### `UpdateProducerProfileDto`

```typescript
// origen-master-microservices/src/modules/producers/producers/dto/update-producer-profile.dto.ts

import {
  IsString, IsOptional, IsEmail, IsUrl, IsEnum, IsInt, IsArray,
  MaxLength, MinLength, Min, Max, ValidateNested, IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum TeamSizeEnum {
  ONE_TWO     = 'ONE_TWO',
  THREE_FIVE  = 'THREE_FIVE',
  SIX_TEN     = 'SIX_TEN',
  ELEVEN_PLUS = 'ELEVEN_PLUS',
}

export enum EntityTypeEnum {
  AUTONOMO         = 'AUTONOMO',
  SL               = 'SL',
  SA               = 'SA',
  COOPERATIVA      = 'COOPERATIVA',
  ASOCIACION       = 'ASOCIACION',
  COMUNIDAD_BIENES = 'COMUNIDAD_BIENES',
}

// ─── Sub-DTOs ─────────────────────────────────────────────────────────────────

class UpdateFiscalDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  taxId?: string;

  @IsOptional()
  @IsEnum(EntityTypeEnum)
  entityType?: EntityTypeEnum;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  legalRepresentativeName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessPhone?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  categories?: string[];

  // Dirección de facturación (opcional — si no viene, se asume misma que producción)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  billingStreet?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  billingStreetNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingStreetComplement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  billingProvince?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  billingPostalCode?: string;
}

class UpdateLocationDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  streetNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  streetComplement?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  postalCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  foundedYear?: number;

  @IsOptional()
  @IsEnum(TeamSizeEnum)
  teamSize?: TeamSizeEnum;
}

class UpdateStoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  businessName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  tagline?: string;

  @IsOptional()
  @IsString()
  @MinLength(50)
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  productionPhilosophy?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  values?: string[];

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  instagramHandle?: string;
}

class UpdateVisualDto {
  @IsOptional()
  @IsString()
  logoDocId?: string;       // Clave S3 devuelta por el media-service

  @IsOptional()
  @IsString()
  bannerDocId?: string;     // Clave S3 devuelta por el media-service
}

// ─── DTO principal ────────────────────────────────────────────────────────────

export class UpdateProducerProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateFiscalDto)
  fiscal?: UpdateFiscalDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateLocationDto)
  location?: UpdateLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateStoryDto)
  story?: UpdateStoryDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateVisualDto)
  visual?: UpdateVisualDto;
}
```

#### `ProducerProfileResponseDto`

```typescript
// origen-master-microservices/src/modules/producers/producers/dto/producer-profile-response.dto.ts

export class ProducerProfileResponseDto {
  fiscal: {
    businessName:            string | null;
    legalName:               string | null;
    taxId:                   string | null;
    entityType:              string | null;
    legalRepresentativeName: string | null;
    businessPhone:           string | null;
    categories:              string[];
    primaryCategory:         string | null;
    whyOrigin:               string | null;
    billingAddress: {
      street:           string | null;
      streetNumber:     string | null;
      streetComplement: string | null;
      city:             string | null;
      province:         string | null;
      postalCode:       string | null;
    } | null;
  } | null;

  location: {
    street:           string | null;
    streetNumber:     string | null;
    streetComplement: string | null;
    city:             string | null;
    province:         string | null;
    postalCode:       string | null;
    foundedYear:      number | null;
    teamSize:         'ONE_TWO' | 'THREE_FIVE' | 'SIX_TEN' | 'ELEVEN_PLUS' | null;
  } | null;

  story: {
    businessName:         string | null;
    tagline:              string | null;
    description:          string | null;
    productionPhilosophy: string | null;
    values:               string[];
    website:              string | null;
    instagramHandle:      string | null;
  } | null;

  visual: {
    logoUrl:   string | null;   // URL absoluta CDN o null
    bannerUrl: string | null;   // URL absoluta CDN o null
  };

  payment: {
    stripeConnected:   boolean;
    stripeAccountId:   string | null;
    acceptedTermsAt:   string | null;
  } | null;
}
```

---

### 2.2 Análisis del GET /producers/profile actual

**Gaps detectados en la implementación actual (`getProducerProfile` en `producers.service.ts`):**

| Campo | Estado actual | Acción requerida |
|-------|--------------|-----------------|
| `fiscal.entityType` | ✅ Incluido | Ninguna |
| `fiscal.legalRepresentativeName` | ✅ Incluido | Ninguna |
| `fiscal.primaryCategory` | ❌ No incluido en select | Añadir al `select` |
| `fiscal.whyOrigin` | ❌ No incluido | Añadir al `select` |
| `story.tagline` | ✅ Incluido | Ninguna |
| `story.productionPhilosophy` | ✅ Incluido | Ninguna |
| `story.values` | ✅ Incluido | Ninguna |
| `visual.logoDocId` | ❌ No incluido | Añadir tabla `visual` al select + resolver URL |
| `visual.bannerDocId` | ❌ No incluido | Añadir tabla `visual` al select + resolver URL |

**Cambio requerido en `getProducerProfile()`:** Añadir `visual` al `select` de Prisma y llamar a `buildImageUrl()` para resolver las URLs antes de devolver la respuesta. El campo `visual` debe incluirse en la respuesta como `{ logoUrl: string | null, bannerUrl: string | null }`.

---

### 2.3 Diseño del servicio `updateProducerProfile`

```typescript
async updateProducerProfile(
  authUserId: number,
  dto: UpdateProducerProfileDto,
): Promise<{ success: true; data: ProducerProfileResponseDto }> {
  // 1. Verificar que el productor existe
  const producer = await this.prisma.producer.findUnique({
    where: { authUserId },
    select: { id: true },
  });
  if (!producer) throw new NotFoundException(`Productor no encontrado para authUserId ${authUserId}`);

  // 2. Ejecutar actualizaciones en transacción
  await this.prisma.$transaction(async (tx) => {
    if (dto.fiscal) {
      await tx.fiscalInfo.upsert({
        where: { producerId: producer.id },
        create: { producerId: producer.id, ...dto.fiscal },
        update: dto.fiscal,
      });
    }

    if (dto.location) {
      await tx.producerLocation.upsert({
        where: { producerId: producer.id },
        create: { producerId: producer.id, ...dto.location },
        update: dto.location,
      });
    }

    if (dto.story) {
      await tx.producerStory.upsert({
        where: { producerId: producer.id },
        create: { producerId: producer.id, ...dto.story },
        update: dto.story,
      });
    }

    if (dto.visual) {
      await tx.producerVisual.upsert({
        where: { producerId: producer.id },
        create: { producerId: producer.id, ...dto.visual },
        update: dto.visual,
      });
    }
  });

  // 3. Devolver perfil actualizado (reutilizar getProducerProfile)
  return this.getProducerProfile(authUserId);
}
```

**Decisiones de diseño:**
- **Transaccionalidad:** Sí, `$transaction` para garantizar atomicidad. Si falla la actualización de `ProducerStory`, no quedan `FiscalInfo` a medias.
- **Upsert vs Update:** Se usa `upsert` porque algunos productores pueden no tener todos los registros relacionados creados (onboarding incompleto). Es más robusto que asumir que existen.
- **Orden de actualización:** `fiscal` → `location` → `story` → `visual`. No hay dependencias entre ellos por FK.
- **Sin side-effects:** No llamar a `advanceOnboardingStep()`, no emitir notificaciones de onboarding, no modificar `OnboardingProgress`.

---

### 2.4 Eventos de dominio

**Decisión: emitir evento `producer.profile_updated`**

**¿Por qué sí?**
- El catálogo público en `origen-web` muestra el logo, banner y descripción del productor. Si se actualizan, la web necesita invalidar la caché del productor.
- En el futuro, el sistema de recomendaciones puede usar cambios de categorías para actualizar la taxonomía.

**Implementación recomendada (diferida, no en Sprint 1):**

El evento se puede emitir de forma asíncrona tras confirmar la transacción, usando el patrón existente de `NotificationsClientService` o un emisor de eventos interno:

```typescript
// Emitir DESPUÉS de la transacción (no dentro de ella)
this.notifications.emitEvent('producer.profile_updated', {
  producerId: producer.id,
  authUserId,
  updatedSections: Object.keys(dto).filter(k => dto[k as keyof typeof dto] !== undefined),
  updatedAt: new Date().toISOString(),
});
```

**Decisión para Sprint 1:** El evento NO se implementa en Sprint 1 para no añadir riesgo. Se añade en Sprint 3 o como tarea técnica separada.

---

### 2.5 Handler en el controlador

```typescript
// En ProducersController

import { Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { UpdateProducerProfileDto } from './dto/update-producer-profile.dto';

/** PATCH /producers/profile */
@Patch('profile')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
async updateProfile(
  @Headers() headers: Record<string, string>,
  @Body() dto: UpdateProducerProfileDto,
) {
  return this.producersService.updateProducerProfile(this.getUserId(headers), dto);
}
```

**Nota:** El `ValidationPipe` debe tener `whitelist: true` para rechazar campos no declarados en el DTO, previniendo mass assignment.

---

## 3. Arquitectura Frontend

### 3.1 Estructura de ficheros

```
origen-dashboard/src/app/dashboard/profile/business/
├── page.tsx                          ← Server Component (metadata + wrapper)
├── BusinessInfoClient.tsx            ← Client Component principal ('use client')
├── components/
│   ├── BusinessIdentitySection.tsx   ← Nombre, CIF, entityType, legalRep
│   ├── ContactLocationSection.tsx    ← Teléfono, web, instagram, dirección separada
│   ├── StorySection.tsx              ← Descripción, tagline, valores, filosofía
│   ├── VisualSection.tsx             ← Logo y banner con upload + preview
│   ├── CategoriesSection.tsx         ← Categorías con chips
│   └── BusinessFormSkeleton.tsx      ← Skeleton loader animado
└── hooks/
    └── useBusinessProfile.ts         ← Lógica de estado + llamadas API
```

```
origen-dashboard/src/lib/api/
└── producers.ts                      ← getProducerProfile / updateProducerProfile
```

---

### 3.2 Hook `useBusinessProfile`

```typescript
// origen-dashboard/src/app/dashboard/profile/business/hooks/useBusinessProfile.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getProducerProfile, updateProducerProfile } from '@/lib/api/producers';
import type { ProducerProfileResponse, UpdateProducerProfilePayload } from '@/lib/api/producers';

type FormState = {
  // fiscal
  businessName: string;
  legalName: string;
  taxId: string;
  entityType: string;
  legalRepresentativeName: string;
  businessPhone: string;
  categories: string[];
  // location (campos separados — sin address concatenado)
  street: string;
  streetNumber: string;
  streetComplement: string;
  city: string;
  province: string;
  postalCode: string;
  foundedYear: string;
  teamSize: '' | '1-2' | '3-5' | '6-10' | '11+';
  // story
  storyBusinessName: string;
  tagline: string;
  description: string;
  productionPhilosophy: string;
  values: string[];
  website: string;
  instagramHandle: string;
  // visual (URLs para preview)
  logoUrl: string | null;
  bannerUrl: string | null;
  // claves S3 de nuevas subidas (pending save)
  newLogoDocId: string | null;
  newBannerDocId: string | null;
};

type UseBusinessProfileReturn = {
  form: FormState;
  initialForm: FormState;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  loadError: string | null;
  saveError: string | null;
  saveSuccess: boolean;
  errors: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setIsEditing: (v: boolean) => void;
  handleSave: () => Promise<void>;
  handleCancel: () => void;
  refetch: () => Promise<void>;
};

export function useBusinessProfile(): UseBusinessProfileReturn {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<FormState>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const response = await getProducerProfile();
      const mapped = mapResponseToForm(response.data);
      setForm(mapped);
      setInitialForm(mapped);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error al cargar perfil.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void fetchProfile(); }, [fetchProfile]);

  const handleCancel = useCallback(() => {
    setForm(initialForm);
    setErrors({});
    setSaveError(null);
    setSaveSuccess(false);
    setIsEditing(false);
  }, [initialForm]);

  const handleSave = useCallback(async () => {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const payload = mapFormToPayload(form);
      const response = await updateProducerProfile(payload);
      const updated = mapResponseToForm(response.data);
      setForm(updated);
      setInitialForm(updated);
      setSaveSuccess(true);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar perfil.');
    } finally {
      setIsSaving(false);
    }
  }, [form]);

  return {
    form, initialForm, isLoading, isSaving, isEditing, loadError,
    saveError, saveSuccess, errors, setForm, setIsEditing,
    handleSave, handleCancel, refetch: fetchProfile,
  };
}
```

---

### 3.3 Cliente API

```typescript
// origen-dashboard/src/lib/api/producers.ts

import { gatewayClient } from './client';
import type { ProducerProfileResponseDto } from './types/producer-profile.types';

export type ProducerProfileResponse = {
  success: true;
  data: ProducerProfileResponseDto;
};

export type UpdateProducerProfilePayload = {
  fiscal?: {
    businessName?: string;
    legalName?: string;
    taxId?: string;
    entityType?: string;
    legalRepresentativeName?: string;
    businessPhone?: string;
    categories?: string[];
    billingStreet?: string;
    billingStreetNumber?: string;
    billingStreetComplement?: string;
    billingCity?: string;
    billingProvince?: string;
    billingPostalCode?: string;
  };
  location?: {
    street?: string;
    streetNumber?: string;
    streetComplement?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    foundedYear?: number;
    teamSize?: 'ONE_TWO' | 'THREE_FIVE' | 'SIX_TEN' | 'ELEVEN_PLUS';
  };
  story?: {
    businessName?: string;
    tagline?: string;
    description?: string;
    productionPhilosophy?: string;
    values?: string[];
    website?: string;
    instagramHandle?: string;
  };
  visual?: {
    logoDocId?: string;
    bannerDocId?: string;
  };
};

export async function getProducerProfile(): Promise<ProducerProfileResponse> {
  return gatewayClient.get<ProducerProfileResponse>('/producers/profile');
}

export async function updateProducerProfile(
  data: UpdateProducerProfilePayload,
): Promise<ProducerProfileResponse> {
  return gatewayClient.patch<ProducerProfileResponse>('/producers/profile', data);
}
```

---

### 3.4 Flujo de datos completo

```
1. Usuario navega a /dashboard/profile/business
   │
   └─► page.tsx (Server Component) renderiza <BusinessInfoClient />

2. BusinessInfoClient monta → useBusinessProfile() inicia
   │
   └─► isLoading = true → renderiza <BusinessFormSkeleton />

3. GET /producers/profile (via gatewayClient)
   │
   ├─► 200 OK: mapResponseToForm() → setForm(mapped) → isLoading = false
   │   └─► Renderiza el formulario en modo visualización con datos reales
   │
   └─► Error: setLoadError(msg) → isLoading = false → Renderiza Alert + botón Reintentar

4. Usuario presiona "Editar"
   └─► setIsEditing(true) → campos del formulario se vuelven editables

5. Usuario modifica campos
   └─► setForm(prev => ({ ...prev, [field]: value }))

5a. Usuario sube nuevo logo/banner
    └─► uploadFile(file, 'visual/logo') → { key, url }
        └─► setForm(prev => ({ ...prev, newLogoDocId: key, logoUrl: url }))

6. Usuario presiona "Guardar"
   │
   └─► validateForm(form)
       ├─► Errores: setErrors(errs) → muestra errores inline, NO hace fetch
       │
       └─► Sin errores:
           │
           ├─► isSaving = true → botón muestra spinner + disabled
           │
           └─► PATCH /producers/profile (mapFormToPayload(form))
               │
               ├─► 200 OK:
               │   ├─► mapResponseToForm(response.data) → actualiza form + initialForm
               │   ├─► setSaveSuccess(true) → Toast de confirmación
               │   ├─► setIsEditing(false)
               │   └─► isSaving = false
               │
               └─► Error (400/403/404/500):
                   ├─► setSaveError(msg) → Alert de error visible
                   └─► isSaving = false (modo edición se mantiene activo)
```

---

### 3.5 `page.tsx` — Server Component wrapper

```typescript
// origen-dashboard/src/app/dashboard/profile/business/page.tsx
import type { Metadata } from 'next';
import { BusinessInfoClient } from './BusinessInfoClient';

export const metadata: Metadata = {
  title: 'Mi Negocio | Origen Dashboard',
  description: 'Gestiona los datos oficiales de tu empresa',
};

export default function BusinessInfoPage() {
  return <BusinessInfoClient />;
}
```

**Ventaja:** Separar el Server Component del Client Component permite que Next.js aplique correctamente la metadata sin marcar el fichero principal como `'use client'`.

---

## 4. Contratos de API

### GET /producers/profile

**Headers:** `x-user-id: {userId}` (inyectado por gateway desde JWT)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "fiscal": {
      "businessName": "Miel Sierra Azul S.L.",
      "legalName": "Sierra Azul Apicultura S.L.",
      "taxId": "B12345678",
      "entityType": "SL",
      "legalRepresentativeName": "Ana García López",
      "businessPhone": "612345678",
      "categories": ["miel", "apicultura"],
      "primaryCategory": "miel",
      "whyOrigin": "Queremos conectar...",
      "billingAddress": {
        "street": "Calle Mayor",
        "streetNumber": "15",
        "streetComplement": "2ºA",
        "city": "Madrid",
        "province": "Madrid",
        "postalCode": "28013"
      }
    },
    "location": {
      "street": "Camino Real",
      "streetNumber": "42",
      "streetComplement": null,
      "city": "Cazorla",
      "province": "Jaén",
      "postalCode": "23470",
      "foundedYear": 2015,
      "teamSize": "ONE_TWO"
    },
    "story": {
      "businessName": "Miel Sierra Azul",
      "tagline": "Miel artesanal de la sierra de Cazorla",
      "description": "Producimos miel ecológica...",
      "productionPhilosophy": "Respeto por las abejas y el entorno...",
      "values": ["sostenibilidad", "artesanal"],
      "website": "https://mielsierra.es",
      "instagramHandle": "@mielsierra"
    },
    "visual": {
      "logoUrl": "https://cdn.origen.es/visual/logo/abc123.jpg",
      "bannerUrl": "https://cdn.origen.es/visual/banner/def456.jpg"
    },
    "payment": {
      "stripeConnected": true,
      "stripeAccountId": "acct_xxx",
      "acceptedTermsAt": "2025-03-15T10:30:00Z"
    }
  }
}
```

**Response 404:**
```json
{ "statusCode": 404, "message": "Productor no encontrado para authUserId X" }
```

**Response 403:**
```json
{ "statusCode": 403, "message": "Falta el header x-user-id" }
```

---

### PATCH /producers/profile

**Headers:** `x-user-id: {userId}`, `Content-Type: application/json`

**Body:** `UpdateProducerProfileDto` (todos los campos opcionales, en secciones anidadas)

**Ejemplo de body (edición parcial):**
```json
{
  "fiscal": {
    "businessPhone": "699123456",
    "taxId": "B12345678"
  },
  "location": {
    "street": "Calle Nueva",
    "streetNumber": "8",
    "city": "Úbeda",
    "province": "Jaén",
    "postalCode": "23400",
    "teamSize": "THREE_FIVE"
  },
  "story": {
    "tagline": "Nueva tagline actualizada",
    "values": ["sostenibilidad", "local"]
  },
  "visual": {
    "logoDocId": "visual/logo/nuevo-logo-key.jpg"
  }
}
```

**Response 200:** Idéntico al `GET /producers/profile` — devuelve el perfil completo actualizado.

**Response 400 (validación):**
```json
{
  "statusCode": 400,
  "message": ["story.tagline must be shorter than or equal to 120 characters"],
  "error": "Bad Request"
}
```

**Response 403:**
```json
{ "statusCode": 403, "message": "Falta el header x-user-id" }
```

**Response 404:**
```json
{ "statusCode": 404, "message": "Productor no encontrado para authUserId X" }
```

---

## 5. Análisis de reutilización de componentes

### 5.1 `CategoryCard` de `@/components/shared`

**Estado:** ✅ **Reutilizable directamente**

- Ubicación: `origen-dashboard/src/components/shared/category-card.tsx`
- Exportado desde: `@/components/shared` (índice compartido)
- Ya reutilizado en `step-location.tsx` y `SimpleRegistration.tsx`
- Props: `{ id, name, icon, selected, onToggle }` — compatible con el selector de categorías de Mi Negocio

**Acción:** Importar directamente desde `@/components/shared`. No duplicar.

```typescript
import { CategoryCard } from '@/components/shared';
```

---

### 5.2 Selector de provincias (`PROVINCIAS_ESPANA` + `getProvinciaFromCP`)

**Estado:** ✅ **Reutilizable — constantes, no componente**

- `PROVINCIAS_ESPANA`: constante exportada desde `@/constants/provinces`
- `getProvinciaFromCP`: función exportada desde `@/constants/cp-provincias`
- Patrón de uso ya establecido en `step-location.tsx` y `SimpleRegistration.tsx`

**Acción:** En `ContactLocationSection.tsx`, aplicar el mismo patrón:

```typescript
import { PROVINCIAS_ESPANA } from '@/constants/provinces';
import { getProvinciaFromCP } from '@/constants/cp-provincias';

// En el handler de CP:
const handlePostalCodeChange = (cp: string) => {
  setForm(prev => ({ ...prev, postalCode: cp }));
  if (cp.length === 5) {
    const detectedProvince = getProvinciaFromCP(cp);
    if (detectedProvince) {
      setForm(prev => ({ ...prev, province: detectedProvince }));
    }
  }
};
```

**Nota:** No existe un componente `<ProvinceSelector />` reutilizable — se usa un `<Select>` de `@arcediano/ux-library` poblado con `PROVINCIAS_ESPANA`. Este patrón debe replicarse igual.

---

### 5.3 `CORE_VALUES` de `step-story.tsx`

**Estado:** ⚠️ **Parcialmente reutilizable — extraer a constante compartida**

- Actualmente está definido como constante local en `step-story.tsx` (línea 44)
- No está exportado ni en `@/constants/` ni en `@/components/shared`

**Acción recomendada (prerequisito del Sprint 2):**

```typescript
// Crear: origen-dashboard/src/constants/producer-values.ts
export const CORE_VALUES = [
  { id: 'sostenibilidad', name: 'Sostenibilidad', icon: 'Leaf', description: 'Compromiso con el medio ambiente' },
  { id: 'calidad',        name: 'Calidad',        icon: 'Award', description: 'Excelencia en cada producto' },
  { id: 'tradicion',      name: 'Tradición',      icon: 'Clock', description: 'Saberes heredados' },
  { id: 'innovacion',     name: 'Innovación',      icon: 'Sparkles', description: 'Nuevas formas de hacer' },
  { id: 'local',          name: 'Local',           icon: 'MapPin', description: 'Cercanía y comunidad' },
  { id: 'artesanal',      name: 'Artesanal',       icon: 'Heart', description: 'Hecho a mano' },
  { id: 'ecologico',      name: 'Ecológico',       icon: 'Sprout', description: 'Respeto por la tierra' },
  { id: 'familiar',       name: 'Familiar',        icon: 'Users', description: 'Negocio de generaciones' },
] as const;
```

Luego actualizar `step-story.tsx` para importar desde ahí. El `StorySection.tsx` de Mi Negocio también importará de la misma fuente. Esto elimina duplicidad de datos.

---

### 5.4 `FileUpload` para logo y banner

**Estado:** ✅ **Reutilizable directamente**

- Ubicación: `origen-dashboard/src/components/shared/upload/file-upload.tsx`
- Exportado desde `@/components/shared`
- Ya usado en `step-visual.tsx` para logo y banner con el mismo propósito

**Props relevantes:**
```typescript
<FileUpload
  value={logoFiles}          // UploadedFile[]
  onChange={handleLogoChange}
  accept="image/*"
  maxFiles={1}
  helperText="PNG o JPG, máx. 2MB"
/>
```

**Diferencia clave con la implementación actual de `business/page.tsx`:**
La implementación actual usa un `<input type="file" ref={logoInputRef}>` propio y llama directamente a `uploadFile()`. Esto debe migrarse al componente `<FileUpload>` que ya gestiona el estado de subida, preview y errores internamente.

**Compatibilidad con URLs existentes del servidor:**
El componente `FileUpload` acepta `value: UploadedFile[]`. Para mostrar el logo/banner existente al cargar la página, se debe mapear la URL del servidor a un objeto `UploadedFile`:

```typescript
const existingLogoFile: UploadedFile | undefined = form.logoUrl
  ? { id: 'existing-logo', url: form.logoUrl, name: 'logo-actual', size: 0, type: 'image/jpeg' }
  : undefined;
```

---

### 5.5 Resumen de reutilización

| Componente/constante | ¿Reutilizable? | Acción |
|---------------------|----------------|--------|
| `CategoryCard` | ✅ Sí — directo | `import { CategoryCard } from '@/components/shared'` |
| `PROVINCIAS_ESPANA` | ✅ Sí — constante | `import { PROVINCIAS_ESPANA } from '@/constants/provinces'` |
| `getProvinciaFromCP` | ✅ Sí — función | `import { getProvinciaFromCP } from '@/constants/cp-provincias'` |
| `FileUpload` | ✅ Sí — directo | `import { FileUpload } from '@/components/shared'` |
| `CORE_VALUES` | ⚠️ Extraer primero | Mover a `@/constants/producer-values.ts`, luego importar |
| `Select` (provincias) | ✅ Via UX Library | `import { Select } from '@arcediano/ux-library'` |
| `splitStreet()` | ❌ Eliminar | Reemplazar por campos separados (US-007) |

---

## 6. Matriz de riesgos

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|-------------|---------|-----------|
| R1 | **Regresión en onboarding** — El PATCH /producers/profile comparte la tabla con onboarding; un bug podría corromper datos | Media | Alto | Tests de integración separados para onboarding y profile edit. Verificar que `advanceOnboardingStep` no se llama desde `updateProducerProfile`. |
| R2 | **URLs de imágenes rotas** — Si `AWS_CDN_BASE_URL` no está configurada en Render, `buildImageUrl()` devuelve URL inválida | Alta (ya ocurre) | Medio | Validar en `getProducerProfile()` que la URL generada es accesible. Devolver `null` si la env var no está configurada. Añadir a `.env.example`. |
| R3 | **Imágenes huérfanas en S3** — El usuario sube logo, cancela sin guardar → imagen queda en S3 sin referencia en DB | Alta | Bajo | Aceptable en Sprint 2. Sprint 3: implementar TTL de limpieza en media-service para keys no referenciados tras 24h. |
| R4 | **`address` concatenado en datos legacy** — Productores que guardaron su dirección como string en el campo legacy `address` no tienen `street` + `streetNumber` separados | Alta | Medio | `getProducerProfile()` incluye ambos campos. Frontend usa `street ?? ''` y `streetNumber ?? ''`. Nunca llamar a `splitStreet()` en el nuevo código. |
| R5 | **Validación de teamSize en backend** — Si el frontend envía `"1-2"` (display) en lugar de `"ONE_TWO"` (enum), el backend rechaza con 400 | Media | Medio | El `mapFormToPayload()` del hook hace la conversión. Test unitario para el mapper. |
| R6 | **Conflicto de rutas en el controlador** — `PATCH /producers/profile` vs `GET /producers/profile` en el mismo controlador; posible colisión con rutas `/producers/:code` | Baja | Alto | Declarar `PATCH profile` **antes** de cualquier ruta con parámetros dinámicos (`/:code`, `/:id`). Verificar orden en el controlador. |
| R7 | **Race condition al guardar logo+perfil** — El usuario sube logo, luego presiona Guardar antes de que `uploadFile()` termine | Baja | Medio | En `VisualSection.tsx`, deshabilitar el botón "Guardar" mientras `isUploadingVisual = true`. |
| R8 | **Pérdida de campos no cubiertos en el formulario** — Si el PATCH solo envía los campos del formulario, campos que el usuario no toca (ej. `whyOrigin`) no se modifican | Baja | Bajo | El DTO usa `@IsOptional()` en todos los campos. El servicio hace update parcial (solo los campos presentes). Los campos no enviados no se tocan. |

---

## Apéndice: Archivos a crear/modificar

### Backend (`origen-master-microservices/`)
| Fichero | Acción |
|---------|--------|
| `src/modules/producers/producers/dto/update-producer-profile.dto.ts` | ✨ Crear |
| `src/modules/producers/producers/dto/producer-profile-response.dto.ts` | ✨ Crear |
| `src/modules/producers/producers/producers.service.ts` | 🔧 Añadir `updateProducerProfile()` + extender `getProducerProfile()` con `visual` |
| `src/modules/producers/producers/producers.controller.ts` | 🔧 Añadir handler `PATCH /producers/profile` |

### Frontend (`origen-dashboard/`)
| Fichero | Acción |
|---------|--------|
| `src/app/dashboard/profile/business/page.tsx` | 🔧 Convertir a Server Component (solo metadata + render `<BusinessInfoClient>`) |
| `src/app/dashboard/profile/business/BusinessInfoClient.tsx` | ✨ Crear — Client Component principal |
| `src/app/dashboard/profile/business/components/BusinessIdentitySection.tsx` | ✨ Crear |
| `src/app/dashboard/profile/business/components/ContactLocationSection.tsx` | ✨ Crear |
| `src/app/dashboard/profile/business/components/StorySection.tsx` | ✨ Crear |
| `src/app/dashboard/profile/business/components/VisualSection.tsx` | ✨ Crear |
| `src/app/dashboard/profile/business/components/CategoriesSection.tsx` | ✨ Crear |
| `src/app/dashboard/profile/business/components/BusinessFormSkeleton.tsx` | ✨ Crear |
| `src/app/dashboard/profile/business/hooks/useBusinessProfile.ts` | ✨ Crear |
| `src/lib/api/producers.ts` | ✨ Crear (nuevo cliente — no editar `onboarding.ts`) |
| `src/constants/producer-values.ts` | ✨ Crear (extraído de `step-story.tsx`) |

---

*Documento generado por @propietario-producto + @arquitecto-tecnico. Listo para revisión de @auditor-seguridad antes de asignación al @desarrollador-codigo.*
