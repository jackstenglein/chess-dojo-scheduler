import { Move, Pgn } from '@jackstenglein/chess';
import { Card } from '@mui/material';

import Result from './Result';
import Variation from './Variation';
import GameComment from './GameComment';

interface PgnTextProps {
    pgn: Pgn;
    currentMove: Move | null;
    onClickMove: (m: Move) => void;
}

const PgnText: React.FC<PgnTextProps> = ({ pgn, currentMove, onClickMove }) => {
    return (
        <Card sx={{ overflowY: 'scroll' }}>
            <GameComment pgn={pgn} />

            <Variation
                moves={pgn.history.moves}
                currentMove={currentMove}
                onClickMove={onClickMove}
            />

            <Result pgn={pgn} />
        </Card>
    );
};

export default PgnText;
