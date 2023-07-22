import { useRef } from 'react';
import { Move } from '@jackstenglein/chess';
import { Card } from '@mui/material';

import Result from './Result';
import Variation from './Variation';
import GameComment from './GameComment';

interface PgnTextProps {
    onClickMove: (m: Move) => void;
}

const PgnText: React.FC<PgnTextProps> = ({ onClickMove }) => {
    const ref = useRef<HTMLDivElement>(null);

    return (
        <Card ref={ref} sx={{ overflowY: 'scroll' }}>
            <GameComment />
            <Variation scrollParent={ref.current} onClickMove={onClickMove} />
            <Result />
        </Card>
    );
};

export default PgnText;
