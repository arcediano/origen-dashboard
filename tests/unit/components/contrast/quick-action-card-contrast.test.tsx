import { describe, expect, it } from 'vitest';
import { Sparkles } from 'lucide-react';
import { render } from '../../../helpers/render';
import { QuickActionCard } from '@/components/features/dashboard/components/quick-actions/quick-action-card';

describe('QuickActionCard contrast', () => {
  it('mantiene icono en blanco sobre gradiente oscuro', () => {
    const { container } = render(
      <QuickActionCard
        title="Analiticas"
        href="/dashboard/analytics"
        icon={Sparkles}
        gradient="from-origen-bosque to-origen-pino"
      />
    );

    const icon = container.querySelector('svg');
    expect(icon?.className.baseVal ?? icon?.getAttribute('class')).toContain('text-white');
  });
});
