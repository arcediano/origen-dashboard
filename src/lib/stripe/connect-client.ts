function isTrustedStripeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'connect.stripe.com';
  } catch {
    return false;
  }
}

/**
 * Abre el Stripe Dashboard para una cuenta Connect.
 * Si la cuenta aún no ha completado el onboarding (details_submitted=false),
 * realiza un fallback a startStripeOnboarding con source='account_payments'.
 *
 * @param stripeAccountId ID de la cuenta de Stripe
 */
export async function openStripeDashboard(stripeAccountId: string): Promise<void> {
  if (!stripeAccountId) {
    throw new Error('stripeAccountId es requerido');
  }

  try {
    const res = await fetch('/api/stripe/connect/dashboard-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stripeAccountId }),
    });

    const json = await res.json() as {
      success: boolean;
      data?: {
        dashboardUrl?: string;
        requiresOnboarding?: boolean;
        restricted?: boolean;
        disabledReason?: string;
      };
      error?: string;
    };

    if (!json.success) {
      throw new Error(json.error ?? 'Error al abrir el panel de Stripe');
    }

    // Si la cuenta está restringida, mostrar error específico
    if (json.data?.restricted) {
      throw new Error(
        'Tu cuenta de Stripe está restringida. Contacta con soporte para más información.'
      );
    }

    // Si la cuenta requiere onboarding, lanzar error
    // (el flujo de onboarding se maneja ahora con Embedded Components)
    if (json.data?.requiresOnboarding) {
      throw new Error(
        'La cuenta debe completar el onboarding de Stripe antes de acceder al dashboard. Ve a la sección de Cobros para continuar.'
      );
    }

    // Abrir el dashboard
    if (json.data?.dashboardUrl) {
      if (!isTrustedStripeUrl(json.data.dashboardUrl)) {
        throw new Error('URL de Stripe no válida');
      }
      window.location.href = json.data.dashboardUrl;
      return;
    }

    throw new Error('No se recibió URL válida del servidor');
  } catch (error) {
    console.error('Error opening Stripe dashboard:', error);
    throw error instanceof Error
      ? error
      : new Error('Error inesperado al abrir el panel de Stripe');
  }
}