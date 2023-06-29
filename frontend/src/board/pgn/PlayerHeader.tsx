import { Pgn } from '@jackstenglein/chess';
import { Divider, Paper, Stack, Typography } from '@mui/material';

interface PlayerHeaderProps {
    type: 'header' | 'footer';
    orientation: 'white' | 'black';
    pgn?: Pgn;
}

const PlayerHeader: React.FC<PlayerHeaderProps> = ({ type, orientation, pgn }) => {
    if (!pgn) {
        return null;
    }

    let playerName = '';
    let playerElo = '';
    let playerResult = '';

    if (
        (type === 'header' && orientation === 'white') ||
        (type === 'footer' && orientation === 'black')
    ) {
        playerName = pgn.header.tags.Black;
        playerElo = pgn.header.tags.BlackElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens.length > 1) {
            playerResult = resultTokens[1];
        }
    } else {
        playerName = pgn.header.tags.White;
        playerElo = pgn.header.tags.WhiteElo;
        const resultTokens = pgn.header.tags.Result?.split('-');
        if (resultTokens.length > 0) {
            playerResult = resultTokens[0];
        }
    }

    return (
        <Paper
            elevation={3}
            sx={{
                boxShadow: 'none',
                gridArea: type,
                height: 'fit-content',
                py: '3px',
                pl: '3px',
            }}
        >
            <Stack direction='row' spacing={1}>
                {playerResult && (
                    <>
                        <Typography
                            variant='subtitle2'
                            color='text.secondary'
                            fontWeight='bold'
                        >
                            {playerResult}
                        </Typography>
                        <Divider flexItem orientation='vertical' />
                    </>
                )}

                <Typography variant='subtitle2' color='text.secondary' fontWeight='bold'>
                    {playerName}
                </Typography>

                {playerElo && (
                    <Typography variant='subtitle2' color='text.secondary'>
                        ({playerElo})
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
};

export default PlayerHeader;
