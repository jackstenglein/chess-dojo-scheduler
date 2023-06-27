import { Stack, Divider, Typography } from '@mui/material';
import { Pgn, TAGS } from '@jackstenglein/chess';

const Result: React.FC<{ pgn: Pgn }> = ({ pgn }) => {
    const result = pgn.header.tags[TAGS.Result];
    if (!result) {
        return null;
    }

    let title = result;
    let description = '';
    if (result === '1-0') {
        description = 'White Wins';
    } else if (result === '1/2-1/2') {
        title = '½-½';
        description = 'Draw';
    } else if (result === '0-1') {
        description = 'Black Wins';
    }

    return (
        <Stack alignItems='center'>
            <Divider sx={{ width: 1 }} />
            <Typography fontWeight='bold' mt={1}>
                {title}
            </Typography>
            <Typography mb={1} fontStyle='italic'>
                {description}
            </Typography>
        </Stack>
    );
};

export default Result;
