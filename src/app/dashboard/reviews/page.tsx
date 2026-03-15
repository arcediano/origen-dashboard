/**
 * @page ReviewsPage
 * @description Panel principal de gestión de reseñas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Componentes UI
import { PageLoader } from '@/components/shared';
import { PageError } from '@/components/shared';
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ReviewStats } from './components/ReviewStats';
import { ReviewFilters } from './components/ReviewFilters';
import { ReviewsList } from './components/ReviewsList';
import { Pagination } from '@/components/ui/atoms/pagination';

// Hooks y API
import { fetchReviews } from '@/lib/api/reviews'; // Eliminamos approveReview y rejectReview
import type { Review, ReviewFilters as ReviewFiltersType } from '@/types/review';

// ============================================================================
// ANIMACIONES
// ============================================================================

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20 
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: "spring",
      stiffness: 300, 
      damping: 25
    }
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ReviewsPage() {
  const router = useRouter();
  
  // Estados
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  useEffect(() => {
    loadReviews();
  }, [filters, currentPage]);

  const loadReviews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchReviews({
        page: currentPage,
        limit: 10,
        filters
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setTotalPages(Math.ceil(response.data.stats.total / 10));
        setTotalReviews(response.data.stats.total);
      }
    } catch (err) {
      setError('Error al cargar las reseñas');
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleRespond = async (reviewId: string, response: string) => {
    // Aquí iría la llamada a la API para responder
    console.log('Responder a reseña:', reviewId, response);
    // Después de responder, recargar para ver la respuesta
    loadReviews();
  };

  const handleFlag = async (reviewId: string, reason?: string) => {
    // Aquí iría la llamada a la API para reportar
    console.log('Reportar reseña:', reviewId, reason);
    // Después de reportar, recargar para actualizar estado
    loadReviews();
  };

  const handleHelpful = async (reviewId: string, helpful: boolean) => {
    // Aquí iría la llamada a la API para marcar como útil/no útil
    console.log('Marcar como útil:', reviewId, helpful);
    // Actualizar el contador localmente para mejor UX
    setReviews(prevReviews => 
      prevReviews.map(review => 
        review.id === reviewId
          ? { 
              ...review, 
              helpful: helpful ? review.helpful + 1 : review.helpful,
              notHelpful: !helpful ? review.notHelpful + 1 : review.notHelpful
            }
          : review
      )
    );
  };

  const handleFilterChange = (newFilters: ReviewFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (isLoading && !reviews.length) {
    return <PageLoader message="Cargando reseñas..." />;
  }

  if (error) {
    return (
      <PageError
        title="Error al cargar"
        message={error}
        onRetry={loadReviews}
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-6 py-8 space-y-8"
    >
      {/* Cabecera */}
      <PageHeader
        title="Gestión de reseñas"
        description={`${totalReviews} reseñas en total`}
        badgeIcon={MessageSquare}
        badgeText="Reseñas"
        tooltip="Reseñas"
        tooltipDetailed="Gestiona las reseñas de productos y productores, responde a tus clientes y reporta contenido inapropiado."
      />

      {/* Estadísticas */}
      {stats && (
        <motion.div variants={itemVariants}>
          <ReviewStats stats={stats} />
        </motion.div>
      )}

      {/* Filtros */}
      <motion.div variants={itemVariants}>
        <ReviewFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          totalReviews={totalReviews}
        />
      </motion.div>

      {/* Lista de reseñas */}
      <motion.div variants={itemVariants}>
        <ReviewsList
          reviews={reviews}
          onRespond={handleRespond}
          onFlag={handleFlag}
          onHelpful={handleHelpful}
        />

        {/* Paginación */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-6"
          />
        )}
      </motion.div>
    </motion.div>
  );
}