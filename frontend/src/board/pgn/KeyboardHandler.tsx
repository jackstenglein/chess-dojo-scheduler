import { Move } from '@jackstenglein/chess';
import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useReconcile } from '../Board';
import { BlockBoardKeyboardShortcuts, useChess } from './PgnBoard';
import VariationDialog from './VariationDialog';
import { UnderboardApi } from './boardTools/underboard/Underboard';
import {
    BoardKeyBindingsKey,
    ShortcutAction,
    defaultKeyBindings,
    keyboardShortcutHandlers,
    matchAction,
    modifierKeys,
} from './boardTools/underboard/settings/KeyboardShortcuts';
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
        VariationBehavior.None,
    );
    const [variationDialogMove, setVariationDialogMove] = useState<Move | null>(null);
    const [keyBindings] = useLocalStorage(BoardKeyBindingsKey, defaultKeyBindings);

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
