import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ImageUploader } from '@/app/dashboard/products/components/ImageUploader';
import { FileUpload } from '@/components/shared/upload/file-upload';
import { IMAGE_QUALITY_PRESETS } from '@/lib/validations/image-quality';

vi.mock('@/lib/validations/image-quality', async () => {
  const actual = await vi.importActual<typeof import('@/lib/validations/image-quality')>('@/lib/validations/image-quality');

  return {
    ...actual,
    getImageDimensions: vi.fn(async (file: File) => {
      if (file.name.includes('small')) {
        return { width: 600, height: 600 };
      }

      return { width: 2200, height: 2200 };
    }),
  };
});

function getHiddenFileInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');

  if (!input) {
    throw new Error('No se encontro el input de archivos');
  }

  return input;
}

describe('image quality validation', () => {
  it('shows a contextual error when FileUpload receives a low-resolution product image', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <FileUpload
        value={[]}
        onChange={onChange}
        accept="image/jpeg,image/png"
        qualityRequirement={IMAGE_QUALITY_PRESETS.productImage}
      />
    );

    const input = getHiddenFileInput(container);
    const file = new File(['content'], 'small-product.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/no alcanza el minimo exigido/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/ficha publica del producto y los listados/i)).toBeInTheDocument();
  });

  it('prevents ImageUploader from accepting low-resolution gallery images', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <ImageUploader
        value={[]}
        onChange={onChange}
        qualityRequirement={IMAGE_QUALITY_PRESETS.productImage}
      />
    );

    const input = getHiddenFileInput(container);
    const file = new File(['content'], 'small-gallery.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/imagen rechazada/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/ficha publica del producto y los listados/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});