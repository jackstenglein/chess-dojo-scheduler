import { Link, Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { Link as RouterLink } from 'react-router-dom';

import { TimelineEntry } from '../../database/timeline';
import { CategoryColors } from '../../profile/activity/activity';

interface GameNewsfeedItemProps {
    entry: TimelineEntry;
}

const GameNewsfeedItem: React.FC<GameNewsfeedItemProps> = ({ entry }) => {
    const gameInfo = entry.gameInfo;
    const headers = gameInfo?.headers;

    return (
        <Stack mt={3}>
            <Stack direction='row' spacing={1}>
                <CircleIcon htmlColor={CategoryColors[entry.requirementCategory]} />
                <Typography>
                    {entry.requirementCategory} - {entry.cohort}
                </Typography>
            </Stack>

            <Typography mt={1}>Submitted a new game analysis</Typography>

            <Stack mt={2.5} mb={2}>
                <Typography>
                    <Typography component='span' color='text.secondary'>
                        White:
                    </Typography>{' '}
                    {headers?.White} {headers?.WhiteElo ? `(${headers.WhiteElo})` : ''}
                </Typography>
                <Typography>
                    <Typography component='span' color='text.secondary'>
                        Black:
                    </Typography>{' '}
                    {headers?.Black} {headers?.BlackElo ? `(${headers.BlackElo})` : ''}
                </Typography>
                {headers?.Date && (
                    <Typography>
                        <Typography component='span' color='text.secondary'>
                            Date:
                        </Typography>{' '}
                        {headers.Date}
                    </Typography>
                )}
                <Typography>
                    <Typography component='span' color='text.secondary'>
                        Result:
                    </Typography>{' '}
                    {headers?.Result}
                </Typography>
                {headers?.PlyCount && (
                    <Typography>
                        <Typography component='span' color='text.secondary'>
                            Moves:
                        </Typography>{' '}
                        {Math.ceil(parseInt(headers.PlyCount) / 2)}
                    </Typography>
                )}
            </Stack>

            <Link
                component={RouterLink}
                to={`/games/${entry.cohort.replaceAll(
                    '+',
                    '%2B'
                )}/${gameInfo?.id.replaceAll('?', '%3F')}`}
            >
                View Game
            </Link>
        </Stack>
    );
};

export default GameNewsfeedItem;
