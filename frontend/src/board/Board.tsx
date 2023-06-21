import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';

import './board.css';

interface BoardProps {
    config: Config;
}

const Board: React.FC<BoardProps> = ({ config }) => {
    const [api, setApi] = useState<Api | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (ref.current && !api) {
            const chessgroundApi = Chessground(ref.current, config);
            setApi(chessgroundApi);
        } else if (ref.current && api) {
            api.set(config);
        }
    }, [ref, api, config]);

    return (
        <Box width={1} height={1}>
            <div ref={ref} style={{ width: '100%', height: '100%' }} />
        </Box>
    );
};

export default Board;
