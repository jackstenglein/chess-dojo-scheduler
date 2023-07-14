import { useRef } from 'react';
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
    const ref = useRef<HTMLDivElement>(null);

    return (
        <Card ref={ref} sx={{ overflowY: 'scroll' }}>
            <GameComment pgn={pgn} />
            <Variation
                scrollParent={ref.current}
                moves={pgn.history.moves}
                onClickMove={onClickMove}
            />
            <Result pgn={pgn} />
        </Card>
    );
};

export default PgnText;
