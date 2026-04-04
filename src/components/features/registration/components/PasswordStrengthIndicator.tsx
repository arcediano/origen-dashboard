// ============================================================================
// COMPONENT: PasswordStrengthIndicator
// ============================================================================
// Visual indicator of password strength with color-coded levels

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthProps> = ({ password }) => {
  const getStrength = (pwd: string): { level: number; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Débil', color: 'bg-feedback-danger' };
    if (score <= 2) return { level: 2, label: 'Regular', color: 'bg-orange-500' };
    if (score <= 3) return { level: 3, label: 'Buena', color: 'bg-yellow-500' };
    if (score <= 4) return { level: 4, label: 'Fuerte', color: 'bg-origen-hoja' };
    return { level: 5, label: 'Muy fuerte', color: 'bg-green-600' };
  };

  const strength = getStrength(password);

  if (!password || strength.level === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2 space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] md:text-xs text-muted-foreground">Fortaleza:</span>
        <span className={cn(
          "text-[10px] md:text-xs font-semibold",
          strength.level <= 2 ? "text-feedback-danger" :
          strength.level <= 3 ? "text-orange-500" :
          "text-origen-hoja"
        )}>
          {strength.label}
        </span>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i <= strength.level ? strength.color : "bg-border"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
};
