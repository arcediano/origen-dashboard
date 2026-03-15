// ============================================================================
// COMPONENT: CustomCheckbox
// ============================================================================
// Custom checkbox component with label, description, and error state

import { useId } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CustomCheckboxProps {
  id?: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  required?: boolean;
  error?: string;
  className?: string;
}

export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id: providedId, label, description, checked, onChange, required, error, className
}) => {
  const generatedId = useId();
  const checkboxId = providedId || `checkbox-${generatedId}`;

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-start gap-3">
        <div className="relative flex items-center justify-center mt-0.5 flex-shrink-0">
          <button
            type="button"
            id={checkboxId}
            role="checkbox"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={cn(
              'h-5 w-5 rounded-md border-2 bg-white transition-all',
              'focus:outline-none focus:ring-2 focus:ring-origen-hoja/50 focus:ring-offset-2',
              checked ? 'bg-origen-bosque border-origen-bosque' : 'border-gray-300 hover:border-origen-hoja',
              error && 'border-destructive'
            )}
          >
            {checked && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center">
                <Check className="h-4 w-4 text-white stroke-[3]" />
              </motion.div>
            )}
          </button>
        </div>
        <div className="flex-1">
          <label htmlFor={checkboxId} className="text-sm md:text-base font-medium text-origen-bosque cursor-pointer">
            {label}
            {required && <span className="text-destructive ml-1">*</span>}
          </label>
          {description && <p className="text-xs md:text-sm text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {error && (
        <p className="text-sm text-destructive mt-1 flex items-center gap-1 ml-8">
          <AlertCircle className="w-4 h-4" />{error}
        </p>
      )}
    </div>
  );
};
