import React, { useEffect, useRef, useState, forwardRef } from 'react';
import {
    Button as MuiButton,
    Grid,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    MenuList,
    Tooltip,
    Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Event, EventType, Move } from '@jackstenglein/chess';

import { useChess } from '../PgnBoard';
import { compareNags, getStandardNag, nags } from '../Nag';
import { reconcile } from '../../Board';

function getTextColor(move: Move, inline?: boolean): string {
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

// function handleScroll(
//     child: HTMLButtonElement | null,
//     scrollParent: HTMLDivElement | null
// ) {
//     scrollParent = document.getElementById('pgn-text-scroll-parent') as HTMLDivElement;

//     console.log('Handle scroll: ', child, scrollParent);
//     if (child && scrollParent) {
//         const parentRect = scrollParent.getBoundingClientRect();
//         const childRect = child.getBoundingClientRect();

//         scrollParent.scrollTop =
//             childRect.top -
//             parentRect.top +
//             scrollParent.scrollTop -
//             scrollParent.clientHeight / 2;
//     }
// }

interface ButtonProps {
    isCurrentMove: boolean;
    inline?: boolean;
    move: Move;
    onClickMove: (m: Move) => void;
    onRightClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    text: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { isCurrentMove, inline, move, onClickMove, onRightClick, text } = props;
    return (
        <MuiButton
            ref={ref}
            variant={isCurrentMove ? 'contained' : 'text'}
            disableElevation
            sx={{
                textTransform: 'none',
                fontWeight: isCurrentMove ? 'bold' : 'inherit',
                color: isCurrentMove ? undefined : getTextColor(move, inline),
                backgroundColor: isCurrentMove ? 'primary' : 'initial',

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
            {text}
            {move.nags?.sort(compareNags).map((nag) => {
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
            })}
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

                <MenuItem onClick={onDelete}>
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

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.UpdateNags,
                ],
                handler: (event: Event) => {
                    if (event.move === move) {
                        setIsCurrentMove(true);
                    } else if (event.previousMove === move) {
                        setIsCurrentMove(false);
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
    }, [chess, move, firstMove, handleScroll, setIsCurrentMove, setForceRender]);

    useEffect(() => {
        console.log('Use effect firing for move: ', move);
        setIsCurrentMove(chess?.currentMove() === move);
    }, [move, chess, setIsCurrentMove]);

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

export default MoveButton;
