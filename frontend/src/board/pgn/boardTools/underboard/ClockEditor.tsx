import { Chess, Move } from '@jackstenglein/chess';
import { Edit } from '@mui/icons-material';
import { IconButton, Stack, Tooltip, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useChess } from '../../PgnBoard';
import ClockTextField from './ClockTextField';
import { formatTime } from './ClockUsage';
import { TimeControlDescription } from './TimeControlDescription';
import { TimeControlEditor } from './tags/TimeControlEditor';

export function convertSecondsToDateTime(seconds: number | undefined): DateTime | null {
    if (!seconds) {
        return null;
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const sec = Math.floor((seconds % 3600) % 60);
    const date = new Date();
    date.setHours(hours, minutes, sec);
    return DateTime.fromJSDate(date);
}

function convertDateTimeToClock(date: DateTime | null): string {
    if (!date?.isValid) {
        return '';
    }
    return formatTime(date.hour * 3600 + date.minute * 60 + date.second);
}

export function onChangeClock(chess: Chess, move: Move, value: DateTime | null) {
    const clk = convertDateTimeToClock(value);
    chess.setCommand('clk', clk, move);
}

const ClockEditor = () => {
    const { chess } = useChess();
    const [showTimeControlEditor, setShowTimeControlEditor] = useState(false);

    if (!chess) {
        return null;
    }

    const onUpdateTimeControl = (value: string) => {
        chess.setHeader('TimeControl', value);
        setShowTimeControlEditor(false);
    };

    const moves = chess.history();
    const grid = [];
    for (let i = 0; i < moves.length; i += 2) {
        grid.push(
            <Grid2 key={`${i}-white`} xs={6}>
                <ClockTextField
                    label={`${i / 2 + 1}. ${moves[i].san}`}
                    move={moves[i]}
                    forceSingleField
                />
            </Grid2>,
        );
        if (moves[i + 1]) {
            grid.push(
                <Grid2 key={`${i}-black`} xs={6}>
                    <ClockTextField
                        label={`${i / 2 + 1}... ${moves[i + 1].san}`}
                        move={moves[i + 1]}
                        forceSingleField
                    />
                </Grid2>,
            );
        }
    }

    return (
        <Grid2 container columnSpacing={1} rowGap={3} alignItems='center' pb={2}>
            <Grid2 xs={12}>
                <Stack direction='row' alignItems='center' spacing={0.5}>
                    <Typography variant='subtitle1'>Time Control</Typography>

                    <Tooltip title='Edit time control'>
                        <IconButton
                            size='small'
                            sx={{ position: 'relative', top: '-2px' }}
                            onClick={() => setShowTimeControlEditor(true)}
                        >
                            <Edit fontSize='inherit' />
                        </IconButton>
                    </Tooltip>
                </Stack>
                <TimeControlDescription
                    timeControls={chess.header().tags.TimeControl?.items || []}
                />

                {showTimeControlEditor && (
                    <TimeControlEditor
                        open={showTimeControlEditor}
                        initialItems={chess.header().tags.TimeControl?.items}
                        onCancel={() => setShowTimeControlEditor(false)}
                        onSuccess={onUpdateTimeControl}
                    />
                )}
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
    );
};

export default ClockEditor;
