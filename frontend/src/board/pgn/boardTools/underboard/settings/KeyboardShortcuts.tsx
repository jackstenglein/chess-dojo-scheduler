import { Chess, Move } from '@jackstenglein/chess';
import { Help } from '@mui/icons-material';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { BoardApi, reconcile } from '../../../../Board';
import { BlockBoardKeyboardShortcuts } from '../../../PgnBoard';

export const BoardKeyBindingsKey = 'boardKeyBindings';

export enum ShortcutAction {
    /** Go to the starting position of the game. */
    FirstMove = 'FIRST_MOVE',

    /** Go to the first move of the current variation. */
    FirstMoveVariation = 'FIRST_MOVE_VARIATION',

    /** Go to the move before the current move. */
    PreviousMove = 'PREVIOUS_MOVE',

    /** Go to the move after the current move. */
    NextMove = 'NEXT_MOVE',

    /** Go to the last move of the game. */
    LastMove = 'LAST_MOVE',

    /** Go to the last move of the current variation. */
    LastMoveVariation = 'LAST_MOVE_VARIATION',

    /** Toggle the orientation of the board. */
    ToggleOrientation = 'TOGGLE_ORIENTATION',

    /** Go to the first variation of the next move, or the next move if it has no variations. */
    FirstVariation = 'FIRST_VARIATION',

    /** Open the PGN tags tab. */
    OpenTags = 'OPEN_TAGS',

    /** Open the PGN editor tab. */
    OpenEditor = 'OPEN_EDITOR',

    /** Open the database explorer tab. */
    OpenDatabase = 'OPEN_DATABASE',

    /** Open the clock usage tab. */
    OpenClocks = 'OPEN_CLOCKS',

    /** Open the settings tab. */
    OpenSettings = 'OPEN_SETTINGS',
}

/**
 * Returns a user-facing display string for the given ShortcutAction.
 * @param action The action to display.
 * @returns The display string for the given ShortcutAction.
 */
function displayShortcutAction(action: ShortcutAction): string {
    switch (action) {
        case ShortcutAction.FirstMove:
            return 'First Move';
        case ShortcutAction.PreviousMove:
            return 'Previous Move';
        case ShortcutAction.NextMove:
            return 'Next Move';
        case ShortcutAction.LastMove:
            return 'Last Move';
        case ShortcutAction.ToggleOrientation:
            return 'Flip Board';
        case ShortcutAction.FirstVariation:
            return 'First Variation';
        case ShortcutAction.FirstMoveVariation:
            return 'First Move in Variation';
        case ShortcutAction.LastMoveVariation:
            return 'Last Move in Variation';
        case ShortcutAction.OpenTags:
            return 'Open Tags';
        case ShortcutAction.OpenEditor:
            return 'Open Editor';
        case ShortcutAction.OpenDatabase:
            return 'Open Position Database';
        case ShortcutAction.OpenClocks:
            return 'Open Clock Usage';
        case ShortcutAction.OpenSettings:
            return 'Open Settings';
    }
}

/**
 * Returns a user-facing description for the given ShortcutAction.
 * @param action The action to get a description for.
 * @returns The description for the given ShortcutAction.
 */
function shortcutActionDescription(action: ShortcutAction): string {
    switch (action) {
        case ShortcutAction.FirstMove:
            return 'Go to the starting position of the game.';
        case ShortcutAction.PreviousMove:
            return 'Go to the previous move.';
        case ShortcutAction.NextMove:
            return 'Go to the next move.';
        case ShortcutAction.LastMove:
            return 'Go to the last move of the game.';
        case ShortcutAction.ToggleOrientation:
            return 'Toggle the orientation of the board.';
        case ShortcutAction.FirstVariation:
            return 'Go to the first variation of the next move, if it has a variation. If it does not have a variation, go to the next move.';
        case ShortcutAction.FirstMoveVariation:
            return 'Go to the first move of the current variation.';
        case ShortcutAction.LastMoveVariation:
            return 'Go to the last move of the current variation.';
        case ShortcutAction.OpenTags:
            return 'Open the Tags tab.';
        case ShortcutAction.OpenEditor:
            return 'Open the Editor tab.';
        case ShortcutAction.OpenDatabase:
            return 'Open the Position Database tab.';
        case ShortcutAction.OpenClocks:
            return 'Open the Clock Usage tab.';
        case ShortcutAction.OpenSettings:
            return 'Open the Settings tab.';
    }
}

