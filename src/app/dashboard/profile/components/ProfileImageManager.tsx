/**
 * @file ProfileImageManager.tsx
 * @description Gestor de una galería de imágenes del perfil comercial: añadir varias,
 * previsualizar antes de guardar, sustituir, ordenar (botones accesibles, sin depender
 * de arrastrar), eliminar con opción de deshacer y distinguir lo guardado de lo pendiente.
 *
 * Es un componente controlado: los cambios viven en el estado del formulario padre y no
 * se persisten hasta que el productor pulsa «Guardar» (la subida y el PATCH los hace la
 * página). El primer puesto es la imagen destacada (la que usa la ficha pública como
 * portada de la historia / mosaico).
 */

'use client';

import * as React from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, ImagePlus, Loader2, RefreshCw, Trash2, Undo2 } from 'lucide-react';
import { Alert, AlertDescription, Badge, Button } from '@arcediano/ux-library';
import { cn } from '@/lib/utils';
import {
  buildImageResolutionError,
  getImageDimensions,
  getImageQualityHint,
  type ImageQualityRequirement,
} from '@/lib/validations/image-quality';
import {
  PROFILE_IMAGE_ALLOWED_TYPES,
  PROFILE_IMAGE_MAX_SIZE_MB,
  activeItems,
  appendFiles,
  isPending,
  moveItem,
  removeItem,
  replaceWithFile,
  restoreItem,
  validateImageFileBasics,
  type ProfileImageItem,
} from '@/lib/profile/image-list';

export interface ProfileImageManagerProps {
  /** Prefijo para ids accesibles (único en la página). */
  id: string;
  items: ProfileImageItem[];
  onChange: (items: ProfileImageItem[]) => void;
  max: number;
  /** `false` = solo lectura: se ven las imágenes pero no hay acciones. */
  editable: boolean;
  /** Texto alternativo base; se completa con la posición («… 2»). */
  altPrefix: string;
  /** Texto cuando no hay imágenes y no se está editando. */
  emptyLabel: string;
  qualityRequirement?: ImageQualityRequirement;
  /** Ids que se están subiendo ahora mismo (durante «Guardar»). */
  uploadingIds?: ReadonlySet<string>;
  /** Errores de subida por id de imagen. */
  errors?: Readonly<Record<string, string>>;
  className?: string;
}

const ACCEPT = PROFILE_IMAGE_ALLOWED_TYPES.join(',');

const ICON_BUTTON =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-alt text-origen-bosque transition-colors hover:text-origen-pradera focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-origen-pradera disabled:cursor-not-allowed disabled:opacity-40';

async function validateFile(file: File, requirement?: ImageQualityRequirement): Promise<string | null> {
  const basic = validateImageFileBasics(file);
  if (basic) return basic;
  if (!requirement) return null;
  try {
    const dimensions = await getImageDimensions(file);
    if (
      dimensions.width < requirement.minDimensions.width ||
      dimensions.height < requirement.minDimensions.height
    ) {
      return buildImageResolutionError(file.name, dimensions, requirement);
    }
  } catch {
    return `No hemos podido leer "${file.name}". Prueba con otra imagen.`;
  }
  return null;
}

