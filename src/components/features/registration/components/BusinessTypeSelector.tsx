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
            className={cn(
              'relative bg-white rounded-xl border-2 transition-all',
              'hover:shadow-md hover:scale-[1.02]',
              'focus:outline-none focus:ring-2 focus:ring-origen-hoja/50',
              'p-3 md:p-5',
              isSelected
                ? 'border-origen-hoja bg-origen-hoja/5 shadow-md'
                : 'border-gray-200 hover:border-origen-hoja'
            )}
          >
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className="w-5 h-5 bg-gradient-to-br from-origen-bosque to-origen-pino rounded-full flex items-center justify-center shadow">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
            <div className="flex flex-col items-center text-center">
              <div className={cn(
                'rounded-xl flex items-center justify-center mb-2 transition-all',
                'w-10 h-10 md:w-16 md:h-16',
                isSelected
                  ? 'bg-gradient-to-br from-origen-bosque to-origen-pino text-white shadow-lg'
                  : 'bg-gradient-to-br from-origen-crema to-origen-pastel text-origen-bosque'
              )}>
                <Icon className="w-5 h-5 md:w-8 md:h-8" />
              </div>
              <h3 className={cn('text-sm md:text-lg font-semibold mb-0.5', isSelected ? 'text-origen-bosque' : 'text-gray-900')}>
                {option.label}
              </h3>
              <p className="text-xs text-gray-500 hidden md:block">{option.desc}</p>
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
