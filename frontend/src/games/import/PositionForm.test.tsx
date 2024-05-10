import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';

import { StartingPositionForm } from './StartingPositionForm';

it('renders import button', async () => {
    const { getByRole } = render(
        <LocalizationProvider dateAdapter={AdapterLuxon}>
            <StartingPositionForm loading={false} onSubmit={() => {}} />,
        </LocalizationProvider>,
    );

    expect(getByRole('button', { name: /import/i })).toBeDefined();
});
