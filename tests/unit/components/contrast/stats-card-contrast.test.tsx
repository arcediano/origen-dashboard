import { describe, expect, it } from 'vitest';
import { TrendingUp } from 'lucide-react';
import { render } from '../../../helpers/render';
import { StatsCard } from '@/components/features/dashboard/components/stats/stats-card';

describe('StatsCard contrast', () => {
  it('mantiene icono en blanco sobre gradiente oscuro', () => {
    const { container } = render(
      <StatsCard
        label="GMV"
        value={1200}
        icon={TrendingUp}
        gradient="from-origen-bosque to-origen-pino"
      />
    );

    const icon = container.querySelector('svg');
    expect(icon?.className.baseVal ?? icon?.getAttribute('class')).toContain('text-white');
  });
});
