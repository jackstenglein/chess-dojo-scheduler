import { render } from '@testing-library/react';
import { expect, it } from 'vitest';
import { OnlineGameForm } from './OnlineGameForm';

it('renders import button', async () => {
    const { getByRole } = render(<OnlineGameForm loading={false} onSubmit={() => {}} />);

    expect(getByRole('button', { name: /import/i })).toBeDefined();
});
