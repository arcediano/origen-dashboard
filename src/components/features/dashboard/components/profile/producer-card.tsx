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
import { getProducerInitials, getYearsOfExperience } from '@/components/features/dashboard/data';

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
      className={cn('flex flex-col lg:flex-row gap-6 items-start', className)}
    >
      {/* Avatar + Info */}
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16 ring-4 ring-white shadow-xl">
          {producer.logoUrl && <AvatarImage src={producer.logoUrl} alt={producer.businessName} />}
          <AvatarFallback className="bg-gradient-to-br from-origen-pradera to-origen-hoja text-white text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold text-origen-bosque">
            {producer.businessName}
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <MapPin className="w-4 h-4 text-origen-pradera" />
            <span>{producer.city}, {producer.province}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <Calendar className="w-4 h-4 text-origen-pradera" />
            <span>{yearsOfExperience} años</span>
          </div>
        </div>
      </div>

      {/* Badges de certificaciones */}
      <div className="flex flex-wrap gap-2">
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
    </motion.div>
  );
}
