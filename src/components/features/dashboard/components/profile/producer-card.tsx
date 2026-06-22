/**
 * @file producer-card.tsx
 * @description Tarjeta de perfil del productor autenticado.
 * Diseño v2 (2026-06-22): banner como imagen protagonista + logo como avatar
 * superpuesto, siguiendo el patrón Instagram/LinkedIn de cover + profile pic.
 * Conectada a la API real: ProducerProfile (GET /api/v1/producers/me).
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Card,
} from '@arcediano/ux-library';
import { MapPin, CheckCircle2, Clock, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { itemVariants } from '../layout/dashboard-shell';
import type { ProducerProfile, AccountStatus } from '../../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Gradiente de fallback por categoría del productor (HSL inline).
 * Se usa cuando no hay coverImageUrl disponible. Se aplica como estilo
 * inline para garantizar que Tailwind JIT no purgue las clases dinámicas.
 * Los colores referencian los tokens CSS del sistema.
 */
const CATEGORY_GRADIENT_STYLES: Record<string, React.CSSProperties> = {
  'Frutas y verduras': { background: 'linear-gradient(135deg, hsl(155 38% 41% / 0.5), hsl(156 49% 63% / 0.7))' },
  'Quesos': { background: 'linear-gradient(135deg, hsl(45 95% 56% / 0.4), hsl(34 92% 60% / 0.5))' },
  'Vinos': { background: 'linear-gradient(135deg, hsl(156 40% 33% / 0.6), hsl(156 46% 24% / 0.8))' },
  'Aceite de oliva': { background: 'linear-gradient(135deg, hsl(34 92% 60% / 0.4), hsl(31 70% 62% / 0.6))' },
  'Miel': { background: 'linear-gradient(135deg, hsl(45 95% 56% / 0.5), hsl(34 92% 60% / 0.6))' },
  'Embutidos': { background: 'linear-gradient(135deg, hsl(156 40% 33% / 0.5), hsl(156 46% 24% / 0.7))' },
  'Conservas': { background: 'linear-gradient(135deg, hsl(156 49% 63% / 0.4), hsl(155 38% 41% / 0.6))' },
  'Panadería': { background: 'linear-gradient(135deg, hsl(31 70% 62% / 0.5), hsl(34 92% 60% / 0.4))' },
};

const DEFAULT_GRADIENT_STYLE: React.CSSProperties = {
  background: 'linear-gradient(135deg, hsl(156 46% 24%), hsl(156 40% 33%))',
};

function getCategoryGradientStyle(categories?: string[]): React.CSSProperties {
  if (!categories?.length) return DEFAULT_GRADIENT_STYLE;
  return CATEGORY_GRADIENT_STYLES[categories[0]] ?? DEFAULT_GRADIENT_STYLE;
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: AccountStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    AccountStatus,
    { label: string; variant: 'success' | 'warning' | 'danger'; Icon: React.ElementType }
  > = {
    active: {
      label: 'Activa',
      variant: 'success',
      Icon: CheckCircle2,
    },
    pending: {
      label: 'Pendiente',
      variant: 'warning',
      Icon: Clock,
    },
    suspended: {
      label: 'Suspendida',
      variant: 'danger',
      Icon: XCircle,
    },
  };

  const { label, variant, Icon } = config[status];

  return (
    <Badge
      variant={variant}
      size="xs"
      icon={<Icon className="w-3 h-3" aria-hidden="true" />}
      className="shadow-sm"
    >
      {label}
    </Badge>
  );
}

interface CompletenessBarProps {
  percent: number;
}

