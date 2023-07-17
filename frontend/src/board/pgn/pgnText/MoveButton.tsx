import { useEffect, useRef, useState } from 'react';
import { Button, Grid, Tooltip, Typography } from '@mui/material';
import { Event, EventType, Move } from '@jackstenglein/chess';

import { useChess } from '../PgnBoard';
import { compareNags, getStandardNag, nags } from '../Nag';

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

function handleScroll(
    child: HTMLButtonElement | null,
    scrollParent: HTMLDivElement | null
) {
    if (child && scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect();
        const childRect = child.getBoundingClientRect();

        scrollParent.scrollTop =
            childRect.top -
            parentRect.top +
            scrollParent.scrollTop -
            scrollParent.clientHeight / 2;
    }
}

interface MoveButtonProps {
    move: Move;
    scrollParent: HTMLDivElement | null;
    firstMove?: boolean;
    inline?: boolean;
    forceShowPly?: boolean;
    onClickMove: (m: Move) => void;
}

const MoveButton: React.FC<MoveButtonProps> = ({
    move,
    scrollParent,
    firstMove,
    inline,
    forceShowPly,
    onClickMove,
}) => {
    const { chess } = useChess();
    const ref = useRef<HTMLButtonElement>(null);
    const [isCurrentMove, setIsCurrentMove] = useState(chess?.currentMove() === move);
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
                        handleScroll(ref.current, scrollParent);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, move, firstMove, scrollParent, setIsCurrentMove, setForceRender]);

    let moveText = move.san;
    // for (const nag of move.nags?.sort(compareNags) || []) {
    //     moveText += renderNag(nag);
    // }

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
            <Button
                ref={ref}
                variant={isCurrentMove ? 'contained' : 'text'}
                disableElevation
                sx={{
                    textTransform: 'none',
                    zIndex: 2,
                    mx: 0,
                    px: '3px',
                    py: '1px',
                    minWidth: 'fit-content',
                    display: 'inline-block',
                    color: isCurrentMove ? undefined : getTextColor(move, true),
                    backgroundColor: isCurrentMove ? 'primary' : 'initial',
                    fontWeight: isCurrentMove ? 'bold' : 'inherit',
                }}
                onClick={() => onClickMove(move)}
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
            </Button>
        );
    }

    return (
        <Grid key={'move-' + move.ply} item xs={5}>
            <Button
                ref={ref}
                variant={isCurrentMove ? 'contained' : 'text'}
                disableElevation
                sx={{
                    width: 1,
                    height: 1,
                    textTransform: 'none',
                    justifyContent: 'start',
                    borderRadius: 0,
                    pl: 1,
                    color: isCurrentMove ? undefined : getTextColor(move),
                    backgroundColor: isCurrentMove ? 'primary' : 'initial',
                    fontWeight: isCurrentMove ? 'bold' : 'inherit',
                }}
                onClick={() => onClickMove(move)}
            >
                {moveText}
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
            </Button>
        </Grid>
    );
};

export default MoveButton;
