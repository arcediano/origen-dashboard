/**
 * @file producer-card.tsx
 * @description Tarjeta de perfil del productor
 */

'use client';

import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/atoms/avatar';
import { MapPin, Calendar, Shield, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { itemVariants } from '../layout/dashboard-shell';
import type { Producer } from '../../types';
import { getProducerInitials, getYearsOfExperience } from '@/components/features/dashboard/data/mock-producer';

interface ProducerCardProps {
  producer: Producer;
  className?: string;
}

export function ProducerCard({ producer, className }: ProducerCardProps) {
  const yearsOfExperience = getYearsOfExperience(producer.foundedYear);
  const initials = getProducerInitials(producer.businessName);

  return (
    <motion.div
      variants={itemVariants}
      className={cn('flex flex-col lg:flex-row gap-4 items-start', className)}
    >
      {/* Avatar + Info */}
      <div className="flex items-center gap-3">
        <Avatar className="w-12 h-12 sm:w-16 sm:h-16 ring-4 ring-white shadow-xl flex-shrink-0">
          {producer.logoUrl && <AvatarImage src={producer.logoUrl} alt={producer.businessName} />}
          <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-base sm:text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h2 className="text-base sm:text-xl font-semibold text-origen-bosque truncate">
            {producer.businessName}
          </h2>
          <div className="flex items-center gap-1.5 mt-1 text-xs sm:text-sm text-text-subtle flex-wrap">
            <MapPin className="w-3.5 h-3.5 text-origen-pradera flex-shrink-0" />
            <span>{producer.city}, {producer.province}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <Calendar className="w-3.5 h-3.5 text-origen-pradera flex-shrink-0" />
            <span>{yearsOfExperience} años</span>
          </div>
        </div>
      </div>

      {/* Badges — ocultos en móvil para no crear ruido visual */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {producer.certifications.map(cert => (
          <div
            key={cert.id}
            className="inline-flex items-center gap-2 bg-origen-pradera/10 text-origen-bosque rounded-full px-4 py-2 border border-origen-pradera/30"
          >
            <Shield className="w-4 h-4 text-origen-pradera" />
            <span className="text-sm font-medium whitespace-nowrap">{cert.name}</span>
          </div>
        ))}
        
        {producer.verified && (
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-2 border border-green-200">
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium whitespace-nowrap">Verificado</span>
          </div>
        )}
      </div>

      {/* Badge verificado compacto — solo móvil */}
      {producer.verified && (
        <div className="sm:hidden inline-flex items-center gap-1.5 bg-green-50 text-green-700 rounded-full px-3 py-1 border border-green-200">
          <Award className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">Verificado</span>
        </div>
      )}
    </motion.div>
  );
}
