import { useEffect, useRef } from 'react';
import { Button, Grid } from '@mui/material';
import { Move } from '@jackstenglein/chess';

import { useCurrentMove } from './PgnBoard';

function renderNag(nag: string): string {
    switch (nag) {
        case '$1':
            return '!';
        case '$2':
            return '?';
        case '$3':
            return '!!';
        case '$4':
            return '??';
        case '$5':
            return '!?';
        case '$6':
            return '?!';
        case '$7':
            return '□';
        case '$10':
            return '=';
        case '$11':
            return '=';
        case '$12':
            return '=';
        case '$13':
            return '∞';
        case '$14':
            return '⩲';
        case '$15':
            return '⩱';
        case '$16':
            return '±';
        case '$17':
            return '∓';
        case '$18':
            return '+−';
        case '$19':
            return '−+';
        case '$22':
            return '⨀';
        case '$23':
            return '⨀';
        case '$26':
            return '○';
        case '$27':
            return '○';
        case '$32':
            return '⟳';
        case '$33':
            return '⟳';
        case '$36':
            return '↑';
        case '$37':
            return '↑';
        case '$40':
            return '→';
        case '$41':
            return '→';
        case '$44':
            return '=∞';
        case '$45':
            return '=∞';
        case '$132':
            return '⇆';
        case '$133':
            return '⇆';
        case '$138':
            return '⨁';
        case '$139':
            return '⨁';
        case '$140':
            return '∆';
        case '$146':
            return 'N';
    }

    return '';
}

function getTextColor(move: Move, inline?: boolean): string {
    for (const nag of move.nags || []) {
        switch (nag) {
            case '$1':
                return '#5ddf73';
            case '$2':
                return '#e69d00';
            case '$3':
                return '#21c43a';
            case '$4':
                return '#df5353';
            case '$5':
                return '#f075e1';
            case '$6':
                return '#53b2ea';
        }
    }
    if (inline) {
        return 'text.secondary';
    }
    return 'text.primary';
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
    const currentMove = useCurrentMove().move;
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (
            ref.current &&
            scrollParent &&
            (currentMove === move || (firstMove && currentMove === null))
        ) {
            const parentRect = scrollParent.getBoundingClientRect();
            const childRect = ref.current.getBoundingClientRect();

            scrollParent.scrollTop =
                childRect.top -
                parentRect.top +
                scrollParent.scrollTop -
                scrollParent.clientHeight / 2;
        }
    }, [scrollParent, currentMove, move, firstMove]);

    let moveText = move.san;
    for (const nag of move.nags || []) {
        moveText += renderNag(nag);
    }

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
                variant={move === currentMove ? 'contained' : 'text'}
                disableElevation
                sx={{
                    textTransform: 'none',
                    zIndex: 2,
                    mx: 0,
                    px: '3px',
                    py: '1px',
                    minWidth: 'fit-content',
                    display: 'inline-block',
                    color: move === currentMove ? undefined : getTextColor(move, true),
                    backgroundColor: move === currentMove ? 'primary' : 'initial',
                    fontWeight: move === currentMove ? 'bold' : 'inherit',
                }}
                onClick={() => onClickMove(move)}
            >
                {text}
            </Button>
        );
    }

    return (
        <Grid key={'move-' + move.ply} item xs={5}>
            <Button
                ref={ref}
                variant={move === currentMove ? 'contained' : 'text'}
                disableElevation
                sx={{
                    width: 1,
                    height: 1,
                    textTransform: 'none',
                    justifyContent: 'start',
                    borderRadius: 0,
                    pl: 1,
                    color: move === currentMove ? undefined : getTextColor(move),
                    backgroundColor: move === currentMove ? 'primary' : 'initial',
                    fontWeight: move === currentMove ? 'bold' : 'inherit',
                }}
                onClick={() => onClickMove(move)}
            >
                {moveText}
            </Button>
        </Grid>
    );
};

export default MoveButton;
