import { render } from '@testing-library/react';
import { expect, it } from 'vitest';

import { PGNForm } from './PGNForm';

it('renders import button', async () => {
    const { getByRole } = render(<PGNForm loading={false} onSubmit={() => {}} />);

    expect(getByRole('button', { name: /import/i })).toBeDefined();
});
