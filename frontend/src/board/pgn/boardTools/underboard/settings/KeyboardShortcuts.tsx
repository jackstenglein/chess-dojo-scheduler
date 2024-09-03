import { Chess, Move } from '@jackstenglein/chess';
import { Help } from '@mui/icons-material';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid2,
    MenuItem,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { Fragment, useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { BoardApi } from '../../../../Board';
import { BlockBoardKeyboardShortcuts } from '../../../PgnBoard';
import { DefaultUnderboardTab, UnderboardApi } from '../Underboard';

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

    /** Open the PGN editor tab, if present. */
    OpenEditor = 'OPEN_EDITOR',

    /** Open the comments tab. */
    OpenComments = 'OPEN_COMMENTS',

    /** Open the database explorer tab. */
    OpenDatabase = 'OPEN_DATABASE',

    /** Open the clock usage tab. */
    OpenClocks = 'OPEN_CLOCKS',

    /** Open the settings tab. */
    OpenSettings = 'OPEN_SETTINGS',

    /**
     * Opens the editor tab and focuses the editor text field. If the editor tab is not present,
     * the comment tab textfield is focused.
     */
    FocusMainTextField = 'FOCUS_MAIN_TEXTFIELD',

    /** Opens the comments tab and focuses the text field. */
    FocusCommentTextField = 'FOCUS_COMMENT_TEXTFIELD',

    /** Unfocuses any currently-focused text field. */
    UnfocusTextField = 'UNFOCUS_TEXTFIELD',

    /** Inserts a null move. */
    InsertNullMove = 'INSERT_NULL_MOVE',
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
        case ShortcutAction.OpenComments:
            return 'Open Comments';
        case ShortcutAction.OpenDatabase:
            return 'Open Position Database';
        case ShortcutAction.OpenClocks:
            return 'Open Clock Usage';
        case ShortcutAction.OpenSettings:
            return 'Open Settings';
        case ShortcutAction.FocusMainTextField:
            return 'Focus Main Text Field';
        case ShortcutAction.FocusCommentTextField:
            return 'Focus Comment Text Field';
        case ShortcutAction.UnfocusTextField:
            return 'Unfocus Text Fields';
        case ShortcutAction.InsertNullMove:
            return 'Insert Null Move';
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
            return 'Open the Editor tab, if present.';
        case ShortcutAction.OpenComments:
            return 'Open the Comments tab.';
        case ShortcutAction.OpenDatabase:
            return 'Open the Position Database tab.';
        case ShortcutAction.OpenClocks:
            return 'Open the Clock Usage tab.';
        case ShortcutAction.OpenSettings:
            return 'Open the Settings tab.';
        case ShortcutAction.FocusMainTextField:
            return 'Open the Editor tab, if present, and focus the text field. If the Editor tab is not present, open the Comments tab and focus the text field.';
        case ShortcutAction.FocusCommentTextField:
            return 'Open the Comments tab and focus the text field.';
        case ShortcutAction.UnfocusTextField:
            return 'Unfocuses all text fields, allowing the usage of keyboard shortcuts and board controls.';
        case ShortcutAction.InsertNullMove:
            return 'Inserts a null move into the PGN, passing the turn to the other side without changing the position. Null moves cannot be added when in check or immediately after another null move.';
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
    [ShortcutAction.OpenComments]: { modifier: '', key: '' },
    [ShortcutAction.OpenDatabase]: { modifier: '', key: '' },
    [ShortcutAction.OpenClocks]: { modifier: '', key: '' },
    [ShortcutAction.OpenSettings]: { modifier: '', key: '' },
    [ShortcutAction.FocusMainTextField]: { modifier: '', key: '' },
    [ShortcutAction.FocusCommentTextField]: { modifier: '', key: '' },
    [ShortcutAction.UnfocusTextField]: { modifier: '', key: '' },
    [ShortcutAction.InsertNullMove]: { modifier: '', key: '' },
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

    /**
     * The API for imperatively interacting with the underboard.
     */
    underboardApi?: UnderboardApi | null;

    /**
     * Whether to allow showing the editor tab in the underboard.
     */
    showEditor?: boolean;

    /**
     * A function which toggles the orientation of the board.
     */
    toggleOrientation?: () => void;
}

interface ShortcutHandlerProps {
    /** The Chess instance to update. */
    chess?: Chess;

