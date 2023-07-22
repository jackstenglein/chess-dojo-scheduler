import { Event, EventType, Move } from '@jackstenglein/chess';
import { useEffect, useState } from 'react';

import MoveNumber from './MoveNumber';
import Ellipsis from './Ellipsis';
import Interrupt, { hasInterrupt } from './Interrupt';
import MoveButton from './MoveButton';
import { useChess } from '../PgnBoard';

interface MoveProps {
    move: Move;
    scrollParent: HTMLDivElement | null;
    onClickMove: (m: Move) => void;
}

const MoveDisplay: React.FC<MoveProps> = ({ move, scrollParent, onClickMove }) => {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);
    const [needReminder, setNeedReminder] = useState(
        move.previous === null || hasInterrupt(move.previous)
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
                    if (event.type === EventType.PromoteVariation) {
                        console.log('Promote event: ', event);
                    }

                    if (
                        event.type === EventType.NewVariation &&
                        move === event.previousMove?.next
                    ) {
                        setForceRender((v) => v + 1);
                    }
                    if (event.type === EventType.UpdateComment && move === event.move) {
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.DeleteMove &&
                        move === event.previousMove?.next
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
                        move === event.previousMove?.next?.next
                    ) {
                        setNeedReminder(true);
                    }
                    if (
                        event.type === EventType.DeleteMove &&
                        move === event.previousMove?.next?.next
                    ) {
                        setNeedReminder(hasInterrupt(event.previousMove.next));
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, move, setForceRender, setNeedReminder]);

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
                scrollParent={scrollParent}
                onClickMove={onClickMove}
                firstMove={move.previous === null}
            />

            <Interrupt
                key={`interrupt-${move.ply}`}
                move={move}
                scrollParent={scrollParent}
                onClickMove={onClickMove}
            />
        </>
    );
};

export default MoveDisplay;
