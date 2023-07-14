import { Pgn } from '@jackstenglein/chess';
import { Divider, Paper, Stack, Typography } from '@mui/material';

const GameComment: React.FC<{ pgn: Pgn }> = ({ pgn }) => {
    if (!pgn.gameComment || pgn.gameComment.includes('[#]')) {
        return null;
    }

    return (
        <Paper elevation={3} sx={{ boxShadow: 'none' }}>
            <Stack>
                <Typography variant='body2' color='text.secondary' p='6px'>
                    {pgn.gameComment}
                </Typography>
                <Divider sx={{ width: 1 }} />
            </Stack>
        </Paper>
    );
};

export default GameComment;
