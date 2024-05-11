import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

import { PositionForm } from './PositionForm';

it('renders import button', async () => {
    const { getByRole } = render(
        <LocalizationProvider dateAdapter={AdapterLuxon}>
            <PositionForm loading={false} onSubmit={() => {}} />,
        </LocalizationProvider>,
    );

    expect(getByRole('button', { name: /import/i })).toBeDefined();
});
