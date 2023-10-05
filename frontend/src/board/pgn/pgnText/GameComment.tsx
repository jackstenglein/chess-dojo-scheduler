import { useEffect, useState } from 'react';
import { EventType, Event } from '@jackstenglein/chess';
import { Divider, Paper, Stack } from '@mui/material';

import { useChess } from '../PgnBoard';
import Markdown from './Markdown';

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
        <Paper elevation={3} sx={{ boxShadow: 'none', color: 'text.secondary' }}>
            <Stack>
                <Markdown text={chess?.pgn.gameComment.trim()} />
                <Divider sx={{ width: 1 }} />
            </Stack>
        </Paper>
    );
};

export default GameComment;
