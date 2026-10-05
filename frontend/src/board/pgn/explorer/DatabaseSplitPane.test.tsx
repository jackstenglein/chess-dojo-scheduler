import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { calculateSplitRatio, DatabaseSplitPane, normalizeSplitRatio } from './DatabaseSplitPane';

describe('DatabaseSplitPane', () => {
    afterEach(() => {
        cleanup();
        window.localStorage.clear();
    });

    it('normalizes invalid and out-of-range ratios', () => {
        expect(normalizeSplitRatio(undefined)).toBe(0.5);
        expect(normalizeSplitRatio(Number.NaN)).toBe(0.5);
        expect(normalizeSplitRatio(0.1)).toBe(0.25);
        expect(normalizeSplitRatio(0.9)).toBe(0.8);
        expect(normalizeSplitRatio(0.6)).toBe(0.6);
    });

    it('calculates a clamped ratio from the pointer position', () => {
        expect(calculateSplitRatio(506, 0, 1012)).toBe(0.5);
        expect(calculateSplitRatio(-100, 0, 1012)).toBe(0.25);
        expect(calculateSplitRatio(1200, 0, 1012)).toBe(0.8);
    });

    it('restores and persists keyboard resizing', () => {
        window.localStorage.setItem('test.databaseSplit', JSON.stringify(0.65));

        render(
            <DatabaseSplitPane
                storageKey='test.databaseSplit'
                resizeLabel='Resize'
                top={<div>Move stats</div>}
                bottom={<div>Matching games</div>}
            />,
        );

        const separator = screen.getByRole('separator', { name: 'Resize' });
        expect(separator).toHaveAttribute('aria-valuenow', '65');
        expect(screen.getByText('Move stats')).toBeInTheDocument();
        expect(screen.getByText('Matching games')).toBeInTheDocument();

        fireEvent.keyDown(separator, { key: 'ArrowDown' });

        expect(separator).toHaveAttribute('aria-valuenow', '70');
        expect(JSON.parse(window.localStorage.getItem('test.databaseSplit') ?? '')).toBeCloseTo(
            0.7,
        );
    });

    it('keeps keyboard resizing within the pane limits', () => {
        render(
            <DatabaseSplitPane
                storageKey='test.databaseSplit'
                resizeLabel='Resize'
                top={<div>Move stats</div>}
                bottom={<div>Matching games</div>}
            />,
        );

        const separator = screen.getByRole('separator', { name: 'Resize' });
        expect(separator).toHaveAttribute('aria-valuemin', '25');
        fireEvent.keyDown(separator, { key: 'Home' });
        fireEvent.keyDown(separator, { key: 'ArrowUp' });
        expect(separator).toHaveAttribute('aria-valuenow', '25');

        fireEvent.keyDown(separator, { key: 'End' });
        fireEvent.keyDown(separator, { key: 'ArrowDown' });
        expect(separator).toHaveAttribute('aria-valuenow', '80');
    });
});
