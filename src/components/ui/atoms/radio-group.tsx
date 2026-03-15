/**
 * @file radio-group.tsx
 * @description Radio Group premium con diseño orgánico - 100% responsive
 */

"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> {
  variant?: "default" | "organic" | "minimal";
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
}

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, variant = "default", size = "md", orientation = "vertical", ...props }, ref) => {
  const variantClasses = {
    default: "",
    organic: "bg-origen-crema/50 p-3 rounded-xl",
    minimal: "",
  };

  const orientationClasses = {
    horizontal: "flex flex-row flex-wrap gap-4 sm:gap-6",
    vertical: "flex flex-col gap-3",
  };

  return (
    <RadioGroupPrimitive.Root
      className={cn(
        orientationClasses[orientation],
        variantClasses[variant],
        className
      )}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

export interface RadioGroupItemProps
  extends React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> {
  variant?: "default" | "organic" | "forest" | "accent";
  size?: "sm" | "md" | "lg";
  label?: string;
  description?: string;
  error?: boolean;
}

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant = "default", size = "md", label, description, error, id, ...props }, ref) => {
  const generatedId = React.useId();
  const radioId = id || generatedId;

  const variantClasses = {
    default: cn(
      "border-origen-pradera/50 text-origen-pradera",
      "hover:border-origen-hoja hover:bg-origen-crema/30",
      "data-[state=checked]:border-origen-pradera data-[state=checked]:text-origen-pradera",
      error && "border-red-500 data-[state=checked]:border-red-500"
    ),
    organic: cn(
      "border-origen-hoja/40 text-origen-hoja",
      "hover:border-origen-hoja hover:bg-origen-pastel/30",
      "data-[state=checked]:border-origen-hoja data-[state=checked]:text-origen-hoja",
      error && "border-red-500 data-[state=checked]:border-red-500"
    ),
    forest: cn(
      "border-origen-bosque/30 text-origen-bosque",
      "hover:border-origen-bosque hover:bg-origen-bosque/5",
      "data-[state=checked]:border-origen-bosque data-[state=checked]:text-origen-bosque",
      error && "border-red-500 data-[state=checked]:border-red-500"
    ),
    accent: cn(
      "border-origen-pradera/30 text-origen-pradera",
      "hover:border-origen-pradera hover:bg-origen-pradera/5",
      "data-[state=checked]:border-origen-pradera data-[state=checked]:text-origen-pradera",
      error && "border-red-500 data-[state=checked]:border-red-500"
    ),
  };

  const sizeClasses = {
    sm: "h-3.5 w-3.5 sm:h-4 sm:w-4 [&_svg]:h-2 [&_svg]:w-2 sm:[&_svg]:h-2.5 sm:[&_svg]:w-2.5",
    md: "h-4 w-4 sm:h-5 sm:w-5 [&_svg]:h-2.5 [&_svg]:w-2.5 sm:[&_svg]:h-3 sm:[&_svg]:w-3",
    lg: "h-5 w-5 sm:h-6 sm:w-6 [&_svg]:h-3 [&_svg]:w-3 sm:[&_svg]:h-3.5 sm:[&_svg]:w-3.5",
  };

  const radioButton = (
    <RadioGroupPrimitive.Item
      ref={ref}
      id={radioId}
      className={cn(
        "aspect-square rounded-full border-2 bg-white",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-origen-pradera/50 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="fill-current text-current" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );

  if (label || description) {
    return (
      <div className="flex items-start gap-2 sm:gap-3">
        {radioButton}
        <div className="flex-1">
          <label
            htmlFor={radioId}
            className={cn(
              "text-xs sm:text-sm font-medium text-origen-bosque cursor-pointer",
              "transition-colors duration-200",
              props.disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="requerido">*</span>
            )}
          </label>
          {description && (
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }

  return radioButton;
});

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

export { RadioGroup, RadioGroupItem };