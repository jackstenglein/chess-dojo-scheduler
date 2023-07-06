import { Move, Pgn, TAGS } from '@jackstenglein/chess';
import { Divider, Paper, Stack, Typography } from '@mui/material';

import { useCurrentMove } from './PgnBoard';

interface PlayerHeaderProps {
    type: 'header' | 'footer';
    orientation: 'white' | 'black';
    pgn?: Pgn;
}

function getInitialClock(pgn: Pgn): string | undefined {
    const timeControl = pgn.header.tags[TAGS.TimeControl];
    const startTime = parseInt(timeControl.split('+')[0]);
    if (isNaN(startTime) || startTime <= 0) {
        return undefined;
    }

    let result = '';
    const hours = Math.floor(startTime / 3600);
    if (hours > 0) {
        result = `${hours}:`;
    }

    const minutes = Math.floor((startTime % 3600) / 60);
    result += `${minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:`;

    const seconds = (startTime % 3600) % 60;
    result += `${seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;

    return result;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ type, orientation, pgn }) => {
    const { move: currentMove } = useCurrentMove();

    if (!pgn) {
        return null;
    }

    let playerName = '';
    let playerElo = '';
    let playerResult = '';
    let move: Move | null = currentMove;

    if (
        (type === 'header' && orientation === 'white') ||
        (type === 'footer' && orientation === 'black')
    ) {
        playerName = pgn.header.tags.Black;
        playerElo = pgn.header.tags.BlackElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens.length > 1) {
            playerResult = resultTokens[1];
        }
        if (currentMove?.color !== 'b') {
            move = currentMove?.previous || null;
        }
    } else {
        playerName = pgn.header.tags.White;
        playerElo = pgn.header.tags.WhiteElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens.length > 0) {
            playerResult = resultTokens[0];
        }
        if (currentMove?.color !== 'w') {
            move = currentMove?.previous || null;
        }
    }

    return (
        <Paper
            elevation={3}
            sx={{
                boxShadow: 'none',
                height: 'fit-content',
                py: '3px',
                px: '6px',
            }}
        >
            <Stack direction='row' spacing={1} justifyContent='space-between'>
                <Stack direction='row' spacing={1}>
                    {playerResult && (
                        <>
                            <Typography
                                variant='subtitle2'
                                color='text.secondary'
                                fontWeight='bold'
                            >
                                {playerResult}
                            </Typography>
                            <Divider flexItem orientation='vertical' />
                        </>
                    )}

                    <Typography
                        variant='subtitle2'
                        color='text.secondary'
                        fontWeight='bold'
                    >
                        {playerName}
                    </Typography>

                    {playerElo && (
                        <Typography variant='subtitle2' color='text.secondary'>
                            ({playerElo})
                        </Typography>
                    )}
                </Stack>

                {move ? (
                    <Typography variant='subtitle2' color='text.secondary'>
                        {move.commentDiag?.clk}
                    </Typography>
                ) : (
                    <Typography variant='subtitle2' color='text.secondary'>
                        {getInitialClock(pgn)}
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
};

export default PlayerHeader;
