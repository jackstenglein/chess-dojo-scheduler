import { EventType, Move } from '@jackstenglein/chess';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useReconcile } from '../Board';
import { BlockBoardKeyboardShortcuts, useChess } from './PgnBoard';
import VariationDialog from './VariationDialog';
import { UnderboardApi } from './boardTools/underboard/Underboard';
import {
    keyboardShortcutHandlers,
    matchAction,
    modifierKeys,
} from './boardTools/underboard/settings/KeyboardShortcuts';
import {
    ShortcutAction,
    ShortcutBindings,
} from './boardTools/underboard/settings/ShortcutAction';
import {
    VariationBehavior,
    VariationBehaviorKey,
} from './boardTools/underboard/settings/ViewerSettings';

interface KeyboardHandlerProps {
    underboardRef: React.RefObject<UnderboardApi>;
}

const KeyboardHandler: React.FC<KeyboardHandlerProps> = ({ underboardRef }) => {
    const { chess, board, keydownMap, toggleOrientation } = useChess();
    const reconcile = useReconcile();
    const [variationBehavior] = useLocalStorage(
        VariationBehaviorKey,
        VariationBehavior.Dialog,
    );
    const [variationDialogMove, setVariationDialogMove] = useState<Move | null>(null);
    const [keyBindings] = useLocalStorage(ShortcutBindings.key, ShortcutBindings.default);

    useEffect(() => {
        if (variationBehavior !== VariationBehavior.Dialog) {
            return;
        }

        const observer = {
            types: [
                EventType.LegalMove,
                EventType.NewVariation,
                EventType.Initialized,
                EventType.DeleteMove,
                EventType.DeleteBeforeMove,
                EventType.PromoteVariation,
            ],
            handler: () => setVariationDialogMove(null),
        };
        chess?.addObserver(observer);
        return () => chess?.removeObserver(observer);
    }, [chess, variationBehavior, setVariationDialogMove]);

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!chess || !board) {
                return;
            }

            if (modifierKeys.includes(event.key) && keydownMap) {
                keydownMap.current[event.key] = true;
            }

            const matchedAction = matchAction(
                keyBindings,
                event.code.replace('Key', ''),
                keydownMap?.current || {},
            );
            if (!matchedAction) {
                return;
            }

            const activeElement = document.activeElement;
            if (
                activeElement?.tagName === 'INPUT' ||
                activeElement?.id === BlockBoardKeyboardShortcuts ||
                activeElement?.classList.contains(BlockBoardKeyboardShortcuts)
            ) {
                if (matchedAction !== ShortcutAction.UnfocusTextField) {
                    return;
                }
            }

            event.preventDefault();
            event.stopPropagation();

            keyboardShortcutHandlers[matchedAction]?.({
                chess,
                board,
                reconcile,
                opts: {
                    underboardApi: underboardRef.current,
                    toggleOrientation,
                    setVariationDialogMove:
                        variationBehavior === VariationBehavior.Dialog
                            ? setVariationDialogMove
                            : undefined,
                },
            });
        },
        [
            board,
            chess,
            keyBindings,
            keydownMap,
            toggleOrientation,
            variationBehavior,
            setVariationDialogMove,
            underboardRef,
            reconcile,
        ],
    );

    const onKeyUp = useCallback(
        (event: KeyboardEvent) => {
            if (modifierKeys.includes(event.key) && keydownMap) {
                keydownMap.current[event.key] = false;
            }
        },
        [keydownMap],
    );

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }, [onKeyDown, onKeyUp]);

    if (!variationDialogMove) {
        return null;
    }

    return (
        <VariationDialog move={variationDialogMove} setMove={setVariationDialogMove} />
    );
};

export default KeyboardHandler;
