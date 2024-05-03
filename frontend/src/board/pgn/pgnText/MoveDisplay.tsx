import { Event, EventType, Move } from '@jackstenglein/chess';
import { useEffect, useState } from 'react';
import { useChess } from '../PgnBoard';
import Ellipsis from './Ellipsis';
import Interrupt, { hasInterrupt } from './Interrupt';
import MoveButton from './MoveButton';
import MoveNumber from './MoveNumber';

interface MoveProps {
    move: Move;
    handleScroll: (child: HTMLElement | null) => void;
    onClickMove: (m: Move) => void;
}

const MoveDisplay: React.FC<MoveProps> = ({ move, handleScroll, onClickMove }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);
    const [, setHasComment] = useState(move.commentAfter && move.commentAfter !== '');
    const [needReminder, setNeedReminder] = useState(
        move.previous === null || hasInterrupt(move.previous),
    );

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.NewVariation,
                    EventType.UpdateComment,
                    EventType.DeleteMove,
                    EventType.PromoteVariation,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.NewVariation &&
                        move === chess.getVariantParent(event.move)
                    ) {
                        setForceRender((v) => v + 1);
                    }
                    if (event.type === EventType.UpdateComment && move === event.move) {
                        setHasComment(
                            move.commentAfter && move.commentAfter.trim().length > 0,
                        );
                    }
                    if (
                        event.type === EventType.DeleteMove &&
                        move === event.mainlineMove
                    ) {
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.PromoteVariation &&
                        chess.isDescendant(move, event.move)
                    ) {
                        setForceRender((v) => v + 1);
                    }

                    if (
                        event.type === EventType.UpdateComment &&
                        move === event.move?.next
                    ) {
                        setNeedReminder(hasInterrupt(event.move));
                    }
                    if (
                        event.type === EventType.NewVariation &&
                        move.ply % 2 === 0 &&
                        move === chess.getVariantParent(event.move)?.next
                    ) {
                        setNeedReminder(true);
                    }
                    if (
                        event.type === EventType.DeleteMove &&
                        move === event.mainlineMove?.next
                    ) {
                        setNeedReminder(hasInterrupt(event.mainlineMove));
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, move, setForceRender, setNeedReminder]);

    useEffect(() => {
        setNeedReminder(move.previous === null || hasInterrupt(move.previous));
    }, [setNeedReminder, move]);

    return (
        <>
            {(move.ply % 2 === 1 || needReminder) && (
                <>
                    <MoveNumber key={`move-number-${move.ply}`} ply={move.ply} />

                    {move.ply % 2 === 0 && (
                        <Ellipsis key={`ellipsis-${move.ply}`} ply={move.ply} />
                    )}
                </>
            )}

            <MoveButton
                key={`move-button-${move.ply}`}
                move={move}
                handleScroll={handleScroll}
                onClickMove={onClickMove}
                firstMove={move.previous === null}
            />

            <Interrupt
                key={`interrupt-${move.ply}`}
                move={move}
                handleScroll={handleScroll}
                onClickMove={onClickMove}
            />
        </>
    );
};

export default MoveDisplay;
