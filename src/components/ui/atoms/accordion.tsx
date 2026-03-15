/**
 * @file accordion.tsx
 * @description Accordion premium - 100% responsive
 */

"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";
import { ChevronDown, Leaf, Sprout } from "lucide-react";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      "border-b border-origen-pradera/20 last:border-0",
      className
    )}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    icon?: React.ReactNode;
    variant?: "default" | "organic" | "minimal";
  }
>(({ className, children, icon, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "hover:bg-origen-crema/30",
    organic: "hover:bg-origen-pradera/5 rounded-lg",
    minimal: "hover:text-origen-pradera",
  };

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-between py-3 sm:py-4 font-medium transition-all",
          "[&[data-state=open]>svg]:rotate-180",
          "text-sm sm:text-base",
          variantClasses[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          {icon && (
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-origen-pradera/10 flex items-center justify-center text-origen-pradera">
              {icon}
            </div>
          )}
          <span className="text-origen-bosque">{children}</span>
        </div>
        <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 shrink-0 text-origen-pradera transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all",
      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
      className
    )}
    {...props}
  >
    <div className="pb-3 sm:pb-4 pt-0 text-gray-600">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

// ============================================================================
// FILTER ACCORDION (para filtros)
// ============================================================================

export interface FilterAccordionProps {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  className?: string;
}

const FilterAccordion = ({
  title,
  children,
  icon = <Leaf className="w-3 h-3 sm:w-4 sm:h-4" />,
  defaultOpen = false,
  badge,
  className
}: FilterAccordionProps) => {
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? title : undefined}>
      <AccordionItem value={title} className={className}>
        <AccordionTrigger icon={icon} variant="organic">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base">{title}</span>
            {badge !== undefined && (
              <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-origen-pradera/10 text-origen-pradera rounded-full">
                {badge}
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="pt-1 sm:pt-2 space-y-2 sm:space-y-3">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

// ============================================================================
// ACCORDION GROUP
// ============================================================================

export interface AccordionGroupProps {
  items: Array<{
    id: string;
    title: string;
    content: React.ReactNode;
    icon?: React.ReactNode;
    badge?: string | number;
  }>;
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
}

const AccordionGroup = ({
  items,
  type = "single",
  defaultValue,
  className
}: AccordionGroupProps) => {
  // Para type="single", el defaultValue debe ser string | undefined
  // Para type="multiple", el defaultValue debe ser string[] | undefined
  
  if (type === "single") {
    // Para single, convertimos a string
    const singleDefaultValue = Array.isArray(defaultValue) ? defaultValue[0] : defaultValue;
    
    return (
      <Accordion 
        type="single" 
        className={cn("space-y-1 sm:space-y-2", className)} 
        defaultValue={singleDefaultValue}
        collapsible
      >
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger icon={item.icon} variant="organic">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base">{item.title}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-origen-pradera/10 text-origen-pradera rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-1 sm:pt-2">
                {item.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  } else {
    // Para multiple, convertimos a array
    const multipleDefaultValue = Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : undefined;
    
    return (
      <Accordion 
        type="multiple" 
        className={cn("space-y-1 sm:space-y-2", className)} 
        defaultValue={multipleDefaultValue}
      >
        {items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger icon={item.icon} variant="organic">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base">{item.title}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-medium bg-origen-pradera/10 text-origen-pradera rounded-full">
                    {item.badge}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-1 sm:pt-2">
                {item.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
};

// ============================================================================
// EXPORT
// ============================================================================

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  FilterAccordion,
  AccordionGroup,
};