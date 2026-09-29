import { formatTime } from '@/board/pgn/boardTools/underboard/clock/ClockUsage';
import { UnderboardPgnText } from '@/board/pgn/pgnText/PgnText';
import { getTaskName } from '@/components/timer/TimerButton';
import { TimerContext } from '@/components/timer/TimerContext';
import { Check, ChevronLeft, ChevronRight, Pause, PlayArrow, Undo } from '@mui/icons-material';
import { Button, IconButton, Stack, Typography } from '@mui/material';
import { useTranslations } from 'next-intl';
import { use } from 'react';
import { chapterOf, neighbours, StudyBook, StudyItem } from './book';
import { StudyBrowseNotice } from './StudyBrowseNotice';
import { StudySessionState } from './useStudy';

/** The last silent mark as the footer shows it. */
export interface MarkView {
    /** The last mark belongs to this item, so it can be reverted. */
    canUndo: boolean;
    /** A mark or an undo is posting. */
    saving: boolean;
    onUndo: () => void;
}

export interface StudyPanelProps {
    book: StudyBook;
    current: StudyItem;
    /** Absent in browse mode. */
    session?: StudySessionState;
    /** The board shows the student's copy of a course game. */
    hasCopy: boolean;
    isDone: boolean;
    /** The last silent mark. Absent in browse mode. */
    mark?: MarkView;
    onMarkDone: () => void;
    onSelect: (item: StudyItem) => void;
}

/**
 * The board's right panel: the item's name, the move list, the timer, and Prev / Done / Next.
 * Once the item is marked, Undo takes Done's slot and Next becomes the primary action.
 */
export function StudyPanel({
    book,
    current,
    session,
    hasCopy,
    isDone,
    mark,
    onMarkDone,
    onSelect,
}: StudyPanelProps) {
    const t = useTranslations('study');
    const chapter = chapterOf(book, current);
    const { prev, next } = neighbours(book, current);
    const onNext = next ? () => onSelect(next) : undefined;
    const undo = mark?.canUndo ? mark : undefined;
    const doneDisabled = isDone || Boolean(mark?.saving);

    return (
        <Stack data-testid='study-panel' sx={{ flexGrow: 1, minHeight: 0 }}>
            <Stack sx={{ px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
                <Typography variant='subtitle1' sx={{ fontWeight: 500 }} noWrap>
                    {current.name}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }} noWrap>
                    {chapter && chapter.name !== current.name ? chapter.name : book.title}
                </Typography>
                {hasCopy && (
                    <Typography
                        variant='caption'
                        sx={{ color: 'dojoOrange.main' }}
                        data-testid='study-your-copy'
                    >
                        {t('yourCopy')}
                    </Typography>
                )}
            </Stack>
            <Stack sx={{ flexGrow: 1, minHeight: 0 }}>
                <UnderboardPgnText />
            </Stack>
            <Stack sx={{ flexShrink: 0, borderTop: 1, borderColor: 'divider', p: 1.5, gap: 1 }}>
                <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
                    {session ? <TimerButton taskId={session.task.id} /> : <StudyBrowseNotice />}
                </Stack>
                <Stack direction='row' sx={{ alignItems: 'center', gap: 1 }}>
                    <IconButton
                        onClick={() => prev && onSelect(prev)}
                        disabled={!prev}
                        aria-label={t('session.previous')}
                        data-testid='study-prev'
                    >
                        <ChevronLeft />
                    </IconButton>
                    {session &&
                        (undo ? (
                            <Button
                                variant='outlined'
                                startIcon={<Undo />}
                                onClick={undo.onUndo}
                                disabled={undo.saving}
                                data-testid='study-undo-mark'
                                sx={{ flexGrow: 1 }}
                            >
                                {t('session.undo')}
                            </Button>
                        ) : (
                            <Button
                                variant='contained'
                                startIcon={<Check />}
                                onClick={onMarkDone}
                                disabled={doneDisabled}
                                data-testid='study-mark-done'
                                sx={{ flexGrow: 1 }}
                            >
                                {t('session.done')}
                            </Button>
                        ))}
                    {undo && onNext ? (
                        <Button
                            variant='contained'
                            endIcon={<ChevronRight />}
                            onClick={onNext}
                            data-testid='study-mark-next'
                            sx={{ ml: 'auto' }}
                        >
                            {t('session.next')}
                        </Button>
                    ) : (
                        <IconButton
                            onClick={onNext}
                            disabled={!onNext}
                            aria-label={t('session.next')}
                            data-testid='study-next'
                            sx={{ ml: 'auto' }}
                        >
                            <ChevronRight />
                        </IconButton>
                    )}
                </Stack>
            </Stack>
        </Stack>
    );
}

/**
 * Start, pause or resume the task's timer. Shows the time once the timer has run, and the
 * label before. The aria-label names the action.
 */
function TimerButton({ taskId }: { taskId: string }) {
    const t = useTranslations('study.session');
    const timer = use(TimerContext);
    const otherTask = timer.task && timer.task.id !== taskId;
    const time = formatTime(timer.timerSeconds);

    if (otherTask) {
        return (
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                {t('timerOtherTask', { name: timer.task ? getTaskName(timer.task) : '' })}
            </Typography>
        );
    }
    if (timer.isRunning) {
        return (
            <Button
                color='warning'
                startIcon={<Pause />}
                onClick={() => timer.onPause(taskId)}
                aria-label={t('pauseTimer', { time })}
                data-testid='study-pause-timer'
                sx={{ alignSelf: 'flex-start' }}
            >
                {time}
            </Button>
        );
    }
    const label = timer.timerSeconds > 0 ? t('resumeTimer', { time }) : t('startTimer');
    return (
        <Button
            color='warning'
            startIcon={<PlayArrow />}
            onClick={() => timer.onStart(taskId)}
            aria-label={label}
            data-testid='study-start-timer'
            sx={{ alignSelf: 'flex-start' }}
        >
            {timer.timerSeconds > 0 ? time : label}
        </Button>
    );
}
