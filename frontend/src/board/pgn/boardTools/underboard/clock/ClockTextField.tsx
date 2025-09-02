import { BlockBoardKeyboardShortcuts, useChess } from '@/board/pgn/PgnBoard';
import { Chess, Move } from '@jackstenglein/chess';
import { clockToSeconds } from '@jackstenglein/chess-dojo-common/src/pgn/clock';
import { Stack, TextField } from '@mui/material';
import { TimeField } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { useLocalStorage } from 'usehooks-ts';
import { ClockFieldFormat, ClockFieldFormatKey } from '../settings/EditorSettings';
import { convertSecondsToDateTime, onChangeClock } from './ClockEditor';
import { formatTime } from './ClockUsage';

const d = new Date();
d.setHours(0, 0, 0);

const defaultDateTime = DateTime.fromJSDate(d);

interface ClockTextFieldProps {
    move: Move;
    label?: string;
    forceSingleField?: boolean;
}

const ClockTextField: React.FC<ClockTextFieldProps> = ({ move, label, forceSingleField }) => {
    const { chess } = useChess();
    const [clockFieldFormat] = useLocalStorage<string>(
        ClockFieldFormatKey,
        ClockFieldFormat.SingleField,
    );

    if (!chess) {
        return null;
    }

    if (clockFieldFormat === ClockFieldFormat.SingleField || forceSingleField) {
        return (
            <TimeField
                id={BlockBoardKeyboardShortcuts}
                label={label}
                format='HH:mm:ss'
                value={
                    convertSecondsToDateTime(clockToSeconds(move.commentDiag?.clk)) ||
                    defaultDateTime
                }
                onChange={(value) => onChangeClock(chess, move, value)}
                fullWidth
                className={BlockBoardKeyboardShortcuts}
            />
        );
    }

    if (clockFieldFormat === ClockFieldFormat.ThreeField) {
        const timeSlots = getTimeSlotsFromMove(move);

        return (
            <Stack direction='row' spacing={1}>
                <TextField
                    label='Hours'
                    id={BlockBoardKeyboardShortcuts}
                    value={timeSlots.hours}
                    disabled={!move}
                    onChange={(event) =>
                        onChangeTimeSlot('hours', event.target.value, timeSlots, chess, move)
                    }
                    fullWidth
                />
                <TextField
                    label='Minutes'
                    id={BlockBoardKeyboardShortcuts}
                    value={timeSlots.minutes}
                    disabled={!move}
                    onChange={(event) =>
                        onChangeTimeSlot('minutes', event.target.value, timeSlots, chess, move)
                    }
                    fullWidth
                />
                <TextField
                    label='Seconds'
                    id={BlockBoardKeyboardShortcuts}
                    value={timeSlots.seconds}
                    disabled={!move}
                    onChange={(event) =>
                        onChangeTimeSlot('seconds', event.target.value, timeSlots, chess, move)
                    }
                    fullWidth
                />
            </Stack>
        );
    }

    return null;
};

export default ClockTextField;

interface TimeSlots {
    hours: number;
    minutes: number;
    seconds: number;
}

function getTimeSlotsFromMove(move: Move): TimeSlots {
    const clock = move.commentDiag?.clk;
    if (!clock) {
        return { hours: 0, minutes: 0, seconds: 0 };
    }

    const slots = clock.split(':');
    const seconds = parseFloat(slots[slots.length - 1] || '0');
    const minutes = parseInt(slots[slots.length - 2] || '0');
    const hours = parseInt(slots[slots.length - 3] || '0');

    return {
        hours,
        minutes,
        seconds,
    };
}

function onChangeTimeSlot(
    slot: 'hours' | 'minutes' | 'seconds',
    value: string,
    timeSlots: TimeSlots,
    chess: Chess,
    move: Move,
) {
    let numValue = slot === 'seconds' ? parseFloat(value) : parseInt(value);
    if (isNaN(numValue) || numValue < 0) {
        numValue = 0;
    }

    const newSlots: TimeSlots = {
        ...timeSlots,
        [slot]: numValue,
    };

    chess.setCommand('clk', getClockFromTimeSlots(newSlots), move);
}

function getClockFromTimeSlots(slots: TimeSlots): string {
    const seconds = slots.seconds % 60;
    let minutes = slots.minutes + Math.floor(slots.seconds / 60);
    const hours = slots.hours + Math.floor(minutes / 60);
    minutes = minutes % 60;

    return formatTime(hours * 3600 + minutes * 60 + seconds);
}
