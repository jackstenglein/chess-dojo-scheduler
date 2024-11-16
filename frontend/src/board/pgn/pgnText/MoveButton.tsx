import { useReconcile } from '@/board/Board';
import useGame from '@/context/useGame';
import { HIGHLIGHT_ENGINE_LINES } from '@/stockfish/engine/engine';
import { Chess, Event, EventType, Move, TimeControl } from '@jackstenglein/chess';
import { clockToSeconds } from '@jackstenglein/chess-dojo-common/src/pgn/clock';
import { Backspace, Help } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Grid,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuList,
    Button as MuiButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { LongPressEventType, LongPressReactEvents, useLongPress } from 'use-long-press';
import { useLocalStorage } from 'usehooks-ts';
import { formatTime } from '../boardTools/underboard/clock/ClockUsage';
import { ShowMoveTimesInPgn } from '../boardTools/underboard/settings/ViewerSettings';
import { compareNags, getStandardNag, nags } from '../Nag';
import { useChess } from '../PgnBoard';

export function getTextColor(
    move: Move,
    inline?: boolean,
    highlightEngineLines?: boolean,
): string {
    if (highlightEngineLines && move.commentDiag?.dojoEngine) {
        return 'error.main';
    }
    for (const nag of move.nags || []) {
        const color = nags[getStandardNag(nag)]?.color;
        if (color) {
            return color;
        }
    }
    if (inline) {
        return 'text.secondary';
    }
    return 'text.primary';
}

export interface ButtonProps {
    isCurrentMove: boolean;
    inline?: boolean;
    move: Move;
    onClickMove: (m: Move) => void;
    onRightClick: (
        event:
            | React.MouseEvent<HTMLButtonElement>
            | LongPressReactEvents<HTMLButtonElement>,
    ) => void;
    text: string;
    time?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { isCurrentMove, inline, move, onClickMove, onRightClick, text, time } = props;
    const { slots } = useChess();
    const longPress = useLongPress<HTMLButtonElement>(onRightClick, {
        detect: LongPressEventType.Touch,
        threshold: 700,
        onStart: (event) => {
            event.preventDefault();
        },
    });
    const [highlightEngineLines] = useLocalStorage<boolean>(
        HIGHLIGHT_ENGINE_LINES.Key,
        HIGHLIGHT_ENGINE_LINES.Default,
    );

    const displayNags = move.nags?.sort(compareNags).map((nag) => {
        const n = nags[getStandardNag(nag)];
        if (!n) return null;

        return (
            <Tooltip key={n.label} title={n.description} disableInteractive>
                <Typography
                    display='inline'
                    fontSize='inherit'
                    lineHeight='inherit'
                    fontWeight='inherit'
                >
                    {n.label}
                </Typography>
            </Tooltip>
        );
    });

    return (
        <MuiButton
            data-cy='pgn-text-move-button'
            ref={ref}
            variant={isCurrentMove ? 'contained' : 'text'}
            disableElevation
            sx={{
                textTransform: 'none',
                fontWeight: isCurrentMove ? 'bold' : 'inherit',
                color: isCurrentMove
                    ? undefined
                    : getTextColor(move, inline, highlightEngineLines),
                backgroundColor: isCurrentMove ? 'primary' : undefined,
                paddingRight: inline ? undefined : 2,

                // non-inline only props
                width: inline ? undefined : 1,
                height: inline ? undefined : 1,
                justifyContent: inline ? undefined : 'start',
                borderRadius: inline ? undefined : 0,
                pl: inline ? undefined : 1,

                // inline-only props
                zIndex: inline ? 2 : undefined,
                mx: inline ? 0 : undefined,
                px: inline ? '3px' : undefined,
                py: inline ? '1px' : undefined,
                minWidth: inline ? 'fit-content' : undefined,
                display: inline ? 'inline-block' : undefined,
            }}
            onClick={() => onClickMove(move)}
            onContextMenu={onRightClick}
            {...longPress()}
        >
            <Stack
                direction='row'
                alignItems='center'
                justifyContent='space-between'
                width={1}
            >
                <Stack direction='row' alignItems='center'>
                    {text}
                    {displayNags}
                    {move.isNullMove && (
                        <Tooltip
                            title='A null move passes the turn to the opponent and is commonly used for demonstrating a threat.'
                            disableInteractive
                        >
                            <Help
                                fontSize='inherit'
                                sx={{
                                    color: isCurrentMove ? 'inherit' : 'text.secondary',
                                    position: 'relative',
                                    top: -1,
                                    ml: 0.5,
                                }}
                            />
                        </Tooltip>
                    )}
                </Stack>

                <Stack direction='row' alignItems='center' gap={1}>
                    {slots?.moveButtonExtras && <slots.moveButtonExtras {...props} />}
                    {time && (
                        <Typography
                            variant='caption'
                            color={isCurrentMove ? 'primary.contrastText' : 'info.main'}
                            data-cy='elapsed-move-time'
                        >
                            {time}
                        </Typography>
                    )}
                </Stack>
            </Stack>
        </MuiButton>
    );
});
Button.displayName = 'Button';

