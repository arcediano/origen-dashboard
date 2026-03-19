/**
 * @file switch.tsx
 * @description Basic toggle switch component
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md" | "lg";
  thumbColor?: string;
  trackColor?: string;
  trackCheckedColor?: string;
  disabled?: boolean;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      defaultChecked = false,
      onCheckedChange,
      size = "md",
      thumbColor = "bg-white",
      trackColor = "bg-border",
      trackCheckedColor = "bg-origen-mandarina",
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
    const isControlled = checked !== undefined;
    const isChecked = isControlled ? checked : internalChecked;

    const sizeClasses = {
      sm: "w-8 h-4",
      md: "w-10 h-5",
      lg: "w-12 h-6"
    };

    const thumbSizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5"
    };

    const thumbPositionClasses = {
      sm: isChecked ? "translate-x-4" : "translate-x-0",
      md: isChecked ? "translate-x-5" : "translate-x-0",
      lg: isChecked ? "translate-x-6" : "translate-x-0"
    };

    const handleToggle = () => {
      if (disabled) return;
      
      const newValue = !isChecked;
      
      if (!isControlled) {
        setInternalChecked(newValue);
      }
      
      onCheckedChange?.(newValue);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={isChecked}
        disabled={disabled}
        className={cn(
          "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent",
          "transition-colors duration-200 ease-in-out",
          "focus:outline-none focus:ring-2 focus:ring-origen-pradera/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeClasses[size],
          isChecked ? trackCheckedColor : trackColor,
          className
        )}
        onClick={handleToggle}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none inline-block transform rounded-full shadow-md transition-transform duration-200 ease-in-out",
            thumbSizeClasses[size],
            thumbPositionClasses[size],
            thumbColor
          )}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
