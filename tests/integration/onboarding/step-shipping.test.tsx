/**
 * Paso 3 (envíos): la UI se adapta a la cobertura de Origen para el CP del negocio.
 */
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { render, screen } from '../../helpers/render';
import { EnhancedStep3Shipping } from '@/components/features/onboarding/components/steps/step-shipping';
import { INITIAL_FORM_DATA, type ShippingCoverage, type ShippingData } from '@/lib/onboarding/types';

vi.unmock('@arcediano/ux-library');

const covered: ShippingCoverage = {
  status: 'COVERED', postalCode: '41001', canDelegate: true,
  pickupRoute: { id: 'r1', name: 'Ruta Sevilla', warehouseName: 'Almacén Norte' }, currentChoice: null,
};
const notCovered: ShippingCoverage = { status: 'NOT_COVERED', postalCode: '99999', canDelegate: false, reason: 'Sin ruta para 99999', pickupRoute: null, currentChoice: null };
const missing: ShippingCoverage = { status: 'MISSING_POSTAL_CODE', postalCode: null, canDelegate: false, pickupRoute: null, currentChoice: null };

function Harness({ coverage, initial, onGoToStep = vi.fn(), loading = false, error = false }: {
  coverage: ShippingCoverage | null; initial?: Partial<ShippingData>; onGoToStep?: (n: number) => void; loading?: boolean; error?: boolean;
}) {
  const [data, setData] = React.useState<ShippingData>({ ...INITIAL_FORM_DATA.step3, ...initial });
  return (
    <>
      <EnhancedStep3Shipping data={data} onChange={setData} coverage={coverage} coverageLoading={loading} coverageError={error}
        onRetryCoverage={vi.fn()} onGoToStep={onGoToStep} />
      <output data-testid="choice">{data.deliveryChoice ?? 'none'}</output>
    </>
  );
}

describe('EnhancedStep3Shipping — cobertura', () => {
  it('COVERED: ofrece delegar (recomendado) o gestionarlo; al delegar muestra la ruta y oculta los métodos de envío', async () => {
    const user = userEvent.setup();
    render(<Harness coverage={covered} />);
    expect(screen.getByRole('button', { name: /delegar en origen \(recomendado\)/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /tus métodos de envío/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delegar en origen/i }));
    expect(screen.getByTestId('choice')).toHaveTextContent('delegated');
    expect(screen.getByTestId('pickup-route')).toHaveTextContent('Ruta Sevilla');
    expect(screen.getByTestId('pickup-route')).toHaveTextContent('Almacén Norte');
    expect(screen.queryByRole('heading', { name: /tus métodos de envío/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /lo gestiono yo/i }));
    expect(screen.getByRole('heading', { name: /tus métodos de envío/i })).toBeInTheDocument();
  });

  it('NOT_COVERED: solo "Lo gestiono yo", con el CP y el motivo, y se fija la elección', () => {
    render(<Harness coverage={notCovered} initial={{ deliveryChoice: 'delegated' }} />);
    expect(screen.getByText(/aún no tiene cobertura en tu código postal \(99999\)/i)).toBeInTheDocument();
    expect(screen.getByText(/sin ruta para 99999/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delegar en origen/i })).not.toBeInTheDocument();
    expect(screen.getByTestId('choice')).toHaveTextContent('own');
    expect(screen.getByRole('heading', { name: /tus métodos de envío/i })).toBeInTheDocument();
  });

  it('MISSING_POSTAL_CODE: avisa y lleva al paso 1', async () => {
    const user = userEvent.setup();
    const onGoToStep = vi.fn();
    render(<Harness coverage={missing} onGoToStep={onGoToStep} />);
    expect(screen.getByText(/completa primero la ubicación/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /ir a ubicación/i }));
    expect(onGoToStep).toHaveBeenCalledWith(1);
  });

  it('cargando y error', () => {
    const { unmount } = render(<Harness coverage={null} loading />);
    expect(screen.getByRole('status', { name: /comprobando cobertura/i })).toBeInTheDocument();
    unmount();
    render(<Harness coverage={null} error />);
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument();
  });

  it('no existe la opción "Recogida en local" ni métodos por defecto', async () => {
    const user = userEvent.setup();
    render(<Harness coverage={notCovered} />);
    expect(screen.queryByText(/recogida en local/i)).not.toBeInTheDocument();
    expect(screen.getByText(/aún no has añadido ningún método/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /añadir método de envío/i }));
    expect(screen.getByLabelText('Nombre')).toHaveValue('');
  });
});
