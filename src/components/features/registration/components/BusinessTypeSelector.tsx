// ============================================================================
// COMPONENT: BusinessTypeSelector
// ============================================================================
// Selector for choosing between individual or company business type

import { Check, AlertCircle, User, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BusinessTypeSelectorProps {
  value: 'individual' | 'company';
  onChange: (value: 'individual' | 'company') => void;
  error?: string;
}

export const BusinessTypeSelector: React.FC<BusinessTypeSelectorProps> = ({ value, onChange, error }) => (
  <div className="space-y-2 md:space-y-3">
    <label className="text-sm md:text-base font-medium text-origen-bosque flex items-center gap-2">
      <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-origen-hoja" />
      Tipo de negocio <span className="text-destructive">*</span>
    </label>
    <div className="grid grid-cols-2 gap-3">
      {[
        { id: 'individual', label: 'Autónomo', desc: 'Particular / Freelance', icon: User },
        { id: 'company', label: 'Empresa', desc: 'Sociedad / Corporación', icon: Building2 },
      ].map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id as 'individual' | 'company')}
            aria-pressed={isSelected}
            className={cn(
              'relative bg-surface-alt rounded-xl border-2 transition-all duration-200',
              'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
              'focus:outline-none focus:ring-2 focus:ring-origen-pradera/50',
              'p-3 md:p-5',
              isSelected
                ? 'border-origen-pradera bg-origen-pradera/[0.03] shadow-md'
                : 'border-border hover:border-origen-pradera'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-6 h-6 rounded-full bg-origen-pradera flex items-center justify-center shadow-sm">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center text-center gap-2">
              <div className={cn(
                'rounded-xl flex items-center justify-center transition-all',
                'w-12 h-12 flex-shrink-0',
                isSelected
                  ? 'bg-gradient-to-br from-origen-pradera to-origen-hoja text-white shadow-md'
                  : 'bg-gradient-to-br from-origen-crema to-origen-pastel text-origen-bosque group-hover:scale-110',
              )}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className={cn('text-sm font-semibold leading-tight', isSelected ? 'text-origen-bosque' : 'text-foreground')}>
                  {option.label}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">{option.desc}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
    {error && (
      <p className="text-sm text-destructive flex items-center gap-1">
        <AlertCircle className="w-4 h-4" />{error}
      </p>
    )}
  </div>
);
