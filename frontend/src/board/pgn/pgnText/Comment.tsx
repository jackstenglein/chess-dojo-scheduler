import { CommentType, Move, EventType, Event } from '@jackstenglein/chess';
import { Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useChess } from '../PgnBoard';

interface CommentProps {
    move: Move;
    type?: CommentType;
    inline?: boolean;
}

const Comment: React.FC<CommentProps> = ({ move, type, inline }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.UpdateComment],
                handler: (event: Event) => {
                    if (event.move === move) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, move, setForceRender]);

    const text = type === CommentType.Before ? move.commentMove : move.commentAfter;

    if (!text) {
        return null;
    }

    if (inline) {
        return (
            <Typography
                variant='caption'
                color='text.secondary'
                display='inline'
                mx='4px'
            >
                {text}
            </Typography>
        );
    }

    return (
        <Typography variant='body2' color='text.secondary' p='4px'>
            {text}
        </Typography>
    );
};

export default Comment;
