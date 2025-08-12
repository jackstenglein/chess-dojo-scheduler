import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PlayerNameWithTitle } from './PlayerNameWithTitle';

describe('PlayerNameWithTitle', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders name without title when no title provided', () => {
        render(<PlayerNameWithTitle name='Magnus Carlsen' />);
        expect(screen.getByText('Magnus Carlsen')).toBeInTheDocument();
        expect(screen.queryByText('GM')).not.toBeInTheDocument();
    });

    it('renders name with title when title provided', () => {
        render(<PlayerNameWithTitle name='Garry Kasparov' title='GM' />);
        expect(screen.getByText('Garry Kasparov')).toBeInTheDocument();
        expect(screen.getByText('GM')).toBeInTheDocument();
        expect(screen.getByLabelText('Grandmaster')).toBeInTheDocument();
    });

    it('renders title before name by default', () => {
        render(<PlayerNameWithTitle name='Bobby Fischer' title='IM' />);
        const container = screen.getByText('Bobby Fischer').parentElement;
        const titleElement = screen.getByLabelText('International Master');
        const nameElement = screen.getByText('Bobby Fischer');

        expect(container?.children[0]).toBe(titleElement);
        expect(container?.children[1]).toBe(nameElement);
    });

    it('renders title after name when titleBeforeName is false', () => {
        render(<PlayerNameWithTitle name='Anatoly Karpov' title='FM' titleBeforeName={false} />);
        const container = screen.getByText('Anatoly Karpov').parentElement;
        const titleElement = screen.getByLabelText('FIDE Master');
        const nameElement = screen.getByText('Anatoly Karpov');

        expect(container?.children[0]).toBe(nameElement);
        expect(container?.children[1]).toBe(titleElement);
    });

    it('applies custom typography variant', () => {
        render(<PlayerNameWithTitle name='Vishy Anand' title='GM' variant='h6' />);
        const nameElement = screen.getByText('Vishy Anand');
        expect(nameElement).toHaveClass('MuiTypography-h6');
    });

    it('handles empty name gracefully', () => {
        const { container } = render(<PlayerNameWithTitle name='' title='CM' />);
        expect(screen.getByText('CM')).toBeInTheDocument();
        // Just verify the component renders without crashing
        expect(container.firstChild).toBeInTheDocument();
    });

    it('handles special characters in name', () => {
        render(<PlayerNameWithTitle name='José R. Capablanca' title='WGM' />);
        expect(screen.getByText('José R. Capablanca')).toBeInTheDocument();
        expect(screen.getByText('WGM')).toBeInTheDocument();
    });
});