/**
 * Returns a user-facing display name for the given key.
 * @param key The key to display.
 * @returns The display string for the given key, or undefined if key is undefined.
 */
function displayKey(key?: string): string | undefined {
    if (key === ' ') {
        return 'Space';
    }
    return key;
}

interface KeyBinding {
    /** The modifier key set on the key binding, or the empty string if none is set. */
    modifier: string;

    /** The key set on the key binding, or the empty string if none is set. */
    key: string;
}

/**
 * The default key bindings to use if the user has not overridden anything.
 */
export const defaultKeyBindings: Record<ShortcutAction, KeyBinding> = {
    [ShortcutAction.FirstMove]: { modifier: '', key: '' },
    [ShortcutAction.PreviousMove]: { modifier: '', key: 'ArrowLeft' },
    [ShortcutAction.NextMove]: { modifier: '', key: 'ArrowRight' },
    [ShortcutAction.LastMove]: { modifier: '', key: '' },
    [ShortcutAction.ToggleOrientation]: { modifier: '', key: 'f' },
    [ShortcutAction.FirstVariation]: { modifier: 'Shift', key: 'ArrowRight' },
    [ShortcutAction.FirstMoveVariation]: { modifier: '', key: '' },
    [ShortcutAction.LastMoveVariation]: { modifier: '', key: '' },
    [ShortcutAction.OpenTags]: { modifier: '', key: '' },
    [ShortcutAction.OpenEditor]: { modifier: '', key: '' },
    [ShortcutAction.OpenDatabase]: { modifier: '', key: '' },
    [ShortcutAction.OpenClocks]: { modifier: '', key: '' },
    [ShortcutAction.OpenSettings]: { modifier: '', key: '' },
};

/** The valid modifier keys. */
export const modifierKeys = ['Shift', 'Control', 'Alt'];

/** Options passed to ShortcutHandler functions. Not all handlers use all options. */
interface ShortcutHandlerOptions {
    /**
     * A function to set the move for the variation dialog. If passed to handleNextMove
     * and the next move has variations, this function will be called with the move
     * instead of going to that move.
     */
    setVariationDialogMove?: (move: Move) => void;
}

/** A function which handles a keyboard shortcut, using the provided Chess and Board instances. */
type ShortcutHandler = (
    chess: Chess | undefined,
    board: BoardApi | undefined,
    opts?: ShortcutHandlerOptions,
) => void;

/**
 * Goes to the first move in the given Chess instance.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 */
function handleFirstMove(chess: Chess | undefined, board: BoardApi | undefined) {
    chess?.seek(null);
    reconcile(chess, board);
}

/**
 * Goes to the previous move in the given Chess instance.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 */
function handlePreviousMove(chess: Chess | undefined, board: BoardApi | undefined) {
    chess?.seek(chess.previousMove());
    reconcile(chess, board);
}

/**
 * Goes to the next move, if one exists, in the given Chess instance or set the variation
 * dialog move if opts.setVariationDialog move is provided.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 * @param opts The options to use.
 */
function handleNextMove(
    chess: Chess | undefined,
    board: BoardApi | undefined,
    opts?: ShortcutHandlerOptions,
) {
    const nextMove = chess?.nextMove();
    if (!nextMove) {
        return;
    }

    if (
        opts?.setVariationDialogMove &&
        nextMove.variations &&
        nextMove.variations.length > 0
    ) {
        opts.setVariationDialogMove(nextMove);
    } else {
        chess?.seek(nextMove);
        reconcile(chess, board);
    }
}

/**
 * Goes to the last move in the given Chess instance.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 */
function handleLastMove(chess: Chess | undefined, board: BoardApi | undefined) {
    chess?.seek(chess.lastMove());
    reconcile(chess, board);
}

/**
 * Goes to the first variation of the next move, if one exists. Otherwise goes to the next move.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 */
