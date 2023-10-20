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
        <Stack>
            <Typography mt={1}>
                Submitted a{' '}
                <Link
                    component={RouterLink}
                    to={`/games/${entry.cohort.replaceAll(
                        '+',
                        '%2B'
                    )}/${gameInfo?.id.replaceAll('?', '%3F')}`}
                >
                    new game analysis
                </Link>
            </Typography>

            <Stack mt={2.5}>
                <Typography>
                    <Typography component='span' color='text.secondary'>
                        Players:
                    </Typography>{' '}
                    {headers?.White} {headers?.WhiteElo ? `(${headers.WhiteElo})` : ''} -{' '}
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
        </Stack>
    );
};

export default GameNewsfeedItem;
