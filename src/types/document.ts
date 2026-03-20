/**
 * Tipos para documentos legales
 * @module types/document
 */

import type { ProducerCategory } from './seller';

/** Tipos de documentos requeridos para vender en España */
export type DocumentType =
  | 'cif_nie'                  // CIF/NIF/NIE
  | 'rgseaa'                   // Registro Sanitario
  | 'certificado_actividad'    // IAE
  | 'seguro_responsabilidad'   // Seguro RC
  | 'certificado_ecologico'    // Certificación ecológica (opcional)
  | 'igp_dop'                  // IGP/DOP (opcional)
  | 'haccp'                    // Plan APPCC
  | 'manipulador_alimentos'    // Carnet manipulador
  | 'licencia_actividad'       // Licencia municipal
  | 'escrituras_sociedad'      // Escrituras (si es empresa)
  | 'libro_registro'           // Libro de registro
  | 'otros';                   // Otros documentos

/** Estados de un documento */
export type DocumentStatus =
  | 'pending_review'  // Pendiente de revisión
  | 'approved'        // Aprobado
  | 'rejected'        // Rechazado
  | 'expired';        // Caducado

/** Documento subido por el vendedor */
export interface SellerDocument {
  id: string;
  sellerId: string;
  type: DocumentType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  expirationDate?: Date;
}

/** Información de documento requerido */
export interface RequiredDocument {
  type: DocumentType;
  name: string;
  description: string;
  mandatory: boolean;
  appliesToCategories?: ProducerCategory[];
}
