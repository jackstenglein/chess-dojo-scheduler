import { Timer, TimerContext } from '@/components/timer/TimerContext';
import { Requirement } from '@/database/requirement';
import { renderWithIntl } from '@/i18n/intl.test';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StudyBook, StudyItem } from './book';
import { StudyPanel, StudyPanelProps } from './StudyPanel';
import { StudySessionState } from './useStudy';

vi.mock('@/board/pgn/pgnText/PgnText', () => ({
    UnderboardPgnText: () => <div data-testid='pgn-text' />,
}));

const item = (key: string, name: string): StudyItem => ({
    kind: 'canonical',
    key,
    name,
    pgn: '',
    orientation: 'white',
    allowExport: false,
});
const first = item('k1', 'Problem 7');
const second = item('k2', 'Problem 8');
const book: StudyBook = {
    title: 'Polgar',
    chapters: [{ name: 'Problems', items: [first, second] }],
    skipped: 0,
};

const timer = {
    isRunning: false,
    isPaused: false,
    timerSeconds: 0,
    onStart: vi.fn(),
    onPause: vi.fn(),
} as unknown as Timer;

const session = { task: { id: 'polgar' } } as StudySessionState;

function renderPanel(overrides: Partial<StudyPanelProps> = {}, timerValue = timer) {
    const props: StudyPanelProps = {
        book,
        current: first,
        session,
        hasCopy: false,
        onSelect: vi.fn(),
        ...overrides,
    };
    const tree = (p: StudyPanelProps) => (
        <TimerContext.Provider value={timerValue}>
            <StudyPanel {...p} />
        </TimerContext.Provider>
    );
    const view = renderWithIntl(tree(props));
    return {
        props,
        rerender: (more: Partial<StudyPanelProps>) => view.rerender(tree({ ...props, ...more })),
    };
}

afterEach(cleanup);

describe('StudyPanel timer', () => {
    it('names the task the timer is running on as the navbar timer does', () => {
        const polgarM3 = {
            id: 'polgar-m3',
            name: 'Solve Polgar M3s through Problem {{count}}',
            shortName: 'Polgar M3s',
            sortPriority: '0',
        } as Requirement;
        renderPanel({}, { ...timer, isRunning: true, task: polgarM3 });
        expect(screen.getByText('The timer is running on Polgar M3s.')).toBeVisible();
        expect(screen.queryByTestId('study-pause-timer')).toBeNull();
    });
});