    /** The Board instance to update. */
    board?: BoardApi;

    /** The Chess/Board reconcile function. */
    reconcile?: () => void;

    /** The shortcut handler options. */
    opts?: ShortcutHandlerOptions;
}

/** A function which handles a keyboard shortcut. */
type ShortcutHandler = (props: ShortcutHandlerProps) => void;

/**
 * Goes to the first move in the given Chess instance.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 */
function handleFirstMove({ chess, reconcile }: ShortcutHandlerProps) {
    chess?.seek(null);
    reconcile?.();
}

/**
 * Goes to the previous move in the given Chess instance.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 */
function handlePreviousMove({ chess, reconcile }: ShortcutHandlerProps) {
    chess?.seek(chess.previousMove());
    reconcile?.();
}

/**
 * Goes to the next move, if one exists, in the given Chess instance or set the variation
 * dialog move if opts.setVariationDialog move is provided.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 * @param opts The options to use.
 */
function handleNextMove({ chess, reconcile, opts }: ShortcutHandlerProps) {
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
        reconcile?.();
    }
}

/**
 * Goes to the last move in the given Chess instance.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 */
function handleLastMove({ chess, reconcile }: ShortcutHandlerProps) {
    chess?.seek(chess.lastMove());
    reconcile?.();
}

/**
 * Handles toggling the orientation of the board. This function is a no-op if opts
 * does not contain a valid toggleOrientation function.
 * @param opts The options to use.
 */
function handleToggleOrientation({ opts }: ShortcutHandlerProps) {
    opts?.toggleOrientation?.();
}

/**
 * Goes to the first variation of the next move, if one exists. Otherwise goes to the next move.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 */
function handleFirstVariation({ chess, reconcile }: ShortcutHandlerProps) {
    let nextMove = chess?.nextMove();
    if (nextMove?.variations.length) {
        nextMove = nextMove.variations[0][0];
    }
    if (nextMove) {
        chess?.seek(nextMove);
        reconcile?.();
    }
}

/**
 * Goes to the first move of the current variation.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 */
function handleFirstMoveVariation({ chess, reconcile }: ShortcutHandlerProps) {
    const move = chess?.currentMove();
    if (move) {
        chess?.seek(move.variation[0]);
        reconcile?.();
    }
}

/**
 * Goes to the last move of the current variation.
 * @param chess The Chess instance to update.
 * @param reconcile The Chess/Board reconcile function.
 */
function handleLastMoveVariation({ chess, reconcile }: ShortcutHandlerProps) {
    const move = chess?.currentMove();
    if (move) {
        chess?.seek(move.variation[move.variation.length - 1]);
        reconcile?.();
    }
}

/**
 * Handles opening the Tags tab in the underboard. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleOpenTags({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.switchTab(DefaultUnderboardTab.Tags);
}

/**
 * Handles opening the Editor tab in the underboard. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleOpenEditor({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.switchTab(DefaultUnderboardTab.Editor);
}

/**
 * Handles opening the Comments tab in the underboard. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleOpenComments({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.switchTab(DefaultUnderboardTab.Comments);
}

/**
 * Handles opening the Database Explorer tab in the underboard. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleOpenDatabase({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.switchTab(DefaultUnderboardTab.Explorer);
}

/**
 * Handles opening the Clock Usage tab in the underboard. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleOpenClocks({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.switchTab(DefaultUnderboardTab.Clocks);
}

/**
 * Handles opening the Settings tab in the underboard. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleOpenSettings({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.switchTab(DefaultUnderboardTab.Settings);
}

/**
 * Handles focusing the main text field in the underboard. The main text field is
 * the Editor tab text field if the current user owns the current game and the
 * Comment tab text field otherwise. This function is a no-op if opts
 * does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleFocusMainTextField({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.focusEditor();
}

/**
 * Handles focusing the comment tab text field in the underboard. This function is a
 * no-op if opts does not contain a valid underboardApi object.
 * @param opts The options to use.
 */
function handleFocusCommentTextField({ opts }: ShortcutHandlerProps) {
    opts?.underboardApi?.focusCommenter();
}

/**
 * Handles unfocusing the currently-active text field.
 */
function handleUnfocusTextField() {
    const activeElement = document.activeElement;
    if (typeof (activeElement as HTMLElement).blur === 'function') {
        (activeElement as HTMLElement).blur();
    }
}

