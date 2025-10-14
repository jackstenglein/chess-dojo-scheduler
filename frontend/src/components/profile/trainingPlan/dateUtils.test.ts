// Force a deterministic timezone for tests so Date-local calculations are stable.
const _OLD_TZ = process.env.TZ;
process.env.TZ = 'UTC';

import { afterAll, describe, expect, it } from 'vitest';
import { addLocalDaysIso, isSameLocalDay, startOfLocalDayIso } from './dateUtils';

afterAll(() => {
    // Restore original TZ after tests
    process.env.TZ = _OLD_TZ;
});

describe('dateUtils', () => {
    it('startOfLocalDayIso returns local day start for Date objects', () => {
        const d = new Date('2025-03-10T13:45:30Z');
        const expected = new Date(Date.UTC(2025, 2, 10)).toISOString(); // 2025-03-10T00:00:00.000Z
        expect(startOfLocalDayIso(d)).toBe(expected);
    });

    it('startOfLocalDayIso parses YYYY-MM-DD as local date-start', () => {
        const iso = '2025-03-10';
        const expected = new Date(Date.UTC(2025, 2, 10)).toISOString();
        expect(startOfLocalDayIso(iso)).toBe(expected);
    });

    it('addLocalDaysIso adds positive and negative days correctly', () => {
        const base = '2025-03-10';
        const plusTwo = addLocalDaysIso(base, 2);
        expect(plusTwo).toBe(new Date(Date.UTC(2025, 2, 12)).toISOString());

        const minusOne = addLocalDaysIso(new Date('2025-03-10T15:00:00Z'), -1);
        expect(minusOne).toBe(new Date(Date.UTC(2025, 2, 9)).toISOString());
    });

    it('addLocalDaysIso crosses year boundary', () => {
        expect(addLocalDaysIso('2024-12-31', 1)).toBe(new Date(Date.UTC(2025, 0, 1)).toISOString());
    });

    it('isSameLocalDay detects same and different local days', () => {
        const a = '2025-03-10T05:00:00Z';
        const b = '2025-03-10T23:59:59Z';
        expect(isSameLocalDay(a, b)).toBe(true);

        const c = '2025-03-11T00:00:00Z';
        expect(isSameLocalDay(a, c)).toBe(false);
    });
});
