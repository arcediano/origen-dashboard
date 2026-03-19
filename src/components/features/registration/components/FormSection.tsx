// ============================================================================
// COMPONENT: FormSection
// ============================================================================
// Reusable form section wrapper with title, description, and optional badge

import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  badge?: string;
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
  badge
}) => (
  <div className={cn(
    'bg-surface-alt rounded-xl md:rounded-2xl border border-border',
    'p-4 md:p-6',
    'hover:border-origen-hoja/40 transition-all shadow-subtle hover:shadow-origen',
    className
  )}>
    {badge && (
      <div className="inline-flex items-center gap-1.5 bg-origen-crema/80 rounded-full px-3 py-1 mb-2 md:mb-4 border border-origen-hoja/30">
        <Sparkles className="w-3 h-3 text-origen-hoja" />
        <span className="text-xs font-semibold text-origen-bosque">{badge}</span>
      </div>
    )}
    <h3 className="text-base md:text-lg font-bold text-origen-bosque mb-1">{title}</h3>
    {description && (
      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">{description}</p>
    )}
    <div className="space-y-3 md:space-y-4">
      {children}
    </div>
  </div>
);
