/**
 * @file avatar.tsx
 * @description Avatar premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { User, CheckCircle, XCircle, Clock } from "lucide-react";

// ============================================================================
// TIPOS
// ============================================================================

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "circle" | "rounded" | "square";
  status?: "online" | "offline" | "away" | "busy" | "verified";
  bordered?: boolean;
  borderColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

export interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  delayMs?: number;
  children?: React.ReactNode;
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  spacing?: "tight" | "normal" | "loose";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

// ============================================================================
// CONTEXTO DEL AVATAR
// ============================================================================

interface AvatarContextType {
  size: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape: "circle" | "rounded" | "square";
  status?: "online" | "offline" | "away" | "busy" | "verified";
  imageLoadingStatus: 'idle' | 'loading' | 'loaded' | 'error';
  setImageLoadingStatus: (status: 'idle' | 'loading' | 'loaded' | 'error') => void;
}

const AvatarContext = React.createContext<AvatarContextType | undefined>(undefined);

const useAvatarContext = () => {
  const context = React.useContext(AvatarContext);
  if (!context) {
    throw new Error("Avatar subcomponentes deben usarse dentro de un Avatar");
  }
  return context;
};

// ============================================================================
// CONSTANTES
// ============================================================================

const STATUS_COLORS = {
  online: "bg-green-500",
  offline: "bg-muted-foreground",
  away: "bg-amber-500",
  busy: "bg-red-500",
  verified: "bg-origen-pradera",
};

const STATUS_ICONS = {
  verified: <CheckCircle className="text-white" />,
  busy: <XCircle className="text-white" />,
  away: <Clock className="text-white" />,
};

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-xs sm:h-8 sm:w-8 sm:text-sm",
  sm: "h-8 w-8 text-sm sm:h-10 sm:w-10 sm:text-base",
  md: "h-10 w-10 text-base sm:h-12 sm:w-12 sm:text-lg",
  lg: "h-12 w-12 text-lg sm:h-14 sm:w-14 sm:text-xl",
  xl: "h-14 w-14 text-xl sm:h-16 sm:w-16 sm:text-2xl",
  "2xl": "h-16 w-16 text-2xl sm:h-20 sm:w-20 sm:text-3xl",
};

const SHAPE_CLASSES = {
  circle: "rounded-full",
  rounded: "rounded-lg sm:rounded-xl",
  square: "rounded-none",
};

const STATUS_SIZE_CLASSES = {
  xs: "h-1.5 w-1.5 sm:h-2 sm:w-2",
  sm: "h-2 w-2 sm:h-2.5 sm:w-2.5",
  md: "h-2.5 w-2.5 sm:h-3 sm:w-3",
  lg: "h-3 w-3 sm:h-3.5 sm:w-3.5",
  xl: "h-3.5 w-3.5 sm:h-4 sm:w-4",
  "2xl": "h-4 w-4 sm:h-5 sm:w-5",
};

// ============================================================================
// COMPONENTE AVATAR PRINCIPAL
// ============================================================================

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({
    src,
    alt = "Avatar",
    fallback,
    size = "md",
    shape = "circle",
    status,
    bordered = false,
    borderColor = "border-white",
    className,
    children,
    ...props
  }, ref) => {
    const [imageLoadingStatus, setImageLoadingStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
    const [imageError, setImageError] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    const handleImageError = () => {
      setImageError(true);
      setImageLoadingStatus('error');
    };

    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageLoadingStatus('loaded');
    };

    const showImage = src && !imageError;

    const contextValue = React.useMemo(
      () => ({
        size,
        shape,
        status,
        imageLoadingStatus,
        setImageLoadingStatus,
      }),
      [size, shape, status, imageLoadingStatus]
    );

    return (
      <AvatarContext.Provider value={contextValue}>
        <div className="relative inline-flex">
          <div
            ref={ref}
            className={cn(
              "relative flex shrink-0 overflow-hidden",
              "bg-gradient-to-br from-origen-pradera/10 to-origen-hoja/10",
              "text-origen-bosque font-medium",
              "transition-all duration-300",
              SIZE_CLASSES[size],
              SHAPE_CLASSES[shape],
              bordered && `ring-2 ring-offset-2 ${borderColor}`,
              className
            )}
            {...props}
          >
            {/* Imagen directa (para compatibilidad) */}
            {src && (
              <img
                src={src}
                alt={alt}
                className={cn(
                  "h-full w-full object-cover",
                  "transition-opacity duration-300",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            )}

            {/* Children (AvatarImage, AvatarFallback) */}
            {!src && children}
          </div>

          {/* Indicador de estado */}
          {status && status !== "verified" && (
            <div
              className={cn(
                "absolute -bottom-0.5 -right-0.5",
                STATUS_SIZE_CLASSES[size],
                "rounded-full border-2 border-white",
                STATUS_COLORS[status]
              )}
            />
          )}

          {/* Icono de verificación */}
          {status === "verified" && (
            <div
              className={cn(
                "absolute -bottom-1 -right-1",
                "rounded-full bg-origen-pradera",
                "flex items-center justify-center",
                "border border-white",
                size === "xs" && "h-3 w-3 sm:h-4 sm:w-4",
                size === "sm" && "h-3.5 w-3.5 sm:h-4.5 sm:w-4.5",
                size === "md" && "h-4 w-4 sm:h-5 sm:w-5",
                size === "lg" && "h-4.5 w-4.5 sm:h-5.5 sm:w-5.5",
                size === "xl" && "h-5 w-5 sm:h-6 sm:w-6",
                size === "2xl" && "h-5.5 w-5.5 sm:h-6.5 sm:w-6.5"
              )}
            >
              <CheckCircle className={cn(
                "text-white",
                size === "xs" && "h-2 w-2 sm:h-3 sm:w-3",
                size === "sm" && "h-2.5 w-2.5 sm:h-3.5 sm:w-3.5",
                size === "md" && "h-3 w-3 sm:h-4 sm:w-4",
                size === "lg" && "h-3.5 w-3.5 sm:h-4.5 sm:w-4.5",
                size === "xl" && "h-4 w-4 sm:h-5 sm:w-5",
                size === "2xl" && "h-4.5 w-4.5 sm:h-5.5 sm:w-5.5"
              )} />
            </div>
          )}
        </div>
      </AvatarContext.Provider>
    );
  }
);

