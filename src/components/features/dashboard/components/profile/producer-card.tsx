/**
 * @file producer-card.tsx
 * @description Tarjeta de perfil del productor conectada a la API real.
 * Props: ProducerProfile (GET /api/v1/producers/me) + isLoading + error.
 */

'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/atoms/avatar';
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

// ─── sub-components ───────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: AccountStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config: Record<
    AccountStatus,
    { label: string; className: string; Icon: React.ElementType }
  > = {
    active: {
      label: 'Cuenta activa',
      className:
        'bg-green-50 text-green-700 border border-green-200',
      Icon: CheckCircle2,
    },
    pending: {
      label: 'Verificación pendiente',
      className:
        'bg-amber-50 text-amber-700 border border-amber-200',
      Icon: Clock,
    },
    suspended: {
      label: 'Cuenta suspendida',
      className:
        'bg-red-50 text-red-700 border border-red-200',
      Icon: XCircle,
    },
  };

  const { label, className, Icon } = config[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium',
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{label}</span>
    </div>
  );
}

interface CompletenessBarProps {
  score: number;
}

function CompletenessBar({ score }: CompletenessBarProps) {
  const clamped = Math.min(100, Math.max(0, score));

  const barColor =
    clamped < 40
      ? 'bg-red-400'
      : clamped < 70
        ? 'bg-amber-400'
        : 'bg-origen-pradera';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-text-subtle">
          Completitud del perfil
        </span>
        <span className="text-[11px] font-semibold text-origen-bosque">
          {clamped}%
        </span>
      </div>
      <div
        className="w-full h-1.5 rounded-full bg-border overflow-hidden"
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
      className={cn(
        'flex flex-col lg:flex-row gap-4 items-start animate-pulse',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-border flex-shrink-0" />
        <div className="space-y-2">
          <div className="h-4 w-40 rounded bg-border" />
          <div className="h-3 w-28 rounded bg-border" />
          <div className="h-1.5 w-36 rounded bg-border mt-2" />
        </div>
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
        <p className="text-xs text-red-600">{error}</p>
      </motion.div>
    );
  }

  if (!producer) return null;

  const initials = getInitials(producer.name);
  const isIncomplete = producer.profileCompletenessScore < 100;

  return (
    <motion.div
      variants={itemVariants}
      className={cn('flex flex-col gap-3', className)}
    >
      {/* Row 1: Avatar + name + location */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-4 ring-white shadow-xl flex-shrink-0">
            {producer.avatarUrl && (
              <AvatarImage src={producer.avatarUrl} alt={producer.name} />
            )}
            <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-base sm:text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h2 className="text-base sm:text-xl font-semibold text-origen-bosque truncate">
              {producer.name}
            </h2>

            {producer.location && (
              <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-text-subtle">
                <MapPin className="w-3.5 h-3.5 text-origen-pradera flex-shrink-0" />
                <span>{producer.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status badge — desktop: inline, mobile: below */}
        <div className="hidden sm:flex flex-wrap gap-2 lg:ml-auto">
          <StatusBadge status={producer.accountStatus} />
        </div>
      </div>

      {/* Status badge — mobile */}
      <div className="sm:hidden">
        <StatusBadge status={producer.accountStatus} />
      </div>

      {/* Row 2: profile completeness */}
      <div className="max-w-xs sm:max-w-sm">
        <CompletenessBar score={producer.profileCompletenessScore} />
      </div>

      {/* Row 3: CTA — only when profile is incomplete */}
      {isIncomplete && (
        <div>
          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-origen-bosque hover:text-origen-pino underline underline-offset-2 transition-colors"
          >
            Completar perfil
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}
