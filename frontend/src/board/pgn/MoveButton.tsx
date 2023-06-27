import { Button, Grid } from '@mui/material';
import { Move } from '@jackstenglein/chess';

interface MoveButtonProps {
    move: Move;
    currentMove: Move | null;
    inline?: boolean;
    forceShowPly?: boolean;
    onClickMove: (m: Move) => void;
}

const MoveButton: React.FC<MoveButtonProps> = ({
    move,
    currentMove,
    inline,
    forceShowPly,
    onClickMove,
}) => {
    if (inline) {
        let text = '';
        if (forceShowPly || move.ply % 2 === 1) {
            if (move.ply % 2 === 1) {
                text = `${Math.floor(move.ply / 2) + 1}. `;
            } else {
                text = `${Math.floor(move.ply / 2)}... `;
            }
        }
        text += move.san;

        return (
            <Button
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
                {move.san}
            </Button>
        </Grid>
    );
};

export default MoveButton;
