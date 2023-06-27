import { Move } from '@jackstenglein/chess';

import MoveNumber from './MoveNumber';
import Ellipsis from './Ellipsis';
import MoveButton from './MoveButton';
import { Grid, Paper } from '@mui/material';
import Interrupt, { hasInterrupt } from './Interrupt';

interface VariationProps {
    moves: Move[];
    depth?: number;
    onClickMove: (m: Move) => void;
}

const Variation: React.FC<VariationProps> = ({ moves, depth = 0, onClickMove }) => {
    const renderVariation = (variation: Move[]): JSX.Element[] => {
        let needReminder = false;
        const items: JSX.Element[] = [];

        for (const move of variation) {
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

        return items;
    };

    const items = renderVariation(moves);

    return (
        <Paper elevation={depth ? depth + 4 : undefined} sx={{ boxShadow: 'none' }}>
            <Grid container>{items}</Grid>
        </Paper>
    );
};

export default Variation;
