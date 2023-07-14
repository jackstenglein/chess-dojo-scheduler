import { Event, EventType, Move, Pgn, TAGS } from '@jackstenglein/chess';
import { Divider, Paper, Stack, Typography } from '@mui/material';

import { useChess } from './PgnBoard';
import { useEffect, useState } from 'react';

interface PlayerHeaderProps {
    type: 'header' | 'footer';
    orientation: 'white' | 'black';
    pgn?: Pgn;
}

export function getInitialClock(pgn: Pgn): string | undefined {
    const timeControl = pgn.header.tags[TAGS.TimeControl];
    if (!timeControl) {
        return undefined;
    }
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
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateCommand,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName !== 'clk'
                    ) {
                        return;
                    }
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    if (!pgn) {
        return null;
    }

    const currentMove = chess?.currentMove();

    let playerName = '';
    let playerElo = '';
    let playerResult = '';
    let move: Move | null | undefined = currentMove;

    if (
        (type === 'header' && orientation === 'white') ||
        (type === 'footer' && orientation === 'black')
    ) {
        playerName = pgn.header.tags.Black;
        playerElo = pgn.header.tags.BlackElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens && resultTokens.length > 1) {
            playerResult = resultTokens[1];
        }
        if (currentMove?.color !== 'b') {
            move = currentMove?.previous || null;
        }
    } else {
        playerName = pgn.header.tags.White;
        playerElo = pgn.header.tags.WhiteElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens && resultTokens.length > 1) {
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
