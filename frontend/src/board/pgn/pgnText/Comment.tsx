import { CommentType, Event, EventType, Move } from '@jackstenglein/chess';
import { useEffect, useState } from 'react';
import { useChess } from '../PgnBoard';
import Markdown from './Markdown';

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

    return <Markdown text={text} inline={inline} move={move} />;
};

export default Comment;
