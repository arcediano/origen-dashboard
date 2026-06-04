/** Acepta claves S3 con prefijo producers/{id}/documents/ (formato del media-service)
 *  y claves legacy documents/ para backward compatibility. Bloquea path traversal. */
const DOCUMENT_KEY_REGEX = /^(producers\/[\w\-]+\/)?documents\/[\w\-.\/]+$/;
