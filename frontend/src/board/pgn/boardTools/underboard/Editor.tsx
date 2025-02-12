import { Chess, CommentType, Event, EventType, Move } from '@jackstenglein/chess';
import { Backspace, Edit, MoreHoriz } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    CardContent,
    FormControlLabel,
    IconButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    ToggleButtonProps,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { useReconcile } from '../../../Board';
import {
    Nag,
    evalNags,
    getNagInSet,
    getNagsInSet,
    moveNags,
    nags,
    positionalNags,
    setNagInSet,
    setNagsInSet,
} from '../../Nag';
import { nagIcons } from '../../NagIcon';
import { BlockBoardKeyboardShortcuts, useChess } from '../../PgnBoard';
import ClockTextField from './clock/ClockTextField';
import { TimeControlDescription } from './clock/TimeControlDescription';
import { DeletePrompt, useDeletePrompt } from './DeletePrompt';
import { TimeControlEditor } from './tags/TimeControlEditor';

interface NagButtonProps extends ToggleButtonProps {
    text: string;
    description: string;
}

const NagButton: React.FC<NagButtonProps> = ({ text, description, ...props }) => {
    return (
        <Tooltip title={description}>
            <span style={{ width: `${100 / 8}%` }}>
                <ToggleButton {...props} sx={{ width: 1 }}>
                    <Stack alignItems='center' justifyContent='center'>
                        <Typography
                            sx={{
                                whiteSpace: 'nowrap',
                                fontSize: '1.3rem',
                                fontWeight: '600',
                            }}
                        >
                            {text}
                        </Typography>
                    </Stack>
                </ToggleButton>
            </span>
        </Tooltip>
    );
};

interface EditorProps {
    focusEditor: boolean;
    setFocusEditor: (v: boolean) => void;
}

