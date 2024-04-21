import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import App from './App';

test('renders front page of app', async () => {
    render(<App />);
    const el = await screen.findByText(/training program/i);
    expect(el).toBeInTheDocument();
});