/**
 * Handles inserting a null move. If the current move is check or the game is over,
 * this function is a no-op.
 * @param chess The chess instance to update.
 */
function handleInsertNullMove({ chess, reconcile }: ShortcutHandlerProps) {
    if (
        chess?.disableNullMoves ||
        chess?.isCheck() ||
        chess?.isGameOver() ||
        chess?.currentMove()?.san === 'Z0'
    ) {
        return;
    }
    chess?.move('Z0');
    reconcile?.();
}

/**
 * Maps ShortcutActions to their handler functions. Not all ShortcutActions are included.
 */
export const keyboardShortcutHandlers: Record<ShortcutAction, ShortcutHandler> = {
    [ShortcutAction.FirstMove]: handleFirstMove,
    [ShortcutAction.PreviousMove]: handlePreviousMove,
    [ShortcutAction.NextMove]: handleNextMove,
    [ShortcutAction.LastMove]: handleLastMove,
    [ShortcutAction.ToggleOrientation]: handleToggleOrientation,
    [ShortcutAction.FirstVariation]: handleFirstVariation,
    [ShortcutAction.FirstMoveVariation]: handleFirstMoveVariation,
    [ShortcutAction.LastMoveVariation]: handleLastMoveVariation,
    [ShortcutAction.OpenTags]: handleOpenTags,
    [ShortcutAction.OpenEditor]: handleOpenEditor,
    [ShortcutAction.OpenComments]: handleOpenComments,
    [ShortcutAction.OpenDatabase]: handleOpenDatabase,
    [ShortcutAction.OpenClocks]: handleOpenClocks,
    [ShortcutAction.OpenSettings]: handleOpenSettings,
    [ShortcutAction.FocusMainTextField]: handleFocusMainTextField,
    [ShortcutAction.FocusCommentTextField]: handleFocusCommentTextField,
    [ShortcutAction.UnfocusTextField]: handleUnfocusTextField,
    [ShortcutAction.InsertNullMove]: handleInsertNullMove,
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
    key = key.toLowerCase();

    for (const action of Object.values(ShortcutAction)) {
        const binding = keyBindings[action] || defaultKeyBindings[action];

        if (binding.key.toLowerCase() === key) {
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
            setEditKey(event.code.replace('Key', ''));
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
        (<Stack>
            <Typography variant='h6'>Keyboard Shortcuts</Typography>
            <Typography variant='subtitle2' color='text.secondary'>
                Keyboard shortcuts are disabled while editing text fields (comments, clock
                times, tags, etc).
            </Typography>
            <Grid2 container rowGap={2} columnSpacing={2} alignItems='center' mt={1.5}>
                <Grid2 sx={{ borderBottom: 1, borderColor: 'divider' }} size={5}>
                    <Typography>Action</Typography>
                </Grid2>
                <Grid2 sx={{ borderBottom: 1, borderColor: 'divider' }} size={3.5}>
                    <Typography textAlign='center'>Modifier</Typography>
                </Grid2>
                <Grid2 sx={{ borderBottom: 1, borderColor: 'divider' }} size={3.5}>
                    <Typography textAlign='center'>Key</Typography>
                </Grid2>
                {Object.values(ShortcutAction).map((a) => {
                    const binding = keyBindings[a] || defaultKeyBindings[a];
                    return (
                        (<Fragment key={a}>
                            <Grid2 size={5}>
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <Typography variant='body2'>
                                        {displayShortcutAction(a)}
                                    </Typography>

                                    <Tooltip title={shortcutActionDescription(a)}>
                                        <Help sx={{ color: 'text.secondary' }} />
                                    </Tooltip>
                                </Stack>
                            </Grid2>
                            <Grid2 size={3.5}>
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
                            <Grid2 size={3.5}>
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
                        </Fragment>)
                    );
                })}
                <Grid2 size={12}>
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
                open={!!editAction}
                onClose={onCloseEditor}
                maxWidth='sm'
                fullWidth
                disableEscapeKeyDown
                classes={{
                    container: BlockBoardKeyboardShortcuts,
                }}
            >
                {editAction && (
                    <DialogTitle>
                        Edit Shortcut for <em>{displayShortcutAction(editAction)}</em>
                    </DialogTitle>
                )}
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
        </Stack>)
    );
};

export default KeyboardShortcuts;
