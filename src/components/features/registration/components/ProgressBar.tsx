// ============================================================================
// COMPONENT: ProgressBar
// ============================================================================
// Visual progress bar for textarea character count validation

import { cn } from '@/lib/utils';

export interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  className
}) => {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs md:text-sm text-origen-pino">Mínimo 50 caracteres</span>
        <span className="text-xs md:text-sm font-semibold text-origen-pino">{percentage}%</span>
      </div>
      <div className="h-2 bg-origen-crema rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-origen-hoja transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