Avatar.displayName = "Avatar";

// ============================================================================
// AVATAR IMAGE
// ============================================================================

const AvatarImage = React.forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className, src, alt = "", onLoadingStatusChange, ...props }, ref) => {
    const { setImageLoadingStatus } = useAvatarContext();
    const [status, setStatus] = React.useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

    React.useEffect(() => {
      setImageLoadingStatus(status);
      onLoadingStatusChange?.(status);
    }, [status, setImageLoadingStatus, onLoadingStatusChange]);

    if (!src) return null;

    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        {...props}
      />
    );
  }
);

AvatarImage.displayName = "AvatarImage";

// ============================================================================
// AVATAR FALLBACK
// ============================================================================

const AvatarFallback = React.forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ className, delayMs, children, ...props }, ref) => {
    const { imageLoadingStatus } = useAvatarContext();
    const [canRender, setCanRender] = React.useState(delayMs === undefined);

    React.useEffect(() => {
      if (delayMs !== undefined) {
        const timer = setTimeout(() => setCanRender(true), delayMs);
        return () => clearTimeout(timer);
      }
    }, [delayMs]);

    if (imageLoadingStatus === 'loaded' || (imageLoadingStatus === 'loading' && !canRender)) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center bg-inherit",
          className
        )}
        {...props}
      >
        {children || <User className="h-1/2 w-1/2" />}
      </div>
    );
  }
);

AvatarFallback.displayName = "AvatarFallback";

// ============================================================================
// AVATAR GROUP
// ============================================================================

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({
    children,
    max = 4,
    spacing = "normal",
    size = "md",
    className,
    ...props
  }, ref) => {
    const spacingClasses = {
      tight: "-space-x-2 sm:-space-x-3",
      normal: "-space-x-3 sm:-space-x-4",
      loose: "-space-x-4 sm:-space-x-5",
    };

    const childrenArray = React.Children.toArray(children);
    const visibleChildren = childrenArray.slice(0, max);
    const remainingCount = childrenArray.length - max;

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center",
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {visibleChildren}
        
        {remainingCount > 0 && (
          <Avatar size={size} className="ring-2 ring-white">
            <AvatarFallback>+{remainingCount}</AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = "AvatarGroup";

// ============================================================================
// EXPORT
// ============================================================================

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };