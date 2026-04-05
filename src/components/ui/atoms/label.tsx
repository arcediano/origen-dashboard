/**
 * @file label.tsx
 * @description Label premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "text-origen-bosque",
        error: "text-red-600",
        success: "text-green-600",
        muted: "text-muted-foreground font-normal",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  required?: boolean;
  optional?: boolean;
  tooltip?: string;
}

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, variant, size, required, optional, tooltip, children, ...props }, ref) => (
  <div className="flex items-center gap-1.5 sm:gap-2">
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants({ variant, size }), className)}
      {...props}
    >
      {children}
      {required && (
        <span 
          className="text-red-500 ml-1 inline-block" 
          aria-label="campo requerido"
        >
          *
        </span>
      )}
      {optional && (
        <span className="text-text-disabled ml-1 text-[10px] sm:text-xs font-normal">
          (opcional)
        </span>
      )}
    </LabelPrimitive.Root>
    
    {tooltip && (
      <div className="group relative inline-flex">
        <Info 
          className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-text-subtle cursor-help" 
          aria-label="información adicional"
        />
        <div 
          className={cn(
            "absolute left-0 top-5 sm:top-6 z-50 hidden group-hover:block",
            "w-40 sm:w-48 p-2 rounded-lg bg-origen-oscuro text-white text-[10px] sm:text-xs",
            "shadow-lg animate-in fade-in-0 zoom-in-95"
          )}
          role="tooltip"
        >
          {tooltip}
          <div className="absolute -top-1 left-2 w-1.5 h-1.5 bg-origen-oscuro rotate-45" />
        </div>
      </div>
    )}
  </div>
));

Label.displayName = LabelPrimitive.Root.displayName;

export { Label, labelVariants };