import { Move } from '@jackstenglein/chess';
import { Grid, Paper } from '@mui/material';

import MoveDisplay from './MoveDisplay';

interface VariationProps {
    moves: Move[];
    scrollParent: HTMLDivElement | null;
    onClickMove: (m: Move) => void;
}

const Variation: React.FC<VariationProps> = ({ moves, scrollParent, onClickMove }) => {
    return (
        <Paper sx={{ boxShadow: 'none' }}>
            <Grid container>
                {moves.map((move) => {
                    return (
                        <MoveDisplay
                            move={move}
                            scrollParent={scrollParent}
                            onClickMove={onClickMove}
                            key={move.ply}
                        />
                    );
                })}
            </Grid>
        </Paper>
    );
};

export default Variation;
