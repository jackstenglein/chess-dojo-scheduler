import { Chess, Event, EventType, Move } from '@jackstenglein/chess';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Button as MuiButton,
    Grid,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuList,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import React, { forwardRef, useEffect, useRef, useState } from 'react';

import { useLocalStorage } from 'usehooks-ts';
import { reconcile } from '../../Board';
import {
    convertClockToSeconds,
    formatTime,
    getIncrement,
    getInitialClock,
} from '../boardTools/underboard/ClockUsage';
import { ShowMoveTimesInPgnKey } from '../boardTools/underboard/settings/ViewerSettings';
import { compareNags, getStandardNag, nags } from '../Nag';
import { useChess } from '../PgnBoard';

export function getTextColor(move: Move, inline?: boolean): string {
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

interface ButtonProps {
    isCurrentMove: boolean;
    inline?: boolean;
    move: Move;
    onClickMove: (m: Move) => void;
    onRightClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    text: string;
    time?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { isCurrentMove, inline, move, onClickMove, onRightClick, text, time } = props;
    const displayNags = move.nags?.sort(compareNags).map((nag) => {
        const n = nags[getStandardNag(nag)];
        if (!n) return null;

        return (
            <Tooltip key={n.label} title={n.description}>
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
                color: isCurrentMove ? undefined : getTextColor(move, inline),
                backgroundColor: isCurrentMove ? 'primary' : 'initial',
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
        >
            {time ? (
                <Stack
                    direction='row'
                    alignItems='center'
                    justifyContent='space-between'
                    width={1}
                >
                    <div>
                        {text}
                        {displayNags}
                    </div>

                    <Typography
                        variant='caption'
                        color={isCurrentMove ? 'primary.contrastText' : 'info.main'}
                    >
                        {time}
                    </Typography>
                </Stack>
            ) : (
                <>
                    {text}
                    {displayNags}
                </>
            )}
        </MuiButton>
    );
});

interface MoveMenuProps {
    anchor?: HTMLElement;
    move: Move;
    onDelete: () => void;
    onClose: () => void;
}

const MoveMenu: React.FC<MoveMenuProps> = ({ anchor, move, onDelete, onClose }) => {
    const chess = useChess().chess!;

    const canPromote = chess.canPromoteVariation(move);

    const onClickDelete = () => {
        onDelete();
        onClose();
    };

    const onMakeMainline = () => {
        chess.promoteVariation(move, true);
        onClose();
    };

    const onPromote = () => {
        chess.promoteVariation(move);
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
            </MenuList>
        </Menu>
    );
};

interface MoveButtonProps {
    move: Move;
    firstMove?: boolean;
    inline?: boolean;
    forceShowPly?: boolean;
    onClickMove: (m: Move) => void;
    handleScroll: (child: HTMLButtonElement | null) => void;
}

const MoveButton: React.FC<MoveButtonProps> = ({
    move,
    firstMove,
    inline,
    forceShowPly,
    onClickMove,
    handleScroll,
}) => {
    const { chess, board, config } = useChess();
    const ref = useRef<HTMLButtonElement>(null);
    const [isCurrentMove, setIsCurrentMove] = useState(chess?.currentMove() === move);
    const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement>();
    const [, setForceRender] = useState(0);
    const [showMoveTimes] = useLocalStorage(ShowMoveTimesInPgnKey, false);

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
                    if (event.move === move) {
                        setIsCurrentMove(true);
                    } else if (event.previousMove === move) {
                        setIsCurrentMove(false);
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

    const onRightClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (config?.allowMoveDeletion) {
            event.preventDefault();
            event.stopPropagation();
            setMenuAnchorEl(event.currentTarget);
        }
    };

    const onDelete = () => {
        chess?.delete(move);
        reconcile(chess, board);
    };

    const handleMenuClose = () => {
        setMenuAnchorEl(undefined);
    };

    let moveText = move.san;

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
                <MoveMenu
                    anchor={menuAnchorEl}
                    move={move}
                    onDelete={onDelete}
                    onClose={handleMenuClose}
                />
            </>
        );
    }

    const moveTime = showMoveTimes ? getMoveTime(chess, move) : undefined;

    return (
        <Grid key={'move-' + move.ply} item xs={5}>
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
            <MoveMenu
                anchor={menuAnchorEl}
                move={move}
                onDelete={onDelete}
                onClose={handleMenuClose}
            />
        </Grid>
    );
};

function getMoveTime(chess: Chess | undefined, move: Move): string {
    const seconds = convertClockToSeconds(move.commentDiag?.clk);
    if (!seconds) {
        return '0';
    }

    let prev: Move | null | undefined = move;
    let prevSeconds = undefined;
    do {
        prev = prev.previous?.previous;
        prevSeconds = convertClockToSeconds(prev?.commentDiag?.clk);
    } while (prev && prevSeconds === undefined);

    if (prevSeconds === undefined) {
        prevSeconds = getInitialClock(chess?.pgn);
    }
    if (prevSeconds === 0) {
        return '0';
    }

    const increment = getIncrement(chess?.pgn);
    const elapsedSeconds = prevSeconds - seconds + increment;
    return formatTime(elapsedSeconds);
}

export default MoveButton;
