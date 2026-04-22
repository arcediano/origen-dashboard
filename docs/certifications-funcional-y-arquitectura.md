# Certificaciones de producto — Análisis funcional y arquitectura

**Versión:** 1.0  
**Fecha:** 2026-04-22  
**Alcance:** Paso 7 del wizard de alta/edición de producto (`StepCertificationsAttributes`) → `origen-gateway` → `products-service` → PostgreSQL (Prisma)

---

## 1. Estado actual

### 1.1 Flujo existente

El componente `StepCertificationsAttributes.tsx` ofrece dos vías para añadir una certificación:

| Vía | Cómo funciona | Problema |
|---|---|---|
| **Buscador de catálogo** | Input con debounce 350 ms → `getCertificationsCatalog()` → lista desplegable. Al seleccionar un ítem llama a `addProductCertification()` (sólo en modo edición) o añade al estado local (creación). | Solo funciona bien en edición. En creación los ítems del catálogo se guardan únicamente como objetos locales sin `certificationId` real; al publicar se envían como si fueran certificaciones manuales, perdiendo el vínculo con el catálogo maestro. |
| **Formulario manual** | Botón "Certificación manual" → formulario inline con nombre, organismo, nº certificado, fechas, estado y `DocumentUploader`. | El campo `category` no existe en el formulario. Las fechas sólo son visibles en el formulario, no en la tarjeta de la lista. El botón "Verificar" (icono `Scan`) ejecuta un `setTimeout` de 1.5 s y marca `verified: true` localmente sin llamar a ningún endpoint real. |

### 1.2 Endpoints disponibles en el backend

| Endpoint | Implementado | Notas |
|---|---|---|
| `GET /products/certifications/catalog` | ✅ | Paginado, filtro `search` + `category`, sólo status `ACTIVE` |
| `POST /products/:id/certifications` | ✅ | Body `{ certificationId }` → crea `ProductCertification` en BD |
| `DELETE /products/:id/certifications/:certificationId` | ✅ | Elimina la relación en `ProductCertification` |
| `PATCH /products/:id/certifications/:certificationId` | ❌ | No existe — no hay forma de actualizar `certificateNumber`, fechas, `documentIds` de una cert asignada |
| `POST /products/certifications` (crear cert nueva en catálogo) | ❌ | No existe — `addCertification()` en `products.service.ts` puede auto-crear una si no hay `certificationId`, pero no hay endpoint dedicado para el flujo "crear + asignar" |
| Gestión de documentos en certificaciones | ❌ | `documentIds` existe en el modelo `ProductCertification` pero no hay endpoints para subir/vincular documentos |
| Verificación real | ❌ | El frontend simula verificación con `setTimeout`; no hay endpoint de revisión ni workflow de aprobación |

### 1.3 Problemas UX identificados

1. **Ambigüedad catálogo vs. manual** — No queda claro para el productor si debe buscar en el catálogo o crear una manual. Ambas opciones coexisten sin jerarquía visual.

2. **Catálogo sin filtro de categoría en la UI** — El endpoint acepta `category` pero el buscador no tiene ningún selector de categoría, lo que obliga a buscar por texto libre.

3. **Catálogo vacío por defecto** — El dropdown de resultados sólo aparece al escribir; no hay sugerencias al hacer foco, sin texto no se ofrece nada.

4. **Pérdida de vínculo `certificationId` en modo creación** — Al seleccionar del catálogo en modo creación, el objeto se añade al estado local con el `id` del catálogo, pero el mapper `formDataToProduct` lo trata igual que una certificación manual. Al guardar el producto (vía `createProduct` o `saveProductDraft`), el backend recibe un array de certificaciones sin `certificationId` válido, por lo que no puede enlazarlas con el catálogo maestro.

5. **Sin feedback sobre qué documentos son necesarios** — El mensaje de "sube los documentos acreditativos" es genérico. No se indica qué documentos son obligatorios según el tipo/categoría de certificación.

6. **Verificación simulada** — El botón `Scan` marca `verified: true` localmente pero no persiste nada en la API. Al recargar el producto, la cert vuelve a `verified: false`.

