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
import { ReviewCard, ReviewCardSkeleton } from './components/ReviewCard';
import { Pagination } from '@arcediano/ux-library';

// Hooks y API
import { fetchReviews } from '@/lib/api/reviews';
import type { Review, ReviewFilters as ReviewFiltersType } from '@/types/review';
import { MobilePullRefresh } from '@/components/features/dashboard/components/mobile';

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ReviewsPage() {
  const router = useRouter();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [filters, currentPage]);

  const loadReviews = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchReviews({ page: currentPage, limit: 10, filters });
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setTotalPages(Math.ceil(response.data.stats.total / 10));
        setTotalReviews(response.data.stats.total);
      }
    } catch {
      setError('Error al cargar las reseñas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (reviewId: string, response: string) => {
    console.log('Responder a reseña:', reviewId, response);
    loadReviews();
  };

  const handleFlag = async (reviewId: string, reason?: string) => {
    console.log('Reportar reseña:', reviewId, reason);
    loadReviews();
  };

  const handleHelpful = async (reviewId: string, helpful: boolean) => {
    console.log('Marcar como útil:', reviewId, helpful);
    setReviews(prev =>
      prev.map(r =>
        r.id === reviewId
          ? { ...r, helpful: helpful ? r.helpful + 1 : r.helpful, notHelpful: !helpful ? r.notHelpful + 1 : r.notHelpful }
          : r
      )
    );
  };

  const handleFilterChange = (newFilters: ReviewFiltersType) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  if (isLoading && !reviews.length) return <PageLoader message="Cargando reseñas..." />;

  if (error) return <PageError title="Error al cargar" message={error} onRetry={loadReviews} />;

  const handleRefresh = async () => { await loadReviews(); };

  return (
    <MobilePullRefresh onRefresh={handleRefresh}>
    <>
      {/* Cabecera */}
      <PageHeader
        title="Gestión de reseñas"
        description={`${totalReviews} reseñas en total`}
        badgeIcon={MessageSquare}
        badgeText="Reseñas"
        tooltip="Reseñas"
        tooltipDetailed="Gestiona las reseñas de productos y productores, responde a tus clientes y reporta contenido inapropiado."
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="container mx-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 lg:space-y-8 pb-[calc(88px+env(safe-area-inset-bottom))] sm:pb-8"
      >
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
          <div className="block lg:hidden rounded-2xl border border-border-subtle bg-surface-alt overflow-hidden shadow-subtle mb-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <ReviewCardSkeleton key={i} />)
              : reviews.map((review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onRespond={handleRespond}
                    onFlag={(id) => handleFlag(id)}
                  />
                ))
            }
          </div>

          <div className="hidden lg:block">
            <ReviewsList
              reviews={reviews}
              onRespond={handleRespond}
              onFlag={handleFlag}
              onHelpful={handleHelpful}
            />
          </div>

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
    </>
    </MobilePullRefresh>
  );
}


