import { Move } from '@jackstenglein/chess';
import { Grid, Paper } from '@mui/material';

import MoveNumber from './MoveNumber';
import Ellipsis from './Ellipsis';
import MoveButton from './MoveButton';
import Interrupt, { hasInterrupt } from './Interrupt';

interface VariationProps {
    moves: Move[];
    onClickMove: (m: Move) => void;
}

const Variation: React.FC<VariationProps> = ({ moves, onClickMove }) => {
    const items: JSX.Element[] = [];

    let needReminder = false;
    for (const move of moves) {
        if (move.ply % 2 === 1 || needReminder) {
            items.push(<MoveNumber key={`move-number-${move.ply}`} ply={move.ply} />);

            if (move.ply % 2 === 0) {
                items.push(<Ellipsis key={`ellipsis-${move.ply}`} ply={move.ply} />);
            }
        }
        needReminder = false;

        items.push(
            <MoveButton
                key={`move-button-${move.ply}`}
                move={move}
                onClickMove={onClickMove}
                firstMove={move === moves[0]}
            />
        );

        if (hasInterrupt(move)) {
            items.push(
                <Interrupt
                    key={`interrupt-${move.ply}`}
                    move={move}
                    onClickMove={onClickMove}
                />
            );
            needReminder = true;
        }
    }

    return (
        <Paper elevation={4} sx={{ boxShadow: 'none' }}>
            <Grid container>{items}</Grid>
        </Paper>
    );
};

export default Variation;