7. **No se muestran fechas en la vista de lista** — `issueDate` / `expiryDate` son campos del formulario pero no aparecen en la tarjeta de la certificación asignada.

8. **Sin edición de cert asignada en modo edición** — En modo edición, hacer click en el lápiz de una cert abre el formulario pero el botón "Actualizar" sólo modifica el estado local; no llama a ningún endpoint `PATCH`.

---

## 2. Mejoras funcionales propuestas

### 2.1 UX — Flujo de añadir certificación

**Situación deseada:** El productor debe poder asociar a su producto tanto certificaciones del catálogo oficial (DOP, IGP, BIO, etc.) como certificaciones propias no catalogadas. El flujo debe ser claro y sin ambigüedad.

**Diseño propuesto:**

```
┌─────────────────────────────────────────────────────┐
│  Tus certificaciones                    [+ Añadir]  │
├─────────────────────────────────────────────────────┤
│  Modal/Sheet al clicar "+ Añadir":                  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │  🔍 Buscar en el catálogo oficial           │   │
│  │  [ Buscar por nombre u organismo...    ]    │   │
│  │  [ Categoría ▼ ]                           │   │
│  │  ─────────────────────────────────────     │   │
│  │  □ BIO Agricultura Ecológica · ENAC        │   │
│  │  □ DOP Queso Manchego · MAPA               │   │
│  │  □ IFS Food · IFS Management GmbH          │   │
│  │  ─────────────────────────────────────     │   │
│  │  ¿No encuentras la tuya?                   │   │
│  │  [Registrar certificación manual →]        │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

El formulario manual se mueve a una segunda pantalla/step del mismo modal, dejando claro que es el camino alternativo.

### 2.2 Datos adicionales al asignar del catálogo

Al seleccionar una certificación del catálogo, abrir un panel secundario para que el productor complete los datos específicos de su ejemplar:

- Nº de certificado (obligatorio si aplica)
- Fecha de emisión / caducidad
- Documentos acreditativos (PDF, JPG, PNG — máx. 3 archivos, 5 MB c/u)

### 2.3 Estado de verificación claro

| Estado | Significado | Acción disponible |
|---|---|---|
| `pending` | Certificación añadida, sin documentos | Subir documentos |
| `under_review` | Documentos subidos, esperando revisión del equipo Origen | Sin acción (informativo) |
| `active` + `verified: true` | Revisada y aprobada por Origen | Sello de confianza visible |
| `expired` | Fecha de caducidad superada | Renovar / eliminar |

### 2.4 Mostrar fechas y número en tarjeta

La tarjeta de cada cert asignada debe mostrar:
- `certificateNumber` (si existe)
- `issueDate` – `expiryDate` formateadas
- Alerta visual si la cert caduca en menos de 60 días

---

## 3. Arquitectura completa: cliente → gateway → microservicio → BD

### 3.1 Diagrama de capas

```
origen-dashboard (Next.js 15)
  └── StepCertificationsAttributes.tsx
        ├── getCertificationsCatalog()          → GET  /products/certifications/catalog
        ├── addProductCertification()           → POST /products/:id/certifications
        ├── updateProductCertification()  [NEW] → PATCH /products/:id/certifications/:certId
        └── removeProductCertification()        → DELETE /products/:id/certifications/:certId
              ↓