const Editor: React.FC<EditorProps> = ({ focusEditor, setFocusEditor }) => {
    const { chess, config } = useChess();
    const reconcile = useReconcile();
    const [, setForceRender] = useState(0);
    const textFieldRef = useRef<HTMLTextAreaElement>();
    const [showTimeControlEditor, setShowTimeControlEditor] = useState(false);
    const [commentType, setCommentType] = useState(CommentType.After);
    const { onDelete, deleteAction, onClose: onCloseDelete } = useDeletePrompt(chess);
    const [moreNagAnchorEl, setMoreNagAnchorEl] = useState<HTMLElement>();

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateCommand,
                    EventType.UpdateComment,
                    EventType.UpdateNags,
                    EventType.UpdateHeader,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName !== 'clk'
                    ) {
                        return;
                    }
                    if (
                        event.type === EventType.UpdateHeader &&
                        event.headerName !== 'TimeControl'
                    ) {
                        return;
                    }
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

    useEffect(() => {
        if (focusEditor && textFieldRef.current) {
            textFieldRef.current.focus();
            textFieldRef.current.selectionStart = textFieldRef.current.value.length;
            textFieldRef.current.selectionEnd = textFieldRef.current.selectionStart;
            setFocusEditor(false);
        }
    }, [focusEditor, setFocusEditor]);

    if (!chess) {
        return null;
    }

    const move = chess.currentMove();
    const isMainline = chess.isInMainline(move);

    let comment = '';
    if (!move) {
        comment = chess.pgn.gameComment.comment ?? '';
    } else if (!isMainline && commentType === CommentType.Before) {
        comment = move.commentMove ?? '';
    } else {
        comment = move.commentAfter ?? '';
    }

    const handleExclusiveNag =
        (nagSet: Nag[]) => (_event: unknown, newNag: string | null) => {
            const newNags = setNagInSet(newNag, nagSet, move?.nags);
            chess.setNags(newNags);
            reconcile();
        };

    const handleMultiNags = (nagSet: Nag[]) => (_event: unknown, newNags: string[]) => {
        console.log('Handle multi nags: ', newNags);
        chess.setNags(setNagsInSet(newNags, nagSet, move?.nags));
        reconcile();
    };

    const onMoreNags = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setMoreNagAnchorEl(e.currentTarget);
    };

    const onClickMenuNag = (nag: string) => {
        console.log('On Click Menu Nag: ', nag);
        const currentNags = getNagsInSet(positionalNags, move?.nags);
        console.log('Current Nags: ', currentNags);
        const index = currentNags.indexOf(nag);
        if (index < 0) {
            currentNags.push(nag);
        } else {
            currentNags.splice(index, 1);
        }
        console.log('New Nags: ', currentNags);
        handleMultiNags(positionalNags)(undefined, currentNags);
    };

    const onNullMove = () => {
        chess.move('Z0');
        reconcile();
    };

    const onUpdateTimeControl = (value: string) => {
        chess.setHeader('TimeControl', value);
        setShowTimeControlEditor(false);
    };

    const takebacksDisabled =
        config?.disableTakebacks === 'both' ||
        (Boolean(move) && config?.disableTakebacks?.[0] === move?.color);

    const nullMoveStatus = getNullMoveStatus(chess);

    return (
        <CardContent sx={{ height: { md: 1 } }}>
            <Stack
                spacing={3}
                mt={move ? 2 : undefined}
                pb={2}
                sx={{ height: { md: 1 } }}
            >
                {move && isMainline ? (
                    <ClockTextField label='Clock (hh:mm:ss)' move={move} />
                ) : (
                    !move && (
                        <Stack>
                            <Stack direction='row' alignItems='center' spacing={0.5}>
                                <Typography variant='subtitle1'>Time Control</Typography>

                                <Tooltip title='Edit time control'>
                                    <IconButton
                                        size='small'
                                        sx={{ position: 'relative', top: '-2px' }}
                                        onClick={() => setShowTimeControlEditor(true)}
                                    >
                                        <Edit fontSize='inherit' />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                            <TimeControlDescription
                                timeControls={
                                    chess.header().tags.TimeControl?.items || []
                                }
                            />
                        </Stack>
                    )
                )}

                {showTimeControlEditor && (
                    <TimeControlEditor
                        open={showTimeControlEditor}
                        initialItems={chess.header().tags.TimeControl?.items}
                        onCancel={() => setShowTimeControlEditor(false)}
                        onSuccess={onUpdateTimeControl}
                    />
                )}

                <Stack
                    sx={{
                        flexGrow: { md: 1 },
                    }}
                >
                    <TextField
                        inputRef={textFieldRef}
                        label='Comments'
                        id={BlockBoardKeyboardShortcuts}
                        multiline
                        minRows={isMainline ? 3 : 7}
                        value={comment}
                        onChange={(event) =>
                            chess.setComment(event.target.value, commentType)
                        }
                        fullWidth
                        sx={{
                            flexGrow: { md: 1 },
                            '& .MuiInputBase-root': {
                                md: {
                                    height: '100%',
                                    '& .MuiInputBase-input': {
                                        height: '100% !important',
                                    },
                                },
                            },
                        }}
                    />

                    {!isMainline && (
                        <RadioGroup
                            row
                            value={commentType}
                            onChange={(e) =>
                                setCommentType(e.target.value as CommentType)
                            }
                        >
                            <FormControlLabel
                                value={CommentType.Before}
                                control={<Radio size='small' />}
                                label='Comment Before'
                            />
                            <FormControlLabel
                                value={CommentType.After}
                                control={<Radio size='small' />}
                                label='Comment After'
                            />
                        </RadioGroup>
                    )}
                </Stack>

                <Stack spacing={1}>
                    <ToggleButtonGroup
                        disabled={!move}
                        exclusive
                        value={getNagInSet(moveNags, chess.currentMove()?.nags)}
                        onChange={handleExclusiveNag(moveNags)}
                    >
                        {moveNags.map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        disabled={!move}
                        exclusive
                        value={getNagInSet(evalNags, chess.currentMove()?.nags)}
                        onChange={handleExclusiveNag(evalNags)}
                    >
                        {evalNags.map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}
                    </ToggleButtonGroup>

                    <ToggleButtonGroup
                        disabled={!move}
                        value={getNagsInSet(positionalNags, chess.currentMove()?.nags)}
                        onChange={handleMultiNags(positionalNags)}
                    >
                        {positionalNags.slice(0, 7).map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}

                        <Tooltip title='View more'>
                            <span style={{ width: `${100 / 8}%` }}>
                                <ToggleButton
                                    value='more'
                                    sx={{ width: 1, height: 1 }}
                                    onClick={onMoreNags}
                                >
                                    <MoreHoriz />
                                </ToggleButton>
                            </span>
                        </Tooltip>
                    </ToggleButtonGroup>

                    <Menu
                        anchorEl={moreNagAnchorEl}
                        open={!!moreNagAnchorEl}
                        onClose={() => setMoreNagAnchorEl(undefined)}
                    >
                        {positionalNags.slice(7).map((nag) => (
                            <MenuItem
                                key={nag}
                                onClick={() => onClickMenuNag(nag)}
                                selected={move?.nags?.includes(nag)}
                            >
                                <ListItemIcon>
                                    {nagIcons[nag] ? nagIcons[nag] : nags[nag].label}
                                </ListItemIcon>
                                <ListItemText>{nags[nag].description}</ListItemText>
                            </MenuItem>
                        ))}
                    </Menu>
                </Stack>

                <Stack spacing={1}>
                    {!chess.disableNullMoves && (
                        <Tooltip title={nullMoveStatus.tooltip}>
                            <Box sx={{ width: 1 }}>
                                <Button
                                    disabled={nullMoveStatus.disabled}
                                    variant='outlined'
                                    onClick={onNullMove}
                                    fullWidth
                                >
                                    Insert null move
                                </Button>
                            </Box>
                        </Tooltip>
                    )}

                    <Button
                        startIcon={<CheckIcon />}
                        variant='outlined'
                        disabled={chess.isInMainline(move) || takebacksDisabled}
                        onClick={() => chess.promoteVariation(move, true)}
                    >
                        Make main line
                    </Button>
                    <Button
                        startIcon={<ArrowUpwardIcon />}
                        variant='outlined'
                        disabled={!chess.canPromoteVariation(move) || takebacksDisabled}
                        onClick={() => chess.promoteVariation(move)}
                    >
                        Move variation up
                    </Button>
                    <Tooltip
                        title='Delete this move and all moves after it'
                        disableInteractive
                    >
                        <Button
                            startIcon={<DeleteIcon />}
                            variant='outlined'
                            onClick={() => onDelete(move, 'after')}
                            disabled={
                                !config?.allowMoveDeletion || takebacksDisabled || !move
                            }
                        >
                            Delete from here
                        </Button>
                    </Tooltip>
                    <Tooltip
                        title={getDeleteBeforeTooltip({
                            allowDeleteBefore: config?.allowDeleteBefore,
                            takebacksDisabled,
                            isMainline,
                            move,
                        })}
                        disableInteractive
                    >
                        <span>
                            <Button
                                startIcon={<Backspace />}
                                variant='outlined'
                                onClick={() => onDelete(move, 'before')}
                                disabled={
                                    !config?.allowDeleteBefore ||
                                    takebacksDisabled ||
                                    !isMainline ||
                                    !move?.previous
                                }
                                fullWidth
                            >
                                Delete before here
                            </Button>
                        </span>
                    </Tooltip>
                </Stack>

                {deleteAction && (
                    <DeletePrompt deleteAction={deleteAction} onClose={onCloseDelete} />
                )}
            </Stack>
        </CardContent>
    );
};

export default Editor;

function getNullMoveStatus(chess: Chess): { disabled: boolean; tooltip: string } {
    if (chess.isCheck()) {
        return { disabled: true, tooltip: 'Null moves cannot be added while in check.' };
    }
    if (chess.isGameOver()) {
        return {
            disabled: true,
            tooltip: 'Null moves cannot be added while the game is over.',
        };
    }
    if (chess.currentMove()?.san === 'Z0') {
        return {
            disabled: true,
            tooltip: 'Multiple null moves cannot be added in a row.',
        };
    }
    return {
        disabled: false,
        tooltip: 'You can also add a null move by moving the king onto the enemy king.',
    };
}

function getDeleteBeforeTooltip({
    allowDeleteBefore,
    takebacksDisabled,
    isMainline,
    move,
}: {
    allowDeleteBefore?: boolean;
    takebacksDisabled?: boolean;
    isMainline?: boolean;
    move?: Move | null;
}) {
    if (!allowDeleteBefore || takebacksDisabled) {
        return 'This action is not allowed';
    }
    if (!isMainline) {
        return 'This action is only available for mainline moves';
    }
    if (!move?.previous) {
        return 'This action is not available for the first move';
    }
    return 'Make this the first move and delete all moves before it';
}
