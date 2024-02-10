import Grid2 from '@mui/material/Unstable_Grid2';
import { LocalizationProvider, TimeField } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { TextField, Typography } from '@mui/material';
import { Move } from '@jackstenglein/chess';

import { ClockTextFieldId } from './Editor';
import {
    convertClockToSeconds,
    formatTime,
    getIncrement,
    getInitialClock,
} from './ClockUsage';
import { useChess } from '../../PgnBoard';

function convertSecondsToDate(seconds: number | undefined): Date | null {
    if (!seconds) {
        return null;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = Math.floor((seconds % 3600) % 60);
    const date = new Date();
    date.setHours(hours, minutes, sec);
    return date;
}

function convertDateToClock(date: Date | null): string {
    if (!date || isNaN(date.getTime())) {
        return '';
    }
    return formatTime(
        date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
    );
}

const ClockEditor = () => {
    const { chess } = useChess();

    if (!chess) {
        return null;
    }

    const initialClock = getInitialClock(chess?.pgn);
    const increment = getIncrement(chess?.pgn);

    const handleInitialClock = (value: Date | null) => {
        const seconds = value
            ? value.getHours() * 3600 + value.getMinutes() * 60 + value.getSeconds()
            : 0;

        let timeControl = `${seconds}`;
        if (increment) {
            timeControl += `+${increment}`;
        }

        chess.setHeader('TimeControl', timeControl);
    };

    const handleIncrement = (value: string) => {
        const increment = parseInt(value);
        if (isNaN(increment)) {
            chess.setHeader('TimeControl', `${initialClock}`);
        } else {
            chess.setHeader('TimeControl', `${initialClock}+${increment}`);
        }
    };

    const onChangeClock = (move: Move, value: Date | null) => {
        const clk = convertDateToClock(value);
        chess.setCommand('clk', clk, move);
    };

    const moves = chess.history();
    const grid = [];
    for (let i = 0; i < moves.length; i += 2) {
        grid.push(
            <Grid2 key={`${i}-white`} xs={6}>
                <TimeField
                    id={ClockTextFieldId}
                    label={`${i / 2 + 1}. ${moves[i].san}`}
                    format='HH:mm:ss'
                    value={convertSecondsToDate(
                        convertClockToSeconds(moves[i].commentDiag?.clk)
                    )}
                    onChange={(value) => onChangeClock(moves[i], value)}
                    fullWidth
                />
            </Grid2>
        );
        if (moves[i + 1]) {
            grid.push(
                <Grid2 key={`${i}-black`} xs={6}>
                    <TimeField
                        id={ClockTextFieldId}
                        label={`${i / 2 + 1}... ${moves[i + 1].san}`}
                        format='HH:mm:ss'
                        value={convertSecondsToDate(
                            convertClockToSeconds(moves[i + 1].commentDiag?.clk)
                        )}
                        onChange={(value) => onChangeClock(moves[i + 1], value)}
                        fullWidth
                    />
                </Grid2>
            );
        }
    }

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Grid2 container columnSpacing={1} rowGap={3} alignItems='center' pb={2}>
                <Grid2 xs={6}>
                    <TimeField
                        id={ClockTextFieldId}
                        label='Starting Time'
                        format='HH:mm:ss'
                        value={convertSecondsToDate(initialClock)}
                        onChange={(value) => handleInitialClock(value)}
                        fullWidth
                    />
                </Grid2>

                <Grid2 xs={6}>
                    <TextField
                        id={ClockTextFieldId}
                        label='Increment (Sec)'
                        value={`${increment}`}
                        onChange={(e) => handleIncrement(e.target.value)}
                        fullWidth
                    />
                </Grid2>

                <Grid2 xs={12} pb={1}>
                    <Typography component='p' variant='caption' textAlign='center'>
                        Set remaining clock time after each move below.
                        <br />
                        Moves left blank will use the last-set clock time.
                    </Typography>
                </Grid2>

                {grid}
            </Grid2>
        </LocalizationProvider>
    );
};

export default ClockEditor;
