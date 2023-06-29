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

interface MoveButtonProps {
    move: Move;
    inline?: boolean;
    forceShowPly?: boolean;
    onClickMove: (m: Move) => void;
}

const MoveButton: React.FC<MoveButtonProps> = ({
    move,
    inline,
    forceShowPly,
    onClickMove,
}) => {
    const currentMove = useCurrentMove().currentMove;
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (currentMove === move && ref.current) {
            ref.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }, [currentMove, move]);

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
                    color: move === currentMove ? undefined : 'text.secondary',
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
                    color: move === currentMove ? undefined : 'text.primary',
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
