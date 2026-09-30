/**
 * Paso 4: documentos hidratados (no se obliga a resubir), caducidad editable y certificaciones por catálogo.
 */
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { render, screen } from '../../helpers/render';
import { EnhancedStep4Documents } from '@/components/features/onboarding/components/steps/step-documents';
import { INITIAL_FORM_DATA, type DocumentsData } from '@/lib/onboarding/types';

vi.unmock('@arcediano/ux-library');

const file = (key: string) => ({ id: key, key, name: key, size: 0, type: 'application/pdf' });

function Harness({ initial, errors }: { initial?: Partial<DocumentsData>; errors?: Record<string, string> }) {
  const [data, setData] = React.useState<DocumentsData>({ ...INITIAL_FORM_DATA.step4, ...initial });
  return (
    <>
      <EnhancedStep4Documents data={data} onChange={setData} errors={errors} />
      <output data-testid="data">{JSON.stringify(data.certifications.map((c) => c.certificationId))}</output>
    </>
  );
}

describe('EnhancedStep4Documents', () => {
  it('vacío: pide subir los 3 documentos obligatorios', () => {
    render(<Harness />);
    expect(screen.getAllByText('Obligatorio')).toHaveLength(3);
  });

  it('hidratado: muestra el archivo guardado (sin zona de subida) y la caducidad editable', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ cif: { file: file('cif.pdf'), expiresAt: '2030-01-01', status: 'PENDING' } }} />);
    expect(screen.getByText('cif.pdf')).toBeInTheDocument();
    const date = screen.getAllByLabelText(/fecha de caducidad/i)[0] as HTMLInputElement;
    expect(date.value).toBe('2030-01-01');
    expect(date).not.toBeDisabled();
    await user.clear(date);
    expect(screen.getByText('cif.pdf')).toBeInTheDocument();
  });

  it('verificado: la caducidad no se edita sin documento renovado', () => {
    render(<Harness initial={{ cif: { file: file('cif.pdf'), expiresAt: '2030-01-01', status: 'VERIFIED' } }} />);
    expect(screen.getByText(/verificado por origen/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/fecha de caducidad/i)[0]).toBeDisabled();
  });

  it('rechazado: muestra el motivo y pide subir uno nuevo', () => {
    render(<Harness initial={{ seguroRc: { status: 'REJECTED', rejectedReason: 'Ilegible' } }} />);
    expect(screen.getByText(/fue rechazado: Ilegible/i)).toBeInTheDocument();
  });

  it('declara certificaciones del catálogo (con denominación de origen) y no pide organismo emisor', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.queryByText(/organismo emisor/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /denominación de origen/i }));
    expect(screen.getByTestId('data')).toHaveTextContent('denominacion_origen');
    await user.click(screen.getByRole('button', { name: /denominación de origen/i }));
    expect(screen.getByTestId('data')).toHaveTextContent('[]');
  });

  it('una certificación verificada no se puede quitar', async () => {
    render(<Harness initial={{ certifications: [{ certificationId: 'ecologico', status: 'VERIFIED', file: file('e.pdf'), expiresAt: '2030-01-01' }] }} />);
    expect(screen.getByRole('button', { name: /agricultura ecológica/i })).toBeDisabled();
  });

  it('pinta los errores junto al campo', () => {
    render(<Harness errors={{ 'onb-doc-cif': 'Sube el documento: CIF / NIF.' }} />);
    expect(screen.getByText('Sube el documento: CIF / NIF.')).toBeInTheDocument();
  });
});
