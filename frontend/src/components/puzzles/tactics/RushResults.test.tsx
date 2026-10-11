import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { RushResults } from './RushResults';

afterEach(cleanup);

describe('RushResults', () => {
    it('marks each puzzle solved or missed, with its rating', () => {
        render(
            <RushResults
                streak={2}
                results={[
                    { id: '001', rating: 1100, ok: true },
                    { id: '002', rating: 1250, ok: false },
                    { id: '003', rating: 1300, ok: true },
                    { id: '004', rating: 1340, ok: true },
                ]}
            />,
        );
        expect(screen.getByLabelText('Solved 1100')).toBeTruthy();
        expect(screen.getByLabelText('Missed 1250')).toBeTruthy();
        expect(screen.getAllByLabelText(/^Solved/)).toHaveLength(3);
        expect(screen.getByText('2')).toBeTruthy();
        expect(screen.getByText('in a row')).toBeTruthy();
    });

    it('shows just the streak before any puzzle is finished', () => {
        render(<RushResults streak={0} results={[]} />);
        expect(screen.getByText('0')).toBeTruthy();
        expect(screen.queryByLabelText(/^Solved|^Missed/)).toBeNull();
    });

    it('copes with a puzzle that has no rating', () => {
        render(<RushResults streak={1} results={[{ id: '001', ok: true }]} />);
        expect(screen.getByLabelText('Solved')).toBeTruthy();
    });
});
