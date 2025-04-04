import { useAuth } from '@/auth/Auth';
import { Event, EventType, Move } from '@jackstenglein/chess';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { ShowSuggestedVariations } from '../boardTools/underboard/settings/ViewerSettings';
import { useChess } from '../PgnBoard';
import { Ellipsis } from './Ellipsis';
import Interrupt, { hasInterrupt } from './Interrupt';
import MoveButton from './MoveButton';
import MoveNumber from './MoveNumber';

interface MoveProps {
    move: Move;
    handleScroll: (child: HTMLElement | null) => void;
}

const MoveDisplay: React.FC<MoveProps> = ({ move, handleScroll }) => {
    const { user } = useAuth();
    const username = user?.username;
    const { chess } = useChess();
    const [, setForceRender] = useState(0);
    const [, setHasComment] = useState(move.commentAfter && move.commentAfter !== '');
    const [showSuggestedVariations] = useLocalStorage<boolean>(
        ShowSuggestedVariations.key,
        ShowSuggestedVariations.default,
    );
    const [needReminder, setNeedReminder] = useState(
        move.previous === null || hasInterrupt(move.previous, showSuggestedVariations, username),
    );

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.NewVariation,
                    EventType.UpdateComment,
                    EventType.DeleteMove,
                    EventType.DeleteBeforeMove,
                    EventType.PromoteVariation,
                ],
                handler: (event: Event) => {
                    if (event.type === EventType.DeleteBeforeMove && event.move === move) {
                        setNeedReminder(true);
                    }
                    if (
                        event.type === EventType.NewVariation &&
                        move === chess.getVariantParent(event.move)
                    ) {
                        setForceRender((v) => v + 1);
                    }
                    if (event.type === EventType.UpdateComment && move === event.move) {
                        setHasComment(move.commentAfter && move.commentAfter.trim().length > 0);
                    }
                    if (event.type === EventType.DeleteMove && move === event.mainlineMove) {
                        setForceRender((v) => v + 1);
                    }
                    if (
                        event.type === EventType.PromoteVariation &&
                        chess.isDescendant(move, event.move)
                    ) {
                        setForceRender((v) => v + 1);
                    }

                    if (event.type === EventType.UpdateComment && move === event.move?.next) {
                        setNeedReminder(
                            hasInterrupt(event.move, showSuggestedVariations, username),
                        );
                    }
                    if (
                        event.type === EventType.NewVariation &&
                        move.ply % 2 === 0 &&
                        move === chess.getVariantParent(event.move)?.next
                    ) {
                        setNeedReminder(true);
                    }
                    if (event.type === EventType.DeleteMove && move === event.mainlineMove?.next) {
                        setNeedReminder(
                            hasInterrupt(event.mainlineMove, showSuggestedVariations, username),
                        );
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, move, setForceRender, setNeedReminder, showSuggestedVariations, username]);

    useEffect(() => {
        setNeedReminder(
            move.previous === null ||
                hasInterrupt(move.previous, showSuggestedVariations, username),
        );
    }, [setNeedReminder, move, showSuggestedVariations, username]);

    return (
        <>
            {(move.ply % 2 === 1 || needReminder) && (
                <>
                    <MoveNumber key={`move-number-${move.ply}`} ply={move.ply} />

                    {move.ply % 2 === 0 && (
                        <Ellipsis
                            key={`ellipsis-${move.ply}`}
                            ply={move.ply}
                            firstMove={!move.previous}
                        />
                    )}
                </>
            )}

            <MoveButton
                key={`move-button-${move.ply}`}
                move={move}
                handleScroll={handleScroll}
                firstMove={move.previous === null}
            />

            <Interrupt key={`interrupt-${move.ply}`} move={move} handleScroll={handleScroll} />
        </>
    );
};

export default MoveDisplay;
