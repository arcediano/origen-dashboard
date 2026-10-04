/**
 * Paso 1 del onboarding (ubicación e identidad legal, ADR-020).
 */

import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { render, screen } from '../../helpers/render';
import { EnhancedStep1Location, type EnhancedLocationData } from '@/components/features/onboarding/components/steps/step-location';

// El setup global sustituye la librería por stubs; aquí se prueba contra los componentes reales.
vi.unmock('@arcediano/ux-library');

function buildInitialData(): EnhancedLocationData {
  return {
    street: '',
    streetNumber: '',
    streetComplement: '',
    city: '',
    province: '',
    postalCode: '',
    categories: [],
    locationImages: [],
    taxId: '',
    entityType: undefined,
    legalRepresentativeName: '',
    businessPhone: '',
    billingAddressSameAsProduction: true,
    billingAddress: undefined,
  };
}

function Harness({ initial, errors, businessName = 'Huerta del Sol' }: {
  initial?: Partial<EnhancedLocationData>;
  errors?: Record<string, string>;
  businessName?: string;
}) {
  const [data, setData] = React.useState<EnhancedLocationData>({ ...buildInitialData(), ...initial });
  return <EnhancedStep1Location data={data} onChange={setData} errors={errors} businessName={businessName} />;
}

describe('EnhancedStep1Location — Dirección de facturación', () => {
  it('mantiene seleccionado/deseleccionado el checkbox al clicar y refleja los campos de facturación', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const checkbox = screen.getByLabelText(/es la misma que la dirección de producción/i);

    expect(checkbox).toBeChecked();
    expect(screen.queryByPlaceholderText(/^3º A$/i)).not.toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(screen.getByPlaceholderText(/^3º A$/i)).toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.queryByPlaceholderText(/^3º A$/i)).not.toBeInTheDocument();
  });
});

describe('EnhancedStep1Location — Representante legal opcional', () => {
  it('muestra el representante legal como opcional cuando la forma jurídica no es autónomo', () => {
    render(<Harness initial={{ entityType: 'sl' }} />);

    const legalRepInput = screen.getByPlaceholderText(/nombre y apellidos/i);
    expect(legalRepInput).not.toHaveAttribute('required');
    expect(screen.getByText(/opcional\. persona con poderes de representación/i)).toBeInTheDocument();
  });

  it('no lo muestra para autónomos', () => {
    render(<Harness initial={{ entityType: 'autonomo' }} />);
    expect(screen.queryByPlaceholderText(/nombre y apellidos/i)).not.toBeInTheDocument();
  });
});

describe('EnhancedStep1Location — rediseño (ADR-020)', () => {
  it('ya no pide año de fundación ni tamaño del equipo (se editan en Perfil comercial)', () => {
    render(<Harness />);
    expect(screen.queryByLabelText(/año de fundación/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/tamaño del equipo/i)).not.toBeInTheDocument();
  });

  it('muestra el nombre del negocio (del registro) solo lectura', () => {
    render(<Harness />);
    expect(screen.getByTestId('onb-business-name')).toHaveTextContent('Huerta del Sol');
  });

  it('avisa cuando falta el nombre del negocio (mínimo 3 caracteres)', () => {
    render(<Harness businessName="ab" />);
    expect(screen.getByText(/falta el nombre de tu negocio/i)).toBeInTheDocument();
  });

  it('autodetecta la provincia con el código postal', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.type(screen.getByLabelText(/código postal/i, { selector: '#onb-postal-code' }), '41001');
    expect(screen.getByLabelText('Provincia', { selector: '#onb-province' })).toHaveValue('Sevilla');
  });

  it('pinta el error de validación junto al campo', () => {
    render(<Harness errors={{ 'onb-tax-id': 'Introduce un NIF/CIF/NIE válido.' }} />);
    expect(screen.getByText('Introduce un NIF/CIF/NIE válido.')).toBeInTheDocument();
  });
});