function CompletenessBar({ percent }: CompletenessBarProps) {
  const clamped = Math.round(Math.min(100, Math.max(0, percent)));

  const barColor =
    clamped < 40
      ? 'bg-feedback-danger'
      : clamped < 70
        ? 'bg-origen-mandarina'
        : 'bg-origen-pradera';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-text-subtle">Perfil completado</span>
        <span className="text-[11px] font-semibold text-origen-bosque">{clamped}%</span>
      </div>
      <div
        className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Completitud del perfil: ${clamped}%`}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

// ─── skeleton ────────────────────────────────────────────────────────────────

function ProducerCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl overflow-hidden border border-border-subtle bg-surface-alt', className)}
    >
      {/* Banner skeleton */}
      <div className="aspect-video bg-border-subtle" />
      {/* Content skeleton */}
      <div className="p-4 pt-8 space-y-2">
        <div className="h-4 w-40 rounded bg-border-subtle" />
        <div className="h-3 w-28 rounded bg-border-subtle" />
        <div className="mt-3 h-1.5 w-full rounded bg-border-subtle" />
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

interface ProducerCardProps {
  producer: ProducerProfile | null;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function ProducerCard({
  producer,
  isLoading = false,
  error = null,
  className,
}: ProducerCardProps) {
  if (isLoading) {
    return (
      <motion.div variants={itemVariants} className={className}>
        <ProducerCardSkeleton />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div variants={itemVariants} className={cn(className)}>
        <p className="text-xs text-feedback-danger">{error}</p>
      </motion.div>
    );
  }

  if (!producer) return null;

  const initials = getInitials(producer.name);
  const isIncomplete = producer.profileCompletenessPercent < 100;
  const categoryGradientStyle = getCategoryGradientStyle(producer.categories);
  const primaryCategory = producer.categories?.[0];

  return (
    <motion.div variants={itemVariants} className={className}>
      {/*
        El Link es el elemento focusable. La clase 'group' está en él
        para que group-hover: aplique correctamente a sus descendientes.
      */}
      <Link
        href="/dashboard/profile"
        className={cn(
          'group block rounded-2xl',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/45 focus-visible:ring-offset-2',
        )}
        aria-label={`Ver perfil de ${producer.name}`}
      >
        <Card
          variant="media"
          padding="none"
          className="cursor-pointer"
          role="article"
        >
          {/* ── Zona de imagen – ratio 16/9 ─────────────────────────── */}
          <div
            className="relative aspect-video overflow-hidden"
            style={!producer.coverImageUrl ? categoryGradientStyle : undefined}
          >
            {/* Banner del productor */}
            {producer.coverImageUrl && (
              <Image
                src={producer.coverImageUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
              />
            )}

            {/* Overlay: gradiente de abajo hacia arriba para legibilidad */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"
              aria-hidden="true"
            />

            {/* Badge de estado – esquina superior derecha */}
            <div className="absolute top-3 right-3">
              <StatusBadge status={producer.accountStatus} />
            </div>

            {/* Avatar (logo) superpuesto – esquina inferior izquierda,
                sobresale 20px hacia el área de contenido */}
            <div className="absolute -bottom-5 left-4">
              <Avatar
                size="lg"
                className="ring-2 ring-white shadow-md"
              >
                {producer.avatarUrl && (
                  <AvatarImage src={producer.avatarUrl} alt={producer.name} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* ── Contenido – pt-8 para compensar el avatar que sobresale ── */}
          <div className="p-4 pt-8">
            {/* Nombre del negocio */}
            <h2 className="font-serif font-semibold text-base text-origen-oscuro leading-tight line-clamp-1">
              {producer.name}
            </h2>

            {/* Localización */}
            {producer.location && (
              <p className="mt-1 flex items-center gap-1 text-xs text-text-subtle">
                <MapPin
                  size={11}
                  className="text-origen-pradera flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="line-clamp-1">{producer.location}</span>
              </p>
            )}

            {/* Categoría y bio */}
            <div className="mt-2.5 flex items-center gap-2 flex-wrap">
              {primaryCategory && (
                <Badge variant="outline" size="xs">
                  {primaryCategory}
                </Badge>
              )}
              {producer.shortBio && (
                <span className="text-xs text-text-subtle line-clamp-1 min-w-0 flex-1">
                  {producer.shortBio}
                </span>
              )}
            </div>

            {/* Barra de completitud del perfil */}
            <div className="mt-4">
              <CompletenessBar percent={producer.profileCompletenessPercent} />
            </div>

            {/* CTA: solo cuando el perfil no está completo */}
            {isIncomplete && (
              <div className="mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-origen-bosque underline underline-offset-2 hover:text-origen-pino transition-colors">
                  Completar perfil
                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                </span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}