function handleFirstVariation(chess: Chess | undefined, board: BoardApi | undefined) {
    let nextMove = chess?.nextMove();
    if (nextMove?.variations.length) {
        nextMove = nextMove.variations[0][0];
    }
    if (nextMove) {
        chess?.seek(nextMove);
        reconcile(chess, board);
    }
}

/**
 * Goes to the first move of the current variation.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 */
function handleFirstMoveVariation(chess: Chess | undefined, board: BoardApi | undefined) {
    const move = chess?.currentMove();
    if (move) {
        chess?.seek(move.variation[0]);
        reconcile(chess, board);
    }
}

/**
 * Goes to the last move of the current variation.
 * @param chess The Chess instance to update.
 * @param board The Board instance to update.
 */
function handleLastMoveVariation(chess: Chess | undefined, board: BoardApi | undefined) {
    const move = chess?.currentMove();
    if (move) {
        chess?.seek(move.variation[move.variation.length - 1]);
        reconcile(chess, board);
    }
}

/**
 * Maps ShortcutActions to their handler functions. Not all ShortcutActions are included.
 */
export const keyboardShortcutHandlers: Partial<Record<ShortcutAction, ShortcutHandler>> =
    {
        [ShortcutAction.FirstMove]: handleFirstMove,
        [ShortcutAction.PreviousMove]: handlePreviousMove,
        [ShortcutAction.NextMove]: handleNextMove,
        [ShortcutAction.LastMove]: handleLastMove,
        [ShortcutAction.FirstVariation]: handleFirstVariation,
        [ShortcutAction.FirstMoveVariation]: handleFirstMoveVariation,
        [ShortcutAction.LastMoveVariation]: handleLastMoveVariation,
    };

/**
 * Matches an event key and modifiers to keyBindings, returning the matched action.
 * @param keyBindings The key bindings to match.
 * @param key The key to match.
 * @param modifiers The active modifiers to use when matching.
 * @returns The matched ShortcutAction or undefined if none match.
 */
export function matchAction(
    keyBindings: Record<ShortcutAction, KeyBinding>,
    key: string,
    modifiers: Record<string, boolean>,
): ShortcutAction | undefined {
    let matchedAction: ShortcutAction | undefined = undefined;
    const noModifiers = Object.values(modifiers).every((v) => !v);

    for (const action of Object.values(ShortcutAction)) {
        const binding = keyBindings[action] || defaultKeyBindings[action];

        if (binding.key.toLowerCase() === key.toLowerCase()) {
            if (
                (!binding.modifier && noModifiers) ||
                (binding.modifier && modifiers[binding.modifier])
            ) {
                // This is the exact shortcut, so we can stop looking
                matchedAction = action;
                break;
            }

            if (binding.modifier) {
                // The modifier is not used, so this shortcut doesn't actually match
                // and we must keep looking
                continue;
            }

            // This action matches but a modifier is in place, so there may be another
            // action that matches both the key and modifier, so we must keep looking
            matchedAction = action;
        }
    }

    return matchedAction;
}

/**
 * @returns A component for viewing and editing keyboard shortcuts.
 */
