/**
 * Regresión UX: el checkbox de dirección de facturación debe mantener estado al clicar.
 */

import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { render, screen } from '../../helpers/render';
import { EnhancedStep1Location, type EnhancedLocationData } from '@/components/features/onboarding/components/steps/step-location';

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
    foundedYear: undefined,
    teamSize: undefined,
    taxId: '',
    entityType: undefined,
    legalRepresentativeName: '',
    businessPhone: '',
    billingAddressSameAsProduction: true,
    billingAddress: undefined,
  };
}

function StepLocationHarness() {
  const [data, setData] = React.useState<EnhancedLocationData>(buildInitialData());
  return <EnhancedStep1Location data={data} onChange={setData} />;
}

describe('EnhancedStep1Location — Dirección de facturación', () => {
  it('mantiene seleccionado/deseleccionado el checkbox al clicar y refleja los campos de facturación', async () => {
    const user = userEvent.setup();
    render(<StepLocationHarness />);

    const checkbox = screen.getByLabelText(/la dirección de facturación es la misma que la de producción/i);

    expect(checkbox).toBeChecked();
    expect(screen.queryByPlaceholderText(/^3º A, Local 1$/i)).not.toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(screen.getByPlaceholderText(/^3º A, Local 1$/i)).toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(screen.queryByPlaceholderText(/^3º A, Local 1$/i)).not.toBeInTheDocument();
  });
});
