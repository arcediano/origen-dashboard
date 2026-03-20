/**
 * @file seller.ts
 * @description Tipos y configuraciones para el estado del vendedor
 * 
 * @data-services
 * - GET /api/producer/status - Obtener estado actual del productor
 */

import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Pause,
  Rocket 
} from 'lucide-react';

export type SellerStatus = 
  | 'pending_approval'      // Solicitud enviada, pendiente de revisión inicial
  | 'rejected'              // Solicitud rechazada
  | 'approved_access'       // Aprobado, puede empezar onboarding
  | 'onboarding_in_progress' // En medio del proceso de onboarding
  | 'pending_verification'  // Documentos subidos, en verificación
  | 'active'                // Todo verificado, cuenta activa
  | 'suspended'             // Suspendido temporalmente
  | 'deactivated';          // Desactivado permanentemente

export interface SellerStatusConfig {
  label: string;
  message: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'gray';
  nextAction?: {
    label: string;
    href: string;
  };
  icon: React.ElementType;
}

// ─── PRODUCER CATEGORY ───────────────────────────────────────────────────────

export type ProducerCategory =
  | 'agricola'
  | 'ganadero'
  | 'artesano'
  | 'apicultor'
  | 'viticultor'
  | 'especializado';

// ─── TOURISTIC REGION ────────────────────────────────────────────────────────

export interface TouristicRegion {
  id: string;
  name: string;
  province: string;
  description: string;
}

// ─── SELLER ──────────────────────────────────────────────────────────────────

export interface SellerLocation {
  street?: string;
  number?: string;
  postalCode?: string;
  city?: string;
  province?: string;
  autonomousCommunity?: string;
  country?: string;
  touristicRegion?: TouristicRegion;
}

export interface Seller {
  id: string;
  userId: string;
  status: SellerStatus;
  businessName: string;
  slug: string;
  contactName: string;
  email: string;
  phone: string;
  location?: SellerLocation;
  producerCategory: ProducerCategory;
  subcategories: string[];
  stripeAccountId?: string;
  stripeAccountStatus?: string;
  canPublishProducts: boolean;
  canReceivePayments: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const SELLER_STATUS_CONFIG: Record<SellerStatus, SellerStatusConfig> = {
  pending_approval: {
    label: 'Pendiente de aprobación',
    message: 'Tu solicitud está siendo revisada por nuestro equipo',
    color: 'blue',
    icon: Clock
  },
  rejected: {
    label: 'Solicitud rechazada',
    message: 'Tu solicitud no ha sido aprobada',
    color: 'red',
    icon: XCircle,
    nextAction: {
      label: 'Ver detalles',
      href: '/onboarding/rejected'
    }
  },
  approved_access: {
    label: '¡Bienvenido!',
    message: 'Tu solicitud ha sido aprobada. Completa tu registro',
    color: 'green',
    icon: Rocket,
    nextAction: {
      label: 'Continuar registro',
      href: '/onboarding'
    }
  },
  onboarding_in_progress: {
    label: 'Registro incompleto',
    message: 'Continúa con tu registro para activar tu cuenta',
    color: 'yellow',
    icon: AlertCircle,
    nextAction: {
      label: 'Continuar',
      href: '/onboarding'
    }
  },
  pending_verification: {
    label: 'Documentación en revisión',
    message: 'Estamos verificando tus documentos',
    color: 'purple',
    icon: Clock
  },
  active: {
    label: 'Cuenta activa',
    message: 'Tu cuenta está activa y puedes vender',
    color: 'green',
    icon: CheckCircle2
  },
  suspended: {
    label: 'Cuenta suspendida',
    message: 'Tu cuenta ha sido suspendida temporalmente',
    color: 'orange',
    icon: Pause,
    nextAction: {
      label: 'Contactar soporte',
      href: '/soporte'
    }
  },
  deactivated: {
    label: 'Cuenta desactivada',
    message: 'Esta cuenta ha sido desactivada',
    color: 'gray',
    icon: XCircle
  }
};