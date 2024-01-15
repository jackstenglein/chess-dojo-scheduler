import { useEffect, useState } from 'react';
import { Stack, Divider, Typography } from '@mui/material';
import { TAGS, EventType, Event } from '@jackstenglein/chess';

import { useChess } from '../PgnBoard';

const Result = () => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.UpdateHeader],
                handler: (event: Event) => {
                    if (event.headerName === TAGS.Result) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    const result = chess?.pgn.header.tags[TAGS.Result];
    if (!result) {
        return null;
    }

    let title = result;
    let description = '';
    if (result === '1-0') {
        description = 'White Wins';
    } else if (result === '1/2-1/2') {
        title = '½-½';
        description = 'Draw';
    } else if (result === '0-1') {
        description = 'Black Wins';
    }

    if (!description) {
        return null;
    }

    return (
        <Stack alignItems='center'>
            <Divider sx={{ width: 1 }} />
            <Typography fontWeight='bold' mt={1}>
                {title}
            </Typography>
            <Typography mb={1} fontStyle='italic'>
                {description}
            </Typography>
        </Stack>
    );
};

export default Result;