export function ProfileImageManager({
  id,
  items,
  onChange,
  max,
  editable,
  altPrefix,
  emptyLabel,
  qualityRequirement,
  uploadingIds,
  errors,
  className,
}: ProfileImageManagerProps) {
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const replaceTargetRef = React.useRef<string | null>(null);
  // El validado es asíncrono: se lee siempre la lista más reciente al terminar.
  const itemsRef = React.useRef(items);
  itemsRef.current = items;

  const [messages, setMessages] = React.useState<string[]>([]);
  const [announcement, setAnnouncement] = React.useState('');
  const [isDragging, setIsDragging] = React.useState(false);

  const active = activeItems(items);
  const isFull = active.length >= max;
  const pendingCount = active.filter(isPending).length;

  const handleAdd = async (files: File[]) => {
    if (files.length === 0) return;
    setMessages([]);

    const problems: string[] = [];
    const valid: File[] = [];
    for (const file of files) {
      const problem = await validateFile(file, qualityRequirement);
      if (problem) problems.push(problem);
      else valid.push(file);
    }

    if (valid.length > 0) {
      const result = appendFiles(itemsRef.current, valid, max);
      onChange(result.items);
      if (result.duplicates.length > 0) {
        problems.push(`Ya habías añadido: ${result.duplicates.join(', ')}.`);
      }
      if (result.overflow > 0) {
        problems.push(`Solo caben ${max} fotos en esta galería: ${result.overflow} no se han añadido.`);
      }
      const added = valid.length - result.duplicates.length - result.overflow;
      if (added > 0) setAnnouncement(`${added} ${added === 1 ? 'foto añadida' : 'fotos añadidas'}, pendientes de guardar.`);
    }
    setMessages(problems);
  };

  const handleReplace = async (file: File | undefined) => {
    const targetId = replaceTargetRef.current;
    replaceTargetRef.current = null;
    if (!file || !targetId) return;
    setMessages([]);

    const problem = await validateFile(file, qualityRequirement);
    if (problem) {
      setMessages([problem]);
      return;
    }
    onChange(replaceWithFile(itemsRef.current, targetId, file));
    setAnnouncement('Foto sustituida, pendiente de guardar.');
  };

  const handleMove = (itemId: string, direction: -1 | 1) => {
    const next = moveItem(items, itemId, direction);
    if (next === items) return;
    onChange(next);
    const position = activeItems(next).findIndex((item) => item.id === itemId) + 1;
    setAnnouncement(`Foto movida a la posición ${position} de ${active.length}.`);
  };

  const handleRemove = (itemId: string) => {
    onChange(removeItem(items, itemId));
    setAnnouncement('Foto eliminada. Se borrará al guardar.');
  };

  const handleRestore = (itemId: string) => {
    onChange(restoreItem(items, itemId));
    setAnnouncement('Foto recuperada.');
  };

  const openReplace = (itemId: string) => {
    replaceTargetRef.current = itemId;
    replaceInputRef.current?.click();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!editable || isFull) return;
    void handleAdd(Array.from(event.dataTransfer.files));
  };

  let position = 0;

  return (
    <div className={cn('space-y-3', className)}>
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-subtle">
        <span>
          {active.length} de {max} fotos
        </span>
        {pendingCount > 0 && (
          <Badge variant="warning" size="xs">
            {pendingCount} sin guardar
          </Badge>
        )}
        {qualityRequirement && editable && (
          <span>
            JPG, PNG o WebP · hasta {PROFILE_IMAGE_MAX_SIZE_MB} MB · {getImageQualityHint(qualityRequirement)}
          </span>
        )}
      </div>

      {messages.length > 0 && (
        <Alert variant="error">
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {messages.slice(0, 4).map((message) => (
                <li key={message}>{message}</li>
              ))}
              {messages.length > 4 && <li>…y {messages.length - 4} avisos más.</li>}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {items.length > 0 && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const isRemoved = Boolean(item.removed);
            if (!isRemoved) position += 1;
            const currentPosition = position;
            const isUploading = uploadingIds?.has(item.id) ?? false;
            const error = errors?.[item.id];

            return (
              <li
                key={item.id}
                className={cn(
                  'flex gap-3 overflow-hidden rounded-xl border bg-surface-alt p-2 sm:flex-col sm:gap-2 sm:p-0',
                  isRemoved ? 'border-dashed border-border opacity-70' : 'border-border',
                  error && 'border-feedback-danger',
                )}
              >
                <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg bg-surface sm:w-full sm:rounded-none">
                  {item.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt={isRemoved ? '' : `${altPrefix} ${currentPosition}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-border" aria-hidden="true">
                      <ImagePlus className="h-8 w-8" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-origen-oscuro/50">
                      <Loader2 className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
                      <span className="sr-only">Subiendo foto…</span>
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:px-2 sm:pb-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {!isRemoved && (
                      <span className="text-xs font-semibold text-origen-bosque">Foto {currentPosition}</span>
                    )}
                    {!isRemoved && currentPosition === 1 && (
                      <Badge variant="leaf" size="xs">
                        Destacada
                      </Badge>
                    )}
                    {isPending(item) && !isRemoved && (
                      <Badge variant="warning" size="xs">
                        Sin guardar
                      </Badge>
                    )}
                    {isRemoved && (
                      <Badge variant="outline" size="xs">
                        Se eliminará al guardar
                      </Badge>
                    )}
                  </div>

                  {error && (
                    <p className="flex items-start gap-1 text-xs text-feedback-danger" role="alert">
                      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {error}
                    </p>
                  )}

                  {editable && (
                    <div className="flex flex-wrap gap-1.5">
                      {isRemoved ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftIcon={<Undo2 className="h-4 w-4" />}
                          onClick={() => handleRestore(item.id)}
                        >
                          Deshacer
                        </Button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={ICON_BUTTON}
                            aria-label={`Mover la foto ${currentPosition} antes`}
                            disabled={currentPosition === 1}
                            onClick={() => handleMove(item.id, -1)}
                          >
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={ICON_BUTTON}
                            aria-label={`Mover la foto ${currentPosition} después`}
                            disabled={currentPosition === active.length}
                            onClick={() => handleMove(item.id, 1)}
                          >
                            <ChevronRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={ICON_BUTTON}
                            aria-label={`Sustituir la foto ${currentPosition}`}
                            disabled={isUploading}
                            onClick={() => openReplace(item.id)}
                          >
                            <RefreshCw className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className={cn(ICON_BUTTON, 'text-feedback-danger hover:text-feedback-danger')}
                            aria-label={`Eliminar la foto ${currentPosition}`}
                            disabled={isUploading}
                            onClick={() => handleRemove(item.id)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {items.length === 0 && !editable && <p className="text-sm text-text-subtle">{emptyLabel}</p>}

      {editable && (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isFull) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center transition-colors',
            isDragging ? 'border-origen-pradera bg-origen-pradera/5' : 'border-border',
            isFull && 'opacity-60',
          )}
        >
          <Button
            type="button"
            variant="outline"
            disabled={isFull}
            leftIcon={<ImagePlus className="h-4 w-4" />}
            onClick={() => addInputRef.current?.click()}
          >
            {items.length === 0 ? 'Añadir fotos' : 'Añadir más fotos'}
          </Button>
          <p className="text-xs text-text-subtle">
            {isFull ? `Has alcanzado el máximo de ${max} fotos.` : 'O arrástralas aquí. Se publican al guardar los cambios.'}
          </p>
        </div>
      )}

      <input
        ref={addInputRef}
        id={`${id}-add`}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        aria-label="Añadir fotos"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = '';
          void handleAdd(files);
        }}
      />
      <input
        ref={replaceInputRef}
        id={`${id}-replace`}
        type="file"
        accept={ACCEPT}
        className="hidden"
        aria-label="Sustituir foto"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void handleReplace(file);
        }}
      />
    </div>
  );
}