const KeyboardShortcuts = () => {
    const [keyBindings, setKeyBindings] = useLocalStorage(
        BoardKeyBindingsKey,
        defaultKeyBindings,
    );

    const [editAction, setEditAction] = useState<ShortcutAction>();
    const [editKey, setEditKey] = useState<string>();

    const onKeyDown = useCallback(
        (event: KeyboardEvent) => {
            if (!editAction) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (modifierKeys.includes(event.key)) {
                return;
            }
            setEditKey(event.key);
        },
        [editAction, setEditKey],
    );

    useEffect(() => {
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [onKeyDown]);

    const onChangeModifier = (action: ShortcutAction, modifier: string) => {
        setKeyBindings({
            ...keyBindings,
            [action]: {
                key: (keyBindings[action] || defaultKeyBindings[action]).key,
                modifier,
            },
        });
    };

    const onOpenEditor = (action: ShortcutAction) => {
        setEditAction(action);
        setEditKey((keyBindings[action] || defaultKeyBindings[action]).key);
    };

    const onCloseEditor = () => {
        setEditAction(undefined);
        setEditKey(undefined);
    };

    const onSaveEditor = () => {
        if (editAction) {
            setKeyBindings({
                ...keyBindings,
                [editAction]: {
                    key: editKey || '',
                    modifier: (keyBindings[editAction] || defaultKeyBindings[editAction])
                        .modifier,
                },
            });
        }
        onCloseEditor();
    };

    const onRemoveKey = () => {
        if (editAction) {
            setKeyBindings({
                ...keyBindings,
                [editAction]: {
                    key: '',
                    modifier: (keyBindings[editAction] || defaultKeyBindings[editAction])
                        .modifier,
                },
            });
        }
        onCloseEditor();
    };

    const onReset = () => {
        setKeyBindings(defaultKeyBindings);
    };

    return (
        <Stack>
            <Typography variant='h6'>Keyboard Shortcuts</Typography>
            <Typography variant='subtitle2' color='text.secondary'>
                Keyboard shortcuts are disabled while editing text fields (comments, clock
                times, tags, etc).
            </Typography>

            <Grid2 container rowGap={2} columnSpacing={2} alignItems='center' mt={1.5}>
                <Grid2 xs={5} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Typography>Action</Typography>
                </Grid2>
                <Grid2 xs={3.5} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Typography textAlign='center'>Modifier</Typography>
                </Grid2>
                <Grid2 xs={3.5} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Typography textAlign='center'>Key</Typography>
                </Grid2>
                {Object.values(ShortcutAction).map((a) => {
                    const binding = keyBindings[a] || defaultKeyBindings[a];
                    return (
                        <Fragment key={a}>
                            <Grid2 xs={5}>
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <Typography variant='body2'>
                                        {displayShortcutAction(a)}
                                    </Typography>

                                    <Tooltip title={shortcutActionDescription(a)}>
                                        <Help sx={{ color: 'text.secondary' }} />
                                    </Tooltip>
                                </Stack>
                            </Grid2>
                            <Grid2 xs={3.5}>
                                <TextField
                                    size='small'
                                    fullWidth
                                    select
                                    value={binding.modifier}
                                    onChange={(e) => onChangeModifier(a, e.target.value)}
                                    SelectProps={{
                                        displayEmpty: true,
                                    }}
                                >
                                    <MenuItem value=''>
                                        <em>None</em>
                                    </MenuItem>
                                    <MenuItem value='Shift'>Shift</MenuItem>
                                    <MenuItem value='Control'>Control</MenuItem>
                                    <MenuItem value='Alt'>
                                        Alt (Windows) / Option (Mac)
                                    </MenuItem>
                                </TextField>
                            </Grid2>
                            <Grid2 xs={3.5}>
                                <Button
                                    variant='contained'
                                    sx={{
                                        textTransform: 'none',
                                        width: 1,
                                        height: '36.5px',
                                    }}
                                    onClick={() => onOpenEditor(a)}
                                >
                                    {displayKey(binding.key)}
                                </Button>
                            </Grid2>
                        </Fragment>
                    );
                })}
                <Grid2 xs={12}>
                    <Button
                        color='error'
                        onClick={onReset}
                        sx={{ textTransform: 'none' }}
                    >
                        Reset All to Defaults
                    </Button>
                </Grid2>
            </Grid2>

            <Dialog
                open={Boolean(editAction)}
                onClose={onCloseEditor}
                maxWidth='sm'
                fullWidth
                classes={{
                    container: BlockBoardKeyboardShortcuts,
                }}
            >
                <DialogTitle>
                    Edit Shortcut for <em>{displayShortcutAction(editAction!)}</em>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Press any key to change the shortcut, then click save.
                    </DialogContentText>
                    <DialogContentText>
                        Current Key: {displayKey(editKey) || <em>None</em>}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCloseEditor}>Cancel</Button>
                    <Button color='error' onClick={onRemoveKey}>
                        Remove Shortcut
                    </Button>
                    <Button onClick={onSaveEditor}>Save</Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

export default KeyboardShortcuts;
