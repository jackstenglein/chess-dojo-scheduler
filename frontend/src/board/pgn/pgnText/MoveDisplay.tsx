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

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.NewVariation],
                handler: (event: Event) => {
                    if (event.previousMove?.next === move) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, move, setForceRender]);

    const needReminder = move.previous === null || hasInterrupt(move.previous);

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