interface MoveMenuProps {
    anchor?: HTMLElement;
    move: Move;
    onClose: () => void;
}

const MoveMenu = ({ anchor, move, onClose }: MoveMenuProps) => {
    const { chess, config } = useChess();
    const reconcile = useReconcile();

    if (!chess) {
        return null;
    }

    const canPromote = chess.canPromoteVariation(move);
    const canDeleteBefore =
        config?.allowDeleteBefore && chess.isInMainline(move) && !!move.previous;

    const onMakeMainline = () => {
        chess.promoteVariation(move, true);
        onClose();
    };

    const onPromote = () => {
        chess.promoteVariation(move);
        onClose();
    };

    const onClickDelete = () => {
        chess?.delete(move);
        reconcile();
        onClose();
    };

    const onClickDeleteBefore = () => {
        chess?.deleteBefore(move);
        reconcile();
        onClose();
    };

    return (
        <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={onClose}>
            <MenuList>
                <MenuItem disabled={chess.isInMainline(move)} onClick={onMakeMainline}>
                    <ListItemIcon>
                        <CheckIcon />
                    </ListItemIcon>
                    <ListItemText>Make main line</ListItemText>
                </MenuItem>

                <MenuItem disabled={!canPromote} onClick={onPromote}>
                    <ListItemIcon>
                        <ArrowUpwardIcon />
                    </ListItemIcon>
                    <ListItemText>Move variation up</ListItemText>
                </MenuItem>

                <MenuItem onClick={onClickDelete}>
                    <ListItemIcon>
                        <DeleteIcon />
                    </ListItemIcon>
                    <ListItemText>Delete from here</ListItemText>
                </MenuItem>

                <MenuItem disabled={!canDeleteBefore} onClick={onClickDeleteBefore}>
                    <ListItemIcon>
                        <Backspace />
                    </ListItemIcon>
                    <ListItemText>Delete up to here</ListItemText>
                </MenuItem>
            </MenuList>
        </Menu>
    );
};

interface MoveButtonProps {
    move: Move;
    firstMove?: boolean;
    inline?: boolean;
    forceShowPly?: boolean;
    handleScroll: (child: HTMLButtonElement | null) => void;
}

