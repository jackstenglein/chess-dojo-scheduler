import { AttemptScoring } from '@jackstenglein/chess-dojo-common/src/puzzlebase/scoring';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { formatDelta, ScoreSummary } from './ScoreSummary';

afterEach(cleanup);

const scoring = (over: Partial<AttemptScoring> = {}): AttemptScoring => ({
    accuracy: 1,
    speed: 0.92,
    score: 0.92,
    thinkingMs: 41_000,
    referenceMs: 30_000,
    counted: true,
    puzzleRating: 1600,
    expected: 0.4,
    ratingBefore: 2335,
    ratingAfter: 2341.4,
    delta: 6.4,
    ...over,
});

describe('formatDelta', () => {
    it('shows the sign and one decimal', () => {
        expect(formatDelta(6.42)).toBe('+6.4');
        expect(formatDelta(-3.06)).toBe('−3.1');
        expect(formatDelta(0)).toBe('±0');
        expect(formatDelta(0.04)).toBe('±0');
    });
});

describe('ScoreSummary', () => {
    it('shows the new rating, the change, and how the score was made up', () => {
        render(<ScoreSummary scoring={scoring()} />);
        expect(screen.getByText('2341')).toBeTruthy();
        expect(screen.getByText('+6.4')).toBeTruthy();
        expect(screen.getByText('100%')).toBeTruthy();
        expect(screen.getByText('92%')).toBeTruthy();
        expect(screen.getByText('Took 00:41 · average 00:30')).toBeTruthy();
        expect(screen.getByText('92')).toBeTruthy();
        expect(screen.queryByText(/vs puzzle/)).toBeNull();
    });

    it('shows a fall in rating', () => {
        render(<ScoreSummary scoring={scoring({ delta: -4.2, ratingAfter: 2330.8, score: 0 })} />);
        expect(screen.getByText('−4.2')).toBeTruthy();
        expect(screen.getByText('2331')).toBeTruthy();
    });

    it('says a repeat does not change the rating', () => {
        render(
            <ScoreSummary
                scoring={scoring({ counted: false, delta: undefined, ratingAfter: undefined })}
            />,
        );
        expect(screen.getByText(/does not change your rating/)).toBeTruthy();
        expect(screen.queryByText('Tactics rating')).toBeNull();
    });

    it('says when time is not counted yet', () => {
        render(<ScoreSummary scoring={scoring({ referenceMs: undefined, speed: 1 })} />);
        expect(screen.getByText(/not counted for this puzzle yet/)).toBeTruthy();
        expect(screen.queryByText(/average/)).toBeNull();
    });

    it('shows a placeholder while the server is scoring', () => {
        render(<ScoreSummary />);
        expect(screen.getByLabelText('Scoring')).toBeTruthy();
    });

    it('says so if the puzzle could not be scored', () => {
        render(<ScoreSummary failed />);
        expect(screen.getByText('This puzzle could not be scored.')).toBeTruthy();
    });
});
