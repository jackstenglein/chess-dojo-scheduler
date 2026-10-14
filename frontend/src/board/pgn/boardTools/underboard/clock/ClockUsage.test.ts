import { Chess } from '@jackstenglein/chess';
import { describe, expect, it } from 'vitest';
import { Datum, getClosestMove, getRemainingSeries } from './ClockUsage';

const [e4, e5, nf3, nc6, bb5, a6] = new Chess({ pgn: '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6' }).history();

const moveNumbers = [0, 1, 2, 3];

const whiteClock: Datum[] = [
    { moveNumber: 0, seconds: 300, move: null },
    { moveNumber: 1, seconds: 280, move: e4 },
    { moveNumber: 2, seconds: 240, move: nf3 },
    { moveNumber: 3, seconds: 200, move: bb5 },
];
const blackClock: Datum[] = [
    { moveNumber: 0, seconds: 300, move: null },
    { moveNumber: 1, seconds: 290, move: e5 },
    { moveNumber: 2, seconds: 280, move: nc6 },
    { moveNumber: 3, seconds: 270, move: a6 },
];
const idealClock: Datum[] = [
    { moveNumber: 2, seconds: 250, move: nf3 },
    { moveNumber: 3, seconds: 220, move: bb5 },
];
const evalData: Datum[] = [
    { moveNumber: 0, seconds: 0, move: null, eval: 0 },
    { moveNumber: 1, seconds: 0, move: e5, eval: 0 },
    { moveNumber: 2, seconds: 0, move: nc6, eval: 1 },
    { moveNumber: 3, seconds: 0, move: a6, eval: 2 },
];

const ideal = getRemainingSeries('ideal', 'Ideal', 'green', idealClock, moveNumbers);
const evaluation = getRemainingSeries('eval', 'Eval', 'orange', evalData, moveNumbers);
const series = [
    getRemainingSeries('white', 'White', 'white', whiteClock, moveNumbers),
    getRemainingSeries('black', 'Black', 'black', blackClock, moveNumbers),
    ideal,
    evaluation,
];

// The x axis goes from move 0 at x = 50 to move 4 at x = 450. The clock axis goes from 0 s at
// y = 210 to 300 s at y = 10, and the eval axis from -3 to 3 over the same height.
const drawingArea = { left: 50, top: 10, width: 400, height: 200 };
const xOf = (moveNumber: number) => 50 + 100 * moveNumber;
const clockY = (seconds: number) => 210 - (seconds * 2) / 3;
const evalY = (value: number) => 110 - (value * 100) / 3;

function click(x: number, y: number) {
    return getClosestMove(
        series,
        { x, y },
        drawingArea,
        (px) => (px - 50) / 100,
        (yAxisId, value) => (yAxisId === 'eval' ? evalY(value) : clockY(value)),
    )?.move;
}

describe('getRemainingSeries', () => {
    it('aligns the data to the move numbers', () => {
        expect(ideal).toMatchObject({ yAxisId: 'clock', values: [null, null, 250, 220] });
        expect(ideal.moves).toEqual([null, null, nf3, bb5]);
        expect(evaluation).toMatchObject({ yAxisId: 'eval', values: [0, 0, 1, 2] });
    });
});

describe('getClosestMove', () => {
    it('returns the move of the closest line', () => {
        expect(click(xOf(2), clockY(240) + 2)).toBe(nf3);
        expect(click(xOf(2), clockY(280) - 1)).toBe(nc6);
    });

    it('rounds the click to the nearest move', () => {
        expect(click(xOf(2) + 40, clockY(240))).toBe(nf3);
        expect(click(xOf(2) + 60, clockY(200))).toBe(bb5);
    });

    it('measures the eval line on its own axis', () => {
        expect(click(xOf(2), evalY(1))).toBe(nc6);
    });

    it('skips series without a point at the clicked move', () => {
        // The ideal line has no point at move 1, so a click near 0 s picks the eval line.
        expect(click(xOf(1), clockY(0) - 5)).toBe(e5);
    });

    it('returns null for the starting position', () => {
        expect(click(xOf(0), clockY(300) + 2)).toBeNull();
    });

    it('ignores clicks outside the drawing area or past the last move', () => {
        expect(click(xOf(0) - 10, 100)).toBeUndefined();
        expect(click(xOf(2), clockY(0) + 5)).toBeUndefined();
        expect(click(xOf(4), 100)).toBeUndefined();
    });
});
