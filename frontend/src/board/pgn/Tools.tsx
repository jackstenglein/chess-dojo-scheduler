import { useCallback, useState } from 'react';
import { Color } from 'chessground/types';
import { Chess } from '@jackstenglein/chess';
import { Stack, Tooltip, IconButton } from '@mui/material';
import FlipIcon from '@mui/icons-material/WifiProtectedSetup';

import { BoardApi } from '../Board';
import PlayerHeader from './PlayerHeader';

interface ToolsProps {
    board: BoardApi;
    chess: Chess;
}

const Tools: React.FC<ToolsProps> = ({ board, chess }) => {
    const [orientation, setOrientation] = useState<Color>('white');

    const toggleOrientation = useCallback(() => {
        board.toggleOrientation();
        setOrientation(board.state.orientation);
    }, [board, setOrientation]);

    return (
        <>
            <PlayerHeader type='header' orientation={orientation} pgn={chess.pgn} />
            <PlayerHeader
                type='footer'
                orientation={board.state.orientation}
                pgn={chess.pgn}
            />
            <Stack direction='row' mt={0.5} gridArea='tools'>
                <Tooltip title='Flip Board'>
                    <IconButton aria-label='flip board' onClick={toggleOrientation}>
                        <FlipIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            </Stack>
        </>
    );
};

export default Tools;
