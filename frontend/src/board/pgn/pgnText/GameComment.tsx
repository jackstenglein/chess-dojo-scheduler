import { useEffect, useState } from 'react';
import { EventType, Event } from '@jackstenglein/chess';
import { Divider, Paper, Stack, Typography } from '@mui/material';

import { useChess } from '../PgnBoard';

const GameComment = () => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.UpdateComment],
                handler: (event: Event) => {
                    if (!event.move) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    if (!chess?.pgn.gameComment || chess.pgn.gameComment.trim() === '[#]') {
        return null;
    }

    return (
        <Paper elevation={3} sx={{ boxShadow: 'none' }}>
            <Stack>
                <Typography
                    variant='body2'
                    color='text.secondary'
                    p='6px'
                    whiteSpace='pre-line'
                >
                    {chess?.pgn.gameComment.trim()}
                </Typography>
                <Divider sx={{ width: 1 }} />
            </Stack>
        </Paper>
    );
};

export default GameComment;
