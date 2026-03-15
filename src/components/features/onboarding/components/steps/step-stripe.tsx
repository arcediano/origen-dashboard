// 📁 /src/components/onboarding/steps/EnhancedStep6Stripe.tsx
/**
 * @file EnhancedStep6Stripe.tsx
 * @description Paso 6: Configuración de pagos - VERSIÓN CORREGIDA
 * @version 4.0.0 - Checkbox funcional, sin redes sociales ni web
 */

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/atoms/button';
import { Checkbox } from '@/components/ui/atoms/checkbox';

import {
  CreditCard,
  Shield,
  CheckCircle2,
  ArrowRight,
  Lock,
  Zap,
  Info
} from 'lucide-react';

// ============================================================================
// TIPOS
// ============================================================================

export interface EnhancedStep6StripeData {
  stripeConnected: boolean;
  acceptTerms: boolean;
}

export interface EnhancedStep6StripeProps {
  data: EnhancedStep6StripeData;
  onChange: (data: EnhancedStep6StripeData) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export function EnhancedStep6Stripe({ data, onChange }: EnhancedStep6StripeProps) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  // ========================================================================
  // MANEJADORES
  // ========================================================================
  
  const handleConnect = async () => {
    setIsConnecting(true);
    // Simulación de conexión con Stripe
    await new Promise(resolve => setTimeout(resolve, 2000));
    onChange({ ...data, stripeConnected: true });
    setIsConnecting(false);
  };

  const handleTermsChange = (checked: boolean | 'indeterminate') => {
    onChange({ 
      ...data, 
      acceptTerms: checked === true 
    });
  };

  // ========================================================================
  // VALIDACIÓN
  // ========================================================================
  
  const isComplete = data.stripeConnected && data.acceptTerms;

  // ========================================================================
  // RENDER
  // ========================================================================
  
  return (
    <div className="space-y-6">
      
      {/* ====================================================================
          PROGRESS BAR
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-origen-pradera animate-pulse" />
            <span className="text-sm font-medium text-origen-hoja">Configuración de pagos</span>
          </div>
          <span className="text-sm font-semibold text-origen-pradera">
            {data.stripeConnected ? '1/1' : '0/1'}
          </span>
        </div>
        <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden">
          <div 
            className="h-full bg-origen-pradera rounded-full transition-all duration-700"
            style={{ width: `${data.stripeConnected ? 100 : 0}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-origen-pradera" />
          Conecta Stripe para recibir pagos de forma segura
        </p>
      </div>

      {/* ====================================================================
          CARD 1: CONEXIÓN STRIPE
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-origen-pradera/20 to-origen-hoja/20 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-origen-pradera" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-origen-bosque">Conecta Stripe</h2>
            <p className="text-sm text-gray-600">
              Procesa pagos con tarjeta, transferencia y métodos locales
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          
          <div className="w-20 h-20 rounded-2xl bg-origen-pradera/10 flex items-center justify-center mb-6">
            <Zap className="w-10 h-10 text-origen-pradera" />
          </div>

          <div className="space-y-2 mb-8">
            <p className="text-lg font-semibold text-origen-bosque">
              Stripe Connect
            </p>
            <p className="text-sm text-gray-600">
              Comisión transparente del <span className="font-semibold text-origen-pradera">1.4% + 0.25€</span> por transacción
            </p>
            <p className="text-xs text-gray-500">
              Sin cuotas mensuales · Sin permanencia
            </p>
          </div>

          {data.stripeConnected ? (
            <div className="w-full p-5 bg-origen-crema/50 rounded-xl border border-origen-pradera/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-origen-pradera/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-origen-pradera" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-origen-bosque">
                    Cuenta conectada correctamente
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Stripe está configurado y listo para recibir pagos
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-origen-bosque hover:bg-origen-pino text-white h-12 mb-6"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Conectando con Stripe...
                </>
              ) : (
                <>
                  Conectar con Stripe
                </>
              )}
            </Button>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="w-3.5 h-3.5" />
            <span>Conexión segura · Cifrado SSL</span>
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARD 2: TÉRMINOS Y CONDICIONES
      ==================================================================== */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm hover:shadow-md hover:border-origen-pradera/30 transition-all">
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Checkbox
              id="accept-terms"
              checked={data.acceptTerms}
              onCheckedChange={handleTermsChange}
              disabled={!data.stripeConnected}
              className={cn(
                "h-5 w-5 rounded-md border-2",
                !data.stripeConnected && "opacity-50 cursor-not-allowed"
              )}
            />
          </div>
          <div className="flex-1">
            <label 
              htmlFor="accept-terms"
              className={cn(
                "text-sm font-medium text-origen-bosque cursor-pointer",
                !data.stripeConnected && "opacity-50 cursor-not-allowed"
              )}
            >
              Acepto los términos y condiciones de Stripe
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Stripe es nuestro proveedor de pagos autorizado. Al conectar tu cuenta, 
              aceptas los{" "}
              <a 
                href="#" 
                className="text-origen-pradera hover:text-origen-bosque underline underline-offset-2"
                onClick={(e) => e.preventDefault()}
              >
                Términos de Servicio de Stripe
              </a>{" "}
              y confirmas que has leído la{" "}
              <a 
                href="#" 
                className="text-origen-pradera hover:text-origen-bosque underline underline-offset-2"
                onClick={(e) => e.preventDefault()}
              >
                Política de Privacidad
              </a>.
            </p>
            
            {!data.stripeConnected && data.acceptTerms === false && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-3">
                <Info className="w-3.5 h-3.5" />
                Conecta Stripe primero para aceptar los términos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          RESUMEN FINAL
      ==================================================================== */}
      {isComplete && (
        <div className="bg-green-50 rounded-2xl border border-green-200 p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-800">
                ¡Todo listo para vender!
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Stripe está conectado y has aceptado los términos. Ya puedes finalizar el onboarding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TRUST BADGES
      ==================================================================== */}
      <div className="flex items-center gap-4 pt-2 text-xs text-gray-500 border-t border-gray-200">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Pagos seguros garantizados</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-origen-pradera" />
          <span>Protección contra fraude</span>
        </div>
        <span className="w-1 h-1 rounded-full bg-gray-300" />
        <div className="flex items-center gap-1.5">
          <span>✅ 1.4% + 0.25€</span>
        </div>
      </div>
    </div>
  );
}

EnhancedStep6Stripe.displayName = 'EnhancedStep6Stripe';

export default EnhancedStep6Stripe;