origen-gateway (Express proxy / NestJS)
  └── proxy /products/** → products-service
              ↓
origen-master-microservices / products-service
  ├── CertificationsController   GET  /products/certifications/catalog
  └── ProductsController
        ├── POST   /products/:id/certifications    → products.service.addCertification()
        ├── PATCH  /products/:id/certifications/:certId  [NEW]
        └── DELETE /products/:id/certifications/:certId → products.service.removeCertification()
              ↓
Prisma ORM
  ├── Certification (catálogo maestro)
  └── ProductCertification (tabla de unión — datos específicos del producto)
```

### 3.2 Modelos Prisma actuales

```prisma
model Certification {
  id               String                 @id @default(cuid())
  name             String
  issuingBody      String                 @map("issuing_body")
  category         CertificationCategory?
  logoId           String?                @map("logo_id")
  verificationUrl  String?                @map("verification_url")
  verified         Boolean                @default(false)
  status           CertificationStatus    @default(ACTIVE)
  products         ProductCertification[]
  @@map("certifications")
}

model ProductCertification {
  productId         String    @map("product_id")
  certificationId   String    @map("certification_id")
  certificateNumber String?   @map("certificate_number")
  issueDate         DateTime? @map("issue_date")
  expiryDate        DateTime? @map("expiry_date")
  status            CertificationStatus @default(ACTIVE)
  verified          Boolean   @default(false)
  documentIds       String[]  @map("document_ids")
  @@id([productId, certificationId])
  @@map("product_certifications")
}
```

**Campos existentes que cubren todos los requisitos** — no se necesita migración de esquema para el flujo principal. El campo `documentIds` (array de strings) almacena referencias a documentos gestionados por `docs-service` (o `media-service`).

### 3.3 Gaps de backend a implementar

#### A. `PATCH /products/:id/certifications/:certId`

Permite actualizar los datos de una `ProductCertification` ya existente (número, fechas, documentos, estado).

**DTO propuesto (NestJS):**
```typescript
export class UpdateProductCertificationDto {
  @IsOptional()
  @IsString()
  certificateNumber?: string;

  @IsOptional()
  @IsDateString()
  issueDate?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsEnum(CertificationStatus)
  status?: CertificationStatus;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentIds?: string[];
}
```

**Implementación en `products.service.ts`:**
```typescript
async updateProductCertification(
  productId: string,
  certificationId: string,
  dto: UpdateProductCertificationDto,
): Promise<ProductCertification> {
  return this.prisma.productCertification.update({
    where: { productId_certificationId: { productId, certificationId } },
    data: {
      certificateNumber: dto.certificateNumber,
      issueDate:  dto.issueDate  ? new Date(dto.issueDate)  : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      status:     dto.status,
      documentIds: dto.documentIds,
    },
  });
}
```

#### B. Flujo de documento — integración con `media-service`/`docs-service`

Los documentos acreditativos (PDFs, imágenes de certificados) deben:
1. Subirse a `media-service` o `docs-service` → se obtiene un `documentId`
2. El `documentId` se almacena en `ProductCertification.documentIds[]`
3. Para mostrarlos, se resuelven los IDs contra `media-service`

El `DocumentUploader` del frontend ya gestiona la subida; sólo hace falta que el resultado devuelva el `documentId` y llamar al `PATCH` anterior para persistirlo.

#### C. Flujo de creación: preservar `certificationId` del catálogo

El mapper `formDataToProduct` en `useProductForm.ts` envía `certifications` como array plano. El backend en `products.service.ts` → `addCertification()` ya distingue entre:
- Cert con `certificationId` existente → crea `ProductCertification` directamente
- Cert sin `certificationId` → busca por `name + issuingBody`, si no existe crea la cert maestra y luego la relación

**Problema concreto a corregir en el frontend:** cuando el productor selecciona del catálogo durante la creación, el objeto que se añade al estado debe incluir `certificationId: item.id` (el ID del catálogo). Actualmente `handleSelectFromCatalog` hace:

```typescript
// StepCertificationsAttributes.tsx — línea ~440 (aprox.)
const newCertification: Certification = {
  id: item.id,  // ← este es el ID del catálogo
  name: item.name,
  issuingBody: item.issuingBody,
  ...
};
onCertificationsChange([...certifications, newCertification]);
```

El problema no está en el frontend sino en el mapper del backend. Al recibir `certifications` en `createProduct`, el mapper extrae `id` del objeto pero lo trata como `certificationId` sólo si el campo se llama explícitamente `certificationId`. Hay que alinear el campo:

**Fix en `StepCertificationsAttributes.tsx` (`handleSelectFromCatalog`, modo creación):**
```typescript
const newCertification: Certification & { certificationId?: string } = {
  id: `catalog-${item.id}`,    // ID temporal local
  certificationId: item.id,    // ← el campo que el backend espera
  name: item.name,
  issuingBody: item.issuingBody,
  status: 'pending',
  verified: item.verified,
};
```

**Y en el mapper del backend `products-mapper.ts`**, al transformar `certifications` del body de `createProduct`, leer `certificationId` si existe:
```typescript
// products-mapper.ts — mapProductCertifications()
certifications.map(c => ({
  certificationId: c.certificationId || undefined,
  name:            c.name,
  issuingBody:     c.issuingBody,
  certificateNumber: c.certificateNumber,
  issueDate:       c.issueDate,
  expiryDate:      c.expiryDate,
  status:          c.status,
  documentIds:     c.documentIds ?? [],
}))
```

### 3.4 Workflow de verificación (propuesta)

La verificación real requiere un workflow admin. Propuesta mínima viable:

```
Productor sube documentos
        ↓
ProductCertification.status = 'PENDING'  (ya existe)
ProductCertification.verified = false
        ↓
Admin (origen-admin) lista certs pendientes
  GET /admin/certifications/pending
        ↓
Admin aprueba o rechaza
  PATCH /admin/products/:id/certifications/:certId/verify
  Body: { approved: boolean, notes?: string }
        ↓
products-service actualiza:
  verified = true / false
  status = 'ACTIVE' / 'INACTIVE'
        ↓
Notificación push al productor (notifications-service)
```

Este workflow es independiente de los cambios al wizard y puede implementarse después sin afectar el flujo del productor.

---

## 4. Plan de implementación por prioridad

### P0 — Correcciones críticas (sin estas hay inconsistencias en BD)

| # | Tarea | Archivo |
|---|---|---|
| 1 | Preservar `certificationId` al añadir del catálogo en modo creación | `StepCertificationsAttributes.tsx` |
| 2 | Añadir endpoint `PATCH /products/:id/certifications/:certId` | `products.controller.ts`, `products.service.ts` |
| 3 | Añadir función `updateProductCertification()` en el cliente API | `origen-dashboard/src/lib/api/products.ts` |
| 4 | Conectar "Actualizar" del formulario de edición al nuevo endpoint | `StepCertificationsAttributes.tsx` |
| 5 | Eliminar verificación simulada (`setTimeout`) | `StepCertificationsAttributes.tsx` |

### P1 — Mejoras UX de alta visibilidad

| # | Tarea |
|---|---|
| 6 | Añadir filtro de categoría al buscador del catálogo |
| 7 | Mostrar fechas y `certificateNumber` en tarjeta de cert asignada |
| 8 | Alerta visual si cert caduca en < 60 días |
| 9 | Mostrar sugerencias del catálogo al hacer foco (top 5 sin texto) |

### P2 — Flujo de documentos y verificación real

| # | Tarea |
|---|---|
| 10 | Integrar `DocumentUploader` con `media-service` y persistir `documentIds` |
| 11 | Estado `under_review` en `ProductCertification` (migración) |
| 12 | Endpoints admin de verificación |
| 13 | Notificación al productor tras verificación |

---

## 5. Resumen de cambios por repositorio

### `origen-dashboard`
- `src/app/dashboard/products/components/steps/StepCertificationsAttributes.tsx` — P0 items 1, 4, 5; P1 items 6, 7, 8, 9
- `src/lib/api/products.ts` — P0 item 3: añadir `updateProductCertification()`

### `origen-master-microservices`
- `src/modules/products/products.controller.ts` — P0 item 2: ruta `PATCH`
- `src/modules/products/products.service.ts` — P0 item 2: método `updateProductCertification()`
- `src/modules/products/dto/update-product-certification.dto.ts` — P0 item 2: DTO nuevo
- `prisma/schema.prisma` — P2 item 11: añadir estado `under_review` al enum `CertificationStatus` + campo `reviewNotes`

### `origen-gateway`
- Ningún cambio necesario si el proxy reenvía `PATCH /products/*` sin restricciones (verificar configuración existente).

### `origen-admin`
- P2 item 12: nuevas rutas de verificación (scope independiente)
