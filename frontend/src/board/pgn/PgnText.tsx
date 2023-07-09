import { useRef } from 'react';
import { Move, Pgn } from '@jackstenglein/chess';
import { Card, Stack } from '@mui/material';

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
        <Card ref={ref} sx={{ flexGrow: 1, overflowY: 'scroll' }}>
            <Stack height={1}>
                <GameComment pgn={pgn} />
                <Variation
                    scrollParent={ref.current}
                    moves={pgn.history.moves}
                    onClickMove={onClickMove}
                />
                <Result pgn={pgn} />
            </Stack>
        </Card>
    );
};

export default PgnText;