const MoveButton: React.FC<MoveButtonProps> = ({
    move,
    firstMove,
    inline,
    forceShowPly,
    handleScroll,
}) => {
    const { game } = useGame();
    const { chess, config } = useChess();
    const reconcile = useReconcile();
    const ref = useRef<HTMLButtonElement>(null);
    const [isCurrentMove, setIsCurrentMove] = useState(chess?.currentMove() === move);
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement>();
    const [, setForceRender] = useState(0);
    const [showMoveTimes] = useLocalStorage(
        ShowMoveTimesInPgn.Key,
        ShowMoveTimesInPgn.Default,
    );

    const onClickMove = useCallback(
        (move: Move | null) => {
            chess?.seek(move);
            reconcile();
        },
        [chess, reconcile],
    );

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateNags,
                    EventType.UpdateCommand,
                ],
                handler: (event: Event) => {
                    if (
                        event.type === EventType.LegalMove ||
                        event.type === EventType.NewVariation
                    ) {
                        if (event.move === move) {
                            setIsCurrentMove(true);
                        } else if (event.previousMove === move) {
                            setIsCurrentMove(false);
                        }
                    }

                    if (
                        event.type === EventType.UpdateCommand &&
                        event.commandName === 'clk' &&
                        event.move === move &&
                        showMoveTimes
                    ) {
                        setForceRender((v) => v + 1);
                    }

                    if (event.type === EventType.UpdateNags && event.move === move) {
                        setForceRender((v) => v + 1);
                    }

                    if (event.move === move || (firstMove && event.move === null)) {
                        handleScroll(ref.current);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [
        chess,
        move,
        firstMove,
        handleScroll,
        setIsCurrentMove,
        setForceRender,
        showMoveTimes,
    ]);

    useEffect(() => {
        setIsCurrentMove(chess?.currentMove() === move);
        if (
            chess?.currentMove() === move ||
            (firstMove && chess?.currentMove() === null)
        ) {
            handleScroll(ref.current);
        }
    }, [move, chess, setIsCurrentMove, firstMove, handleScroll]);

    const allowMoveDeletion = config?.allowMoveDeletion;
    const onRightClick = useCallback(
        (
            event:
                | React.MouseEvent<HTMLButtonElement>
                | LongPressReactEvents<HTMLButtonElement>,
        ) => {
            if (allowMoveDeletion) {
                event.preventDefault();
                event.stopPropagation();
                setMenuAnchorEl(event.currentTarget || event.target);
            }
        },
        [setMenuAnchorEl, allowMoveDeletion],
    );

    const handleMenuClose = () => {
        setMenuAnchorEl(undefined);
    };

    const moveText = move.san;

    if (inline) {
        let text = '';
        if (forceShowPly || move.ply % 2 === 1) {
            if (move.ply % 2 === 1) {
                text = `${Math.floor(move.ply / 2) + 1}. `;
            } else {
                text = `${Math.floor(move.ply / 2)}... `;
            }
        }
        text += moveText;

        return (
            <>
                <Button
                    ref={ref}
                    isCurrentMove={isCurrentMove}
                    inline={inline}
                    move={move}
                    onClickMove={onClickMove}
                    onRightClick={onRightClick}
                    text={text}
                />
                <MoveMenu anchor={menuAnchorEl} move={move} onClose={handleMenuClose} />
            </>
        );
    }

    const moveTime = showMoveTimes && game ? getMoveTime(chess, move) : undefined;

    return (
        <Grid key={`move-${move.ply}`} item xs={5}>
            <Button
                ref={ref}
                isCurrentMove={isCurrentMove}
                inline={inline}
                move={move}
                onClickMove={onClickMove}
                onRightClick={onRightClick}
                text={moveText}
                time={moveTime}
            />
            <MoveMenu anchor={menuAnchorEl} move={move} onClose={handleMenuClose} />
        </Grid>
    );
};

function getMoveTime(chess: Chess | undefined, move: Move): string {
    const seconds = clockToSeconds(move.commentDiag?.clk);
    if (!seconds) {
        return '0';
    }

    const moveNumber = Math.floor(move.ply / 2 + 0.5);

    let timeControl: TimeControl | undefined = undefined;
    let tcMoveNum = 0;
    let additionalTime = 0;

    const timeControls = chess?.header().tags.TimeControl?.items || [];

    for (let i = 0; i < timeControls.length; i++) {
        const tc = timeControls[i];
        if (!tc.moves) {
            timeControl = tc;
            break;
        }

        tcMoveNum += tc.moves || 0;
        if (moveNumber <= tcMoveNum) {
            timeControl = tc;
            additionalTime = Math.max(0, timeControls[i + 1]?.seconds || 0);
            break;
        }
    }

    if (!timeControl) {
        return '0';
    }

    let prev: Move | null | undefined = move;
    let prevSeconds = undefined;
    do {
        prev = prev.previous?.previous;
        prevSeconds = clockToSeconds(prev?.commentDiag?.clk);
    } while (prev && prevSeconds === undefined);

    if (prevSeconds === undefined) {
        prevSeconds = chess?.header().tags.TimeControl?.items[0]?.seconds || 0;
    }
    if (prevSeconds <= 0) {
        return '0';
    }

    const bonus = Math.max(0, timeControl.increment || timeControl.delay || 0);
    let elapsedSeconds = prevSeconds - seconds + bonus;
    if (tcMoveNum === moveNumber) {
        elapsedSeconds += additionalTime;
    }

    return formatTime(elapsedSeconds);
}

export default MoveButton;
