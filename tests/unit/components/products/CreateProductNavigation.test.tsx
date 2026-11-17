import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateProductNavigation } from '@/app/dashboard/products/components/CreateProductNavigation';

const base = {
  currentTab: 'basic',
  onTabChange: vi.fn(),
  completedTabs: {},
  onSave: vi.fn(),
  isSaving: false,
  isEditMode: true,
  allStepsCompleted: true,
  hasCertifications: false,
  certificationsApproved: true,
  hasPendingManualCerts: false,
  onPublish: vi.fn(),
  isPublishing: false,
  publishStatus: 'idle' as const,
};

type Props = React.ComponentProps<typeof CreateProductNavigation>;
const props = base as unknown as Props;

describe('CreateProductNavigation — botón Publicar', () => {
  it('se muestra en un borrador completo', () => {
    render(<CreateProductNavigation {...props} />);
    expect(screen.getByRole('button', { name: /^Publicar$/ })).toBeInTheDocument();
  });

  it('no se muestra si el producto ya está en revisión (pendiente de aprobación)', () => {
    render(<CreateProductNavigation {...props} isPendingApproval />);
    expect(screen.queryByRole('button', { name: /^Publicar$/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Guardar cambios/ })).toBeInTheDocument();
  });

  it('no se muestra si el producto ya está publicado', () => {
    render(<CreateProductNavigation {...props} isPublishedProduct />);
    expect(screen.queryByRole('button', { name: /^Publicar$/ })).toBeNull();
  });
});
