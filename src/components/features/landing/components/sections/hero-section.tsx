// components/register/HeroSection.tsx
/**
 * Hero Section Mejorado - v2.0.0
 * @version 2.0.0 - Manual de Marca v3.0 + Solución solapamiento móvil
 * @description Sección hero con overlay optimizado y tarjeta de registro con colores oficiales
 * @author Equipo de Desarrollo Origen
 * @updated Marzo 2026
 *
 * @important CORRECCIONES v2.0.0:
 *   - Solucionado solapamiento en móvil: indicador oculto al hacer scroll
 *   - Manual de marca v3.0 aplicado correctamente
 */

'use client';

import { Button } from '@/components/ui/atoms/button';
import { ArrowRight, Sparkles, TrendingUp, Clock, ShieldCheck, Globe, Leaf, CheckCircle, User, MapPin, Package, Store } from 'lucide-react';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export function HeroSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    const handleScroll = () => {
      // Ocultar indicador cuando hay scroll > 100px en móvil
      setHasScrolled(window.scrollY > 100);
    };

    checkMobile();
    handleScroll();

    window.addEventListener('resize', checkMobile);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const stats = [
    {
      value: '15%',
      label: 'Comisión',
      icon: TrendingUp,
      sublabel: 'Solo al vender',
      color: 'from-origen-hoja/95 to-origen-hoja/80'
    },
    {
      value: '24-48h',
      label: 'Aprobación',
      icon: Clock,
      sublabel: 'Rápido',
      color: 'from-origen-hoja/95 to-origen-hoja/80'
    },
    {
      value: '0€',
      label: 'Sin cuota',
      icon: ShieldCheck,
      sublabel: 'Costes fijos',
      color: 'from-origen-hoja/95 to-origen-pino/80'
    },
    {
      value: 'España',
      label: 'Cobertura',
      icon: Globe,
      sublabel: 'Nacional',
      color: 'from-origen-hoja/95 to-origen-pino/80'
    },
  ];

  const registrationSteps = [
    {
      label: 'Información básica',
      icon: User,
      completed: true,
      current: false
    },
    {
      label: 'Tipo de productos',
      icon: Package,
      completed: true,
      current: false
    },
    {
      label: 'Ubicación',
      icon: MapPin,
      completed: false,
      current: true
    },
    {
      label: 'Tienda online',
      icon: Store,
      completed: false,
      current: false
    },
  ];

  return (
    <section className="relative lg:min-h-[85vh] md:min-h-[75vh] min-h-[70vh] flex items-center overflow-hidden">
      {/* Background con overlay mejorado */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=70"
            alt="Agricultor cosechando productos frescos directamente de la tierra"
            fill
            className="object-cover object-center"
            priority
            quality={85}
            sizes="100vw"
            style={{
              objectPosition: isMobile ? 'center 45%' : 'center 35%'
            }}
          />
        </div>

        {/* OVERLAY - Verde Bosque sólido con opacidad controlada (v3.0) */}
        <div className="absolute inset-0 z-10">
          <div
            className="absolute inset-0"
            style={{
              background: isMobile
                ? 'linear-gradient(to bottom, rgba(27, 67, 50, 0.88) 0%, rgba(27, 67, 50, 0.80) 30%, rgba(27, 67, 50, 0.70) 60%, rgba(27, 67, 50, 0.55) 100%)'
                : 'linear-gradient(135deg, rgba(27, 67, 50, 0.92) 0%, rgba(27, 67, 50, 0.82) 30%, rgba(27, 67, 50, 0.70) 70%, rgba(27, 67, 50, 0.55) 100%)'
            }}
          />

          {/* Gradiente inferior sutil */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/4 opacity-30"
            style={{
              background: 'linear-gradient(to top, rgba(241, 250, 238, 0.15) 0%, transparent 80%)',
              mask: 'linear-gradient(to top, black 0%, transparent 100%)'
            }}
          />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16 relative z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 xl:gap-10">

            {/* Columna izquierda - Contenido principal */}
            <div className="flex-1 w-full lg:w-7/12">
              {/* Badge destacado */}
              <div className="inline-flex items-center gap-2 bg-surface-alt/25 backdrop-blur-sm rounded-full px-4 py-2 md:py-2.5 mb-4 md:mb-5 border border-white/40 max-w-max shadow-lg">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-origen-hoja" />
                  <span className="text-xs md:text-sm font-semibold text-white whitespace-nowrap">
                    Programa exclusivo para productores
                  </span>
                </div>
                <CheckCircle className="w-3.5 h-3.5 text-origen-hoja" />
              </div>

              {/* Título */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-5 leading-tight text-white drop-shadow-xl">
                Conecta tu pasión
                <span className="block text-white mt-1 md:mt-2 drop-shadow-2xl">
                  con quien la valora
                </span>
              </h1>

              {/* Descripción */}
              <p className="text-sm sm:text-base md:text-lg text-white/95 mb-6 md:mb-7 max-w-xl leading-relaxed drop-shadow-md">
                Únete al marketplace líder para productores locales españoles.
                Llega a consumidores conscientes que valoran la autenticidad,
                transparencia y calidad artesanal.
              </p>

              {/* Stats destacadas */}
              <div className="mb-6 md:mb-7">
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <div key={index} className="group">
                        <div className="bg-surface-alt/20 backdrop-blur-md rounded-xl p-3 md:p-4 border border-white/30 group-hover:border-origen-hoja transition-all duration-300 h-full hover:shadow-lg hover:scale-[1.02]">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xl md:text-2xl font-bold text-white mb-0.5 drop-shadow-sm">
                                {stat.value}
                              </div>
                              <div className="text-sm font-medium text-white/90">
                                {stat.label}
                              </div>
                              <div className="text-xs text-white/75">
                                {stat.sublabel}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CTA principal y social proof */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Button
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5 flex-shrink-0" />}
                  className="h-auto bg-origen-hoja hover:bg-origen-hoja/90 text-white text-sm sm:text-base md:text-lg px-5 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-0.5 w-full sm:w-auto font-semibold border-2 border-white/30 whitespace-nowrap"
                  onClick={() => document.getElementById('registration-form')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Empezar registro gratuito
                </Button>

                <div className="flex items-center gap-3 text-white/90">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-surface-alt/30 border-2 border-origen-hoja/50 flex items-center justify-center shadow-md">
                        <Leaf className="w-3.5 h-3.5 text-origen-hoja" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm md:text-base font-bold drop-shadow-sm">
                      +500 productores verificados
                    </span>
                    <span className="text-xs text-white/75">
                      confían en nuestra comunidad
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - oculta en móvil (el formulario real está más abajo) */}
            <div className="hidden lg:block flex-1 w-full lg:w-5/12 mt-8 lg:mt-0">
              <div className="relative">
                {/* EFECTO DE SOMBRA */}
                <div className="absolute -inset-1 bg-origen-bosque/5 rounded-3xl blur-xl"></div>

                {/* Tarjeta principal */}
                <div className="relative bg-surface-alt rounded-2xl md:rounded-3xl p-6 md:p-7 shadow-2xl border border-border">
                  {/* Encabezado de la tarjeta */}
                  <div className="text-center mb-5 md:mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 md:w-18 md:h-18 mx-auto mb-3 md:mb-4 relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-origen-bosque to-origen-pino rounded-full animate-pulse opacity-20"></div>
                      <div className="relative w-full h-full bg-gradient-to-br from-origen-bosque to-origen-pino rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="w-8 h-8 md:w-9 md:h-9 text-white" />
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-2 text-origen-bosque">
                      Registro simplificado
                    </h3>
                    <p className="text-origen-pino text-sm md:text-base font-medium">
                      4 pasos • 5 minutos
                    </p>
                  </div>

                  {/* Progreso del registro */}
                  <div className="mb-5 md:mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-origen-bosque">
                        Progreso del registro
                      </span>
                      <span className="text-sm font-bold text-origen-hoja">
                        50%
                      </span>
                    </div>

                    <div className="h-2.5 bg-origen-crema rounded-full overflow-hidden mb-4">
                      <div
                        className="h-full bg-origen-hoja rounded-full transition-all duration-700"
                        style={{ width: '50%' }}
                      />
                    </div>

                    {/* Pasos del registro */}
                    <div className="grid grid-cols-2 gap-3">
                      {registrationSteps.map((step, index) => {
                        const Icon = step.icon;
                        return (
                          <div key={index} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-origen-crema/50">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              step.completed
                                ? 'bg-origen-hoja/20 text-origen-hoja'
                                : step.current
                                ? 'bg-origen-hoja/30 text-origen-hoja'
                                : 'bg-surface text-text-subtle'
                            }`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-xs font-medium ${
                                step.completed
                                  ? 'text-origen-bosque'
                                  : step.current
                                  ? 'text-origen-pino'
                                  : 'text-muted-foreground'
                              }`}>
                                {step.label}
                              </div>
                              <div className="flex items-center gap-1">
                                {step.completed ? (
                                  <>
                                    <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
                                    <span className="text-[10px] text-origen-hoja font-medium">Completado</span>
                                  </>
                                ) : step.current ? (
                                  <span className="text-[10px] text-origen-hoja font-medium">En progreso</span>
                                ) : (
                                  <span className="text-[10px] text-text-subtle">Pendiente</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Información de comisión */}
                  <div className="bg-gradient-to-r from-origen-crema to-white rounded-xl p-4 md:p-5 border border-origen-hoja/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                      <div className="text-center md:text-left">
                        <p className="text-xs text-origen-hoja mb-1">Comisión por venta</p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl md:text-3xl font-bold text-origen-bosque">15%</span>
                          <span className="text-sm text-muted-foreground">por venta</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Solo cuando vendes</p>
                      </div>
                      <div className="flex items-center gap-2 bg-origen-hoja/10 px-3 py-1.5 rounded-full border border-origen-hoja/20">
                        <ShieldCheck className="w-4 h-4 text-origen-hoja" />
                        <span className="text-xs font-medium text-origen-hoja">
                          Sin costes ocultos
                        </span>
                      </div>
                    </div>

                    {/* Beneficios adicionales */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-origen-crema">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-origen-hoja/10 flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
                        </div>
                        <span className="text-xs text-origen-bosque">Sin cuota mensual</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-origen-hoja/10 flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 text-origen-hoja" />
                        </div>
                        <span className="text-xs text-origen-bosque">Pagos seguros</span>
                      </div>
                    </div>
                  </div>

                  {/* Nota al pie */}
                  <div className="mt-4 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      Registro 100% online • Sin compromiso • Activación en 24h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicador de scroll sult - Solo visible en móvil y oculto al hacer scroll */}
      <div
        className={`absolute bottom-6 left-1/2 transform -translate-x-1/2 lg:hidden z-40 transition-all duration-300 ${hasScrolled ? 'opacity-0 pointer-events-none' : 'animate-bounce-slow'}`}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs text-white/80 mb-1 font-medium drop-shadow-sm">Más información</span>
          <div className="w-5 h-7 rounded-full border border-white/50 flex justify-center pt-1">
            <div className="w-0.5 h-2 bg-surface-alt/80 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </section>
  );
}

HeroSection.displayName = 'HeroSection';
