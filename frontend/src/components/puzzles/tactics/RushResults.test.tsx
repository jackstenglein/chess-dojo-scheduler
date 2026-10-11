import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RushResults } from './RushResults';

afterEach(cleanup);

describe('RushResults', () => {
    it('marks each puzzle solved or missed, with its rating', () => {
        render(
            <RushResults
                results={[
                    { id: '001', rating: 1100, ok: true },
                    { id: '002', rating: 1250, ok: false },
                    { id: '003', rating: 1300, ok: true },
                ]}
            />,
        );
        expect(screen.getByLabelText('Solved 1100')).toBeTruthy();
        expect(screen.getByLabelText('Missed 1250')).toBeTruthy();
        expect(screen.getAllByLabelText(/^Solved/)).toHaveLength(2);
        expect(screen.getByText('1300')).toBeTruthy();
    });

    it('shows nothing before any puzzle is finished', () => {
        render(<RushResults results={[]} />);
        expect(screen.queryByLabelText('Puzzles this session')).toBeNull();
    });

    it('copes with a puzzle that has no rating', () => {
        render(<RushResults results={[{ id: '001', ok: true }]} />);
        expect(screen.getByLabelText('Solved')).toBeTruthy();
    });
});
