/**
 * @page ReviewsPage
 * @description Panel principal de gestión de reseñas — "Bosque Comercial" v5.5.
 *
 * Estado de carga unificado con Productos y Pedidos:
 *   - Carga inicial: PageLoader (pantalla completa)
 *   - Recarga por filtros/paginación (isTableLoading):
 *       · Móvil: MobileCardList con renderSkeleton (ReviewCardSkeleton)
 *       · Desktop: ReviewsList con isLoading=true (ReviewsListSkeleton inline)
 *   No se usa overlay con Spinner en ningún caso.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

// Componentes UI
import { PageHeader } from '@/app/dashboard/components/PageHeader';
import { ReviewHeader } from './components/ReviewHeader';
import { ReviewFilters } from './components/ReviewFilters';
import { ReviewsList } from './components/ReviewsList';
import { ReviewCard, ReviewCardSkeleton } from './components/ReviewCard';
import { MobileCardList, Pagination, MobilePullRefresh, toast, PageLoader, PageError } from '@arcediano/ux-library';

// Hooks y API
import { fetchReviews, addReviewResponse, flagReview, markReviewHelpful } from '@/lib/api/reviews';
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
      delayChildren: 0.1,
    },
  },
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function ReviewsPage() {
  const prefersReducedMotion = useReducedMotion() ?? false;

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0.01 }
        : { type: 'spring', stiffness: 300, damping: 25 },
    },
  };

  const [reviews, setReviews]             = useState<Review[]>([]);
  const [stats, setStats]                 = useState<any>(null);
  const [isLoading, setIsLoading]         = useState(true);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [filters, setFilters]             = useState<ReviewFiltersType>({});
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [totalReviews, setTotalReviews]   = useState(0);

  const isFirstLoad = React.useRef(true);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      loadReviews(true);
      return;
    }
    loadReviews(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage]);

  const loadReviews = async (isInitialLoad = false) => {
    if (isInitialLoad) {
      setIsLoading(true);
    } else {
      setIsTableLoading(true);
    }
    setError(null);
    try {
      const response = await fetchReviews({ page: currentPage, limit: 10, filters });
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setReviews(response.data.reviews);
        setStats(response.data.stats);
        setTotalPages(Math.ceil(response.data.meta.total / 10));
        setTotalReviews(response.data.meta.total);
      }
    } catch {
      setError('Error al cargar las reseñas');
    } finally {
      setIsLoading(false);
      setIsTableLoading(false);
    }
  };

  const handleRespond = async (reviewId: string, response: string) => {
    const res = await addReviewResponse(reviewId, { authorId: '', authorName: '', content: response });
    if (res.error) {
      toast({ title: 'Error al responder', description: res.error, variant: 'error' });
    } else {
      toast({ title: 'Respuesta enviada correctamente', variant: 'success' });
      loadReviews();
    }
  };

  const handleFlag = async (reviewId: string, reason?: string) => {
    const validReasons = ['inappropriate', 'spam', 'fake', 'offensive', 'other'] as const;
    const safeReason = validReasons.includes(reason as typeof validReasons[number])
      ? (reason as typeof validReasons[number])
      : 'other';
    const res = await flagReview(reviewId, safeReason);
    if (res.error) {
      toast({ title: 'Error al reportar', description: res.error, variant: 'error' });
    } else {
      toast({ title: 'Reseña reportada', variant: 'success' });
      loadReviews();
    }
  };

  const handleHelpful = async (reviewId: string, helpful: boolean) => {
    const res = await markReviewHelpful(reviewId, helpful);
    if (res.error) {
      toast({ title: 'Error', description: res.error, variant: 'error' });
      return;
    }
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              helpful:    helpful  ? r.helpful    + 1 : r.helpful,
              notHelpful: !helpful ? r.notHelpful + 1 : r.notHelpful,
            }
          : r,
      ),
    );
  };

  const handleFilterChange = (newFilters: ReviewFiltersType) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  // ── Carga inicial: PageLoader de pantalla completa ────────────────────────
  if (isFirstLoad.current && isLoading) return <PageLoader message="Cargando reseñas..." />;

  if (error) return <PageError title="Error al cargar" message={error} onRetry={loadReviews} />;

  const handleRefresh = async () => { await loadReviews(); };

  return (
    <MobilePullRefresh onRefresh={handleRefresh}>
      <>
        {/* Cabecera */}
        <PageHeader
          title="Reseñas"
          description="Gestiona, responde y modera las valoraciones de tus productos y productores"
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
          {/* Cabecera: ReviewSummary (desktop) + 4 KPIs 2×2 */}
          {stats && (
            <motion.div variants={itemVariants}>
              <ReviewHeader stats={stats} isLoading={isTableLoading} />
            </motion.div>
          )}

          {/* Contenido principal: filtros + lista */}
          <motion.div variants={itemVariants}>
            <div className="space-y-5 sm:space-y-6">

              <ReviewFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                totalReviews={totalReviews}
              />

              <div>
                {/* Móvil (< lg): MobileCardList con skeleton */}
                <MobileCardList
                  className="block lg:hidden mb-4"
                  isLoading={isTableLoading}
                  renderSkeleton={() => <ReviewCardSkeleton />}
                  skeletonCount={5}
                >
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onRespond={handleRespond}
                      onFlag={(id) => handleFlag(id)}
                    />
                  ))}
                </MobileCardList>

                {/* Desktop (>= lg): ReviewsList con isLoading skeleton */}
                <div className="hidden lg:block">
                  <ReviewsList
                    reviews={reviews}
                    onRespond={handleRespond}
                    onFlag={handleFlag}
                    onHelpful={handleHelpful}
                    isLoading={isTableLoading}
                    skeletonCount={5}
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
              </div>
            </div>

          </motion.div>
        </motion.div>
      </>
    </MobilePullRefresh>
  );
}
