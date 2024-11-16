import { Chess, CommentType, Event, EventType } from '@jackstenglein/chess';
import { Edit } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Box,
    Button,
    CardContent,
    FormControlLabel,
    IconButton,
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
import { BlockBoardKeyboardShortcuts, useChess } from '../../PgnBoard';
import ClockTextField from './clock/ClockTextField';
import { TimeControlDescription } from './clock/TimeControlDescription';
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
        chess.setNags(setNagsInSet(newNags, nagSet, move?.nags));
        reconcile();
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
        config?.disableTakebacks?.[0] === move?.color;

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
                        {positionalNags.map((nag) => (
                            <NagButton
                                key={nag}
                                value={nag}
                                text={nags[nag].label}
                                description={nags[nag].description}
                            />
                        ))}
                    </ToggleButtonGroup>
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
                    <Button
                        startIcon={<DeleteIcon />}
                        variant='outlined'
                        onClick={() => chess.delete(move)}
                        disabled={!config?.allowMoveDeletion || takebacksDisabled}
                    >
                        Delete from here
                    </Button>
                </Stack>
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
