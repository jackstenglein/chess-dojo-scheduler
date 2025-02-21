import Avatar from '@/profile/Avatar';
import { StockfishIcon } from '@/style/ChessIcons';
import { Move } from '@jackstenglein/chess';
import { Warning } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

export const GameMoveButtonExtras = ({ move }: { move: Move }) => {
    if (move.commentDiag?.dojoComment) {
        const comment = move.commentDiag.dojoComment;
        const firstComma = comment.indexOf(',');
        const username = comment.slice(0, firstComma);
        const unsaved = comment.endsWith(',unsaved');

        if (
            move.previous?.commentDiag?.dojoComment?.startsWith(username) &&
            move.previous.commentDiag.dojoComment.endsWith(',unsaved') === unsaved
        ) {
            return null;
        }

        if (unsaved) {
            return (
                <Tooltip title='This variation is not saved. Right click to save as a comment.'>
                    <Warning fontSize='small' sx={{ ml: 0.5 }} color='error' />
                </Tooltip>
            );
        }

        const displayName = comment.slice(firstComma + 1).replace(',unsaved', '');
        return (
            <Tooltip title={`Variation suggested by ${displayName}`}>
                <span>
                    <Avatar
                        username={username}
                        displayName={displayName}
                        size={24}
                        sx={{ ml: 0.5 }}
                    />
                </span>
            </Tooltip>
        );
    }

    if (move.commentDiag?.dojoEngine && !move.previous?.commentDiag?.dojoEngine) {
        return (
            <Tooltip title='This line was found with the engine.'>
                <StockfishIcon fontSize='small' sx={{ ml: 0.5 }} color='error' />
            </Tooltip>
        );
    }

    return null;
};
