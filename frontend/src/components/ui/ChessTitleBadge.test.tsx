import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ChessTitleBadge } from './ChessTitleBadge';

describe('ChessTitleBadge', () => {
    afterEach(() => {
        cleanup();
    });

    it('renders GM title correctly', () => {
        render(<ChessTitleBadge title='GM' />);
        expect(screen.getByText('GM')).toBeInTheDocument();
        expect(screen.getByLabelText('Grandmaster')).toBeInTheDocument();
    });

    it('renders IM title correctly', () => {
        render(<ChessTitleBadge title='IM' />);
        expect(screen.getByText('IM')).toBeInTheDocument();
        expect(screen.getByLabelText('International Master')).toBeInTheDocument();
    });

    it('renders FM title correctly', () => {
        render(<ChessTitleBadge title='FM' />);
        expect(screen.getByText('FM')).toBeInTheDocument();
        expect(screen.getByLabelText('FIDE Master')).toBeInTheDocument();
    });

    it('renders WGM title correctly', () => {
        render(<ChessTitleBadge title='WGM' />);
        expect(screen.getByText('WGM')).toBeInTheDocument();
        expect(screen.getByLabelText('Woman Grandmaster')).toBeInTheDocument();
    });

    it('does not render for unknown title', () => {
        const { container } = render(<ChessTitleBadge title='UNKNOWN' />);
        expect(container.firstChild).toBeNull();
    });

    it('does not render for empty title', () => {
        const { container } = render(<ChessTitleBadge title='' />);
        expect(container.firstChild).toBeNull();
    });

    it('applies custom styling', () => {
        const customSx = { backgroundColor: 'red' };
        render(<ChessTitleBadge title='CM' sx={customSx} />);
        const chip = screen.getByText('CM');
        expect(chip).toBeInTheDocument();
    });

    it('renders with medium size', () => {
        render(<ChessTitleBadge title='NM' size='medium' />);
        const chip = screen.getByText('NM');
        expect(chip).toBeInTheDocument();
    });
});
