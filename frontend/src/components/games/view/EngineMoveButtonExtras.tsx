import { StockfishIcon } from '@/style/ChessIcons';
import { Move } from '@jackstenglein/chess';
import { Tooltip } from '@mui/material';

export const EngineMoveButtonExtras = ({ move }: { move: Move }) => {
    if (move.commentDiag?.dojoEngine && !move.previous?.commentDiag?.dojoEngine) {
        return (
            <Tooltip title='This line was found with the engine.'>
                <StockfishIcon fontSize='small' sx={{ ml: 0.5 }} color='error' />
            </Tooltip>
        );
    }

    return null;
};
