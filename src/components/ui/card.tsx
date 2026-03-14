/**
 * @file card.tsx
 * @description Sistema de Cards premium - 100% responsive
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Leaf, Sprout, ArrowRight, Star } from "lucide-react";
import { Button } from "./button";

// ============================================================================
// TIPOS
// ============================================================================

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outline" | "flat" | "organic" | "forest";
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  backgroundImage?: string;
  overlay?: "none" | "light" | "medium" | "dark";
  hoverEffect?: "none" | "lift" | "glow" | "scale" | "organic";
  animate?: boolean;
}

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
}

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
}

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: "sm" | "md" | "lg";
  align?: "left" | "center" | "right";
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  size?: "sm" | "md" | "lg";
}

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  size?: "sm" | "md" | "lg";
}

// ============================================================================
// COMPONENTE CARD PRINCIPAL
// ============================================================================

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = "",
      variant = "default",
      interactive = false,
      padding = "md",
      rounded = "lg",
      backgroundImage,
      overlay = "none",
      hoverEffect = "none",
      animate = false,
      children,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "bg-white border border-origen-pradera/20 shadow-subtle",
      elevated: "bg-white border-0 shadow-origen hover:shadow-origen-lg",
      outline: "bg-transparent border-2 border-origen-pradera/30 hover:border-origen-hoja",
      flat: "bg-origen-crema border-0 shadow-none",
      organic: "bg-white border border-origen-pradera/30 shadow-origen relative overflow-hidden",
      forest: "bg-gradient-to-br from-origen-bosque to-origen-pino border border-origen-bosque/30 text-white shadow-lg shadow-origen-bosque/20",
    };

    const paddingClasses = {
      none: "p-0",
      sm: "p-4 sm:p-5",
      md: "p-5 sm:p-6",
      lg: "p-6 sm:p-8",
    };

    const roundedClasses = {
      none: "rounded-none",
      sm: "rounded-lg sm:rounded-xl",
      md: "rounded-xl sm:rounded-2xl",
      lg: "rounded-2xl sm:rounded-3xl",
      xl: "rounded-3xl sm:rounded-4xl",
      full: "rounded-3xl sm:rounded-[2rem]",
    };

    const overlayClasses = {
      none: "",
      light: "bg-black/10",
      medium: "bg-black/30",
      dark: "bg-black/50",
    };

    const hoverClasses = {
      none: "",
      lift: "hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300",
      glow: "hover:shadow-origen-lg transition-shadow duration-300",
      scale: "hover:scale-[1.01] sm:hover:scale-[1.02] transition-transform duration-300",
      organic: "hover:shadow-origen-lg hover:border-origen-pradera/50 transition-all duration-500",
    };

    const animationClasses = animate
      ? "animate-in fade-in-0 zoom-in-95 duration-500"
      : "";

    const backgroundStyle = backgroundImage
      ? {
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : {};

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col",
          roundedClasses[rounded],
          variantClasses[variant],
          paddingClasses[padding],
          hoverEffect !== "none" && hoverClasses[hoverEffect],
          interactive && "cursor-pointer hover:ring-2 hover:ring-origen-pradera/20",
          animationClasses,
          className
        )}
        style={backgroundStyle}
        role={interactive ? "button" : "article"}
        tabIndex={interactive ? 0 : undefined}
        {...props}
      >
        {backgroundImage && overlay !== "none" && (
          <div
            className={cn(
              "absolute inset-0",
              roundedClasses[rounded],
              overlayClasses[overlay]
            )}
          />
        )}
        
        <div className={cn(
          "relative z-10",
          variant === "forest" && "text-white"
        )}>
          {children}
        </div>
        
        {variant === "organic" && (
          <>
            <div className="absolute -bottom-4 -right-4 h-16 w-16 text-origen-pradera/10 rotate-12">
              <Leaf className="h-full w-full" />
            </div>
            <div className="absolute -top-4 -left-4 h-12 w-12 text-origen-pradera/10 -rotate-12">
              <Sprout className="h-full w-full" />
            </div>
          </>
        )}
        
        {variant === "forest" && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 rounded-[inherit]" />
        )}
      </div>
    );
  }
);

Card.displayName = "Card";

// ============================================================================
// CARD HEADER
// ============================================================================

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = "", spacing = "md", ...props }, ref) => {
    const spacingClasses = {
      sm: "space-y-1 mb-3",
      md: "space-y-1.5 mb-4",
      lg: "space-y-2 mb-5",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col",
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);

CardHeader.displayName = "CardHeader";

// ============================================================================
// CARD TITLE
// ============================================================================

const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = "", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-base sm:text-lg",
      md: "text-lg sm:text-xl",
      lg: "text-xl sm:text-2xl",
    };

    return (
      <h3
        ref={ref}
        className={cn(
          "font-bold leading-tight tracking-tight text-origen-bosque",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

CardTitle.displayName = "CardTitle";

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className = "", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "text-xs sm:text-sm",
      md: "text-sm sm:text-base",
      lg: "text-base sm:text-lg",
    };

    return (
      <p
        ref={ref}
        className={cn(
          "leading-relaxed text-gray-600",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

CardDescription.displayName = "CardDescription";

// ============================================================================
// CARD CONTENT
// ============================================================================

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = "", spacing = "md", ...props }, ref) => {
    const spacingClasses = {
      sm: "space-y-2",
      md: "space-y-3",
      lg: "space-y-4",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex-1",
          spacingClasses[spacing],
          className
        )}
        {...props}
      />
    );
  }
);

CardContent.displayName = "CardContent";

// ============================================================================
// CARD FOOTER
// ============================================================================

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = "", spacing = "md", align = "left", ...props }, ref) => {
    const spacingClasses = {
      sm: "mt-3 pt-2",
      md: "mt-4 pt-3",
      lg: "mt-5 pt-4",
    };

    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center border-t border-origen-pradera/10",
          spacingClasses[spacing],
          alignClasses[align],
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = "CardFooter";

// ============================================================================
// FEATURE CARD (PREMIUM)
// ============================================================================

export interface FeatureCardProps extends Omit<CardProps, 'children'> {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  iconColor?: string;
  badge?: string | number;
}

const FeatureCard = React.forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ 
    icon, 
    title, 
    description, 
    action,
    badge,
    iconColor,
    variant = "elevated",
    interactive = true,
    padding = "lg",
    className = "",
    ...props 
  }, ref) => {
    return (
      <Card
        ref={ref}
        variant={variant}
        interactive={interactive}
        hoverEffect="organic"
        padding={padding}
        className={cn("group relative", className)}
        {...props}
      >
        {badge && (
          <div className="absolute top-4 right-4 z-20">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold bg-origen-pradera text-white rounded-full">
              {badge}
            </span>
          </div>
        )}
        
        <CardHeader spacing="lg">
          <div 
            className={cn(
              "mb-3 sm:mb-4 inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center",
              "rounded-xl",
              "bg-gradient-to-br from-origen-pradera/10 to-origen-hoja/10",
              "text-origen-hoja",
              "group-hover:scale-110 group-hover:shadow-origen",
              "transition-all duration-300",
              iconColor
            )}
          >
            {icon}
          </div>
          <CardTitle size="lg" className="group-hover:text-origen-pino transition-colors">
            {title}
          </CardTitle>
          <CardDescription size="md">
            {description}
          </CardDescription>
        </CardHeader>
        
        {action && (
          <CardFooter align="right" spacing="lg">
            {action}
          </CardFooter>
        )}
        
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-origen-pradera" />
        </div>
      </Card>
    );
  }
);

FeatureCard.displayName = "FeatureCard";

// ============================================================================
// STAT CARD (PREMIUM)
// ============================================================================

export interface StatCardProps extends Omit<CardProps, 'children'> {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  description?: string;
  valueSize?: "sm" | "md" | "lg";
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ 
    label, 
    value, 
    trend, 
    icon, 
    description,
    valueSize = "lg",
    variant = "elevated",
    padding = "lg",
    className = "",
    ...props 
  }, ref) => {
    const valueSizeClasses = {
      sm: "text-xl sm:text-2xl",
      md: "text-2xl sm:text-3xl",
      lg: "text-3xl sm:text-4xl",
    };

    return (
      <Card
        ref={ref}
        variant={variant}
        padding={padding}
        className={cn("relative overflow-hidden group", className)}
        {...props}
      >
        <CardContent spacing="lg">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs sm:text-sm font-medium text-origen-hoja uppercase tracking-wider">
                {label}
              </p>
              
              <p className={cn(
                "font-bold text-origen-bosque",
                valueSizeClasses[valueSize]
              )}>
                {value}
              </p>
              
              {trend && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      trend.isPositive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    )}
                  >
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
                  </span>
                  <span className="text-xs text-gray-500">vs mes anterior</span>
                </div>
              )}
              
              {description && (
                <p className="text-xs sm:text-sm text-gray-600">{description}</p>
              )}
            </div>
            
            {icon && (
              <div className={cn(
                "p-2 sm:p-3 rounded-xl self-start",
                "bg-gradient-to-br from-origen-pradera/10 to-origen-hoja/10",
                "text-origen-pradera",
                "group-hover:scale-110 group-hover:rotate-3",
                "transition-all duration-300"
              )}>
                {icon}
              </div>
            )}
          </div>
        </CardContent>
        
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-origen-pradera to-origen-hoja transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

// ============================================================================
// PRODUCT CARD (PREMIUM)
// ============================================================================

export interface ProductCardProps extends Omit<CardProps, 'children'> {
  image: string;
  name: string;
  price: string | number;
  originalPrice?: string | number;
  producer?: string;
  rating?: number;
  reviewCount?: number;
  badges?: React.ReactNode[];
  onAddToCart?: () => void;
  onQuickView?: () => void;
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({ 
    image, 
    name, 
    price, 
    originalPrice,
    producer,
    rating = 0,
    reviewCount,
    badges,
    onAddToCart,
    onQuickView,
    variant = "elevated",
    interactive = true,
    padding = "none",
    className = "",
    ...props 
  }, ref) => {
    const discount = originalPrice 
      ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
      : 0;

    return (
      <Card
        ref={ref}
        variant={variant}
        interactive={interactive}
        hoverEffect="lift"
        padding={padding}
        className={cn("group overflow-hidden", className)}
        {...props}
      >
        <div className="relative aspect-square overflow-hidden bg-origen-crema">
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Badges */}
          {badges && badges.length > 0 && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-wrap gap-1.5 z-10">
              {badges}
            </div>
          )}
          
          {/* Discount badge */}
          {discount > 0 && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-red-500 text-white rounded-full">
                -{discount}%
              </span>
            </div>
          )}
          
          {/* Quick view button (mobile/tablet) */}
          {onQuickView && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView();
              }}
              className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-origen-bosque/90 text-white py-2 text-sm font-medium backdrop-blur-sm"
            >
              Vista rápida
            </button>
          )}
        </div>
        
        <CardContent spacing="md" className="p-3 sm:p-4">
          {producer && (
            <p className="text-xs sm:text-sm text-origen-hoja mb-1 truncate">
              {producer}
            </p>
          )}
          
          <CardTitle size="sm" className="mb-1 line-clamp-2 min-h-[2.5rem]">
            {name}
          </CardTitle>
          
          {rating > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3 sm:h-4 sm:w-4",
                      i < Math.floor(rating)
                        ? "text-amber-400 fill-amber-400"
                        : "text-gray-300"
                    )}
                  />
                ))}
              </div>
              {reviewCount !== undefined && (
                <span className="text-xs text-gray-500">({reviewCount})</span>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-origen-bosque">
                {typeof price === 'number' ? `${price.toFixed(2)}€` : price}
              </span>
              {originalPrice && (
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  {typeof originalPrice === 'number' ? `${originalPrice.toFixed(2)}€` : originalPrice}
                </span>
              )}
            </div>
            
            {onAddToCart && (
              <Button
                size="icon-sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart();
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Añadir al carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ProductCard.displayName = "ProductCard";

// ============================================================================
// EXPORT
// ============================================================================

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  FeatureCard,
  StatCard,
  ProductCard
};