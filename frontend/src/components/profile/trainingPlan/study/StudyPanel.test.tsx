import { Timer, TimerContext } from '@/components/timer/TimerContext';
import { Requirement } from '@/database/requirement';
import { renderWithIntl } from '@/i18n/intl.test';
import { cleanup, fireEvent, screen } from '@testing-library/react';
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
        isDone: false,
        mark: { canUndo: false, saving: false, onUndo: vi.fn() },
        onMarkDone: vi.fn(),
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

describe('StudyPanel in read mode', () => {
    it('keeps the move list and Prev, Done, Next before a mark', () => {
        renderPanel();
        expect(screen.getByTestId('pgn-text')).toBeInTheDocument();
        expect(screen.getByTestId('study-prev')).toBeDisabled();
        expect(screen.getByTestId('study-mark-done')).toBeEnabled();
        expect(screen.getByTestId('study-next')).toBeEnabled();
        expect(screen.queryByTestId('study-undo-mark')).toBeNull();
        expect(screen.queryByTestId('study-mark-next')).toBeNull();
    });

    it('keeps Done off while the mark posts', () => {
        renderPanel({
            mark: { canUndo: false, saving: true, onUndo: vi.fn() },
        });
        expect(screen.getByTestId('study-mark-done')).toBeDisabled();
        expect(screen.queryByTestId('study-undo-mark')).toBeNull();
    });

    it('swaps Done for Undo and makes Next the primary action once marked', () => {
        const onUndo = vi.fn();
        const { props } = renderPanel({
            isDone: true,
            mark: { canUndo: true, saving: false, onUndo },
        });
        expect(screen.getByTestId('pgn-text')).toBeInTheDocument();
        expect(screen.queryByTestId('study-mark-done')).toBeNull();
        expect(screen.queryByTestId('study-next')).toBeNull();
        fireEvent.click(screen.getByTestId('study-undo-mark'));
        expect(onUndo).toHaveBeenCalledTimes(1);
        const next = screen.getByTestId('study-mark-next');
        expect(next).toHaveClass('MuiButton-contained');
        expect(next).toHaveTextContent('Next');
        fireEvent.click(next);
        expect(props.onSelect).toHaveBeenCalledWith(second);
    });

    it('keeps Undo off while the undo posts', () => {
        renderPanel({
            isDone: true,
            mark: { canUndo: true, saving: true, onUndo: vi.fn() },
        });
        expect(screen.getByTestId('study-undo-mark')).toBeDisabled();
        expect(screen.getByTestId('study-mark-next')).toBeEnabled();
    });

    it('offers Undo with the chevron still off on the last item', () => {
        renderPanel({
            current: second,
            isDone: true,
            mark: { canUndo: true, saving: false, onUndo: vi.fn() },
        });
        expect(screen.getByTestId('study-undo-mark')).toBeEnabled();
        expect(screen.queryByTestId('study-mark-next')).toBeNull();
        expect(screen.getByTestId('study-next')).toBeDisabled();
    });

    it('brings Done and the chevron back once the mark is undone', () => {
        const { rerender } = renderPanel({
            isDone: true,
            mark: { canUndo: true, saving: false, onUndo: vi.fn() },
        });
        expect(screen.getByTestId('study-undo-mark')).toBeVisible();
        rerender({ isDone: false, mark: { canUndo: false, saving: false, onUndo: vi.fn() } });
        expect(screen.queryByTestId('study-undo-mark')).toBeNull();
        expect(screen.queryByTestId('study-mark-next')).toBeNull();
        expect(screen.getByTestId('study-mark-done')).toBeEnabled();
        expect(screen.getByTestId('study-next')).toBeEnabled();
    });
});

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
