import { Move, Pgn } from '@jackstenglein/chess';
import { Card } from '@mui/material';

import Result from './Result';
import Variation from './Variation';
import GameComment from './GameComment';

interface PgnTextProps {
    pgn: Pgn;
    onClickMove: (m: Move) => void;
}

const PgnText: React.FC<PgnTextProps> = ({ pgn, onClickMove }) => {
    return (
        <Card sx={{ overflowY: 'scroll' }}>
            <GameComment pgn={pgn} />
            <Variation moves={pgn.history.moves} onClickMove={onClickMove} />
            <Result pgn={pgn} />
        </Card>
    );
};

export default PgnText;
