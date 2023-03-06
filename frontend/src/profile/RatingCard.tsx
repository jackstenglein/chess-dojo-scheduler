import { Card, CardContent, Typography, Stack, Tooltip, Chip } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpIcon from '@mui/icons-material/Help';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { RatingSystem, formatRatingSystem } from '../database/user';

function getMemberLink(ratingSystem: RatingSystem, username: string): string {
    switch (ratingSystem) {
        case RatingSystem.Chesscom:
            return `https://www.chess.com/member/${username}`;
        case RatingSystem.Lichess:
            return `https://lichess.org/@/${username}`;
        case RatingSystem.Fide:
            return `https://ratings.fide.com/profile/${username}`;
        case RatingSystem.Uscf:
            return `https://www.uschess.org/msa/MbrDtlMain.php?${username}`;
    }
}

interface RatingCardProps {
    system: RatingSystem;
    username: string;
    currentRating: number;
    startRating: number;
    isPreferred?: boolean;
}

const RatingCard: React.FC<RatingCardProps> = ({
    system,
    username,
    currentRating,
    startRating,
    isPreferred,
}) => {
    const ratingChange = currentRating - startRating;

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack direction='row' justifyContent='space-between'>
                    <Stack>
                        <Typography variant='h6'>{formatRatingSystem(system)}</Typography>
                        <Stack direction='row' alignItems='center' sx={{ mb: 2 }}>
                            <Typography variant='subtitle1' color='text.secondary'>
                                {username}
                            </Typography>
                            <a
                                target='_blank'
                                rel='noopener noreferrer'
                                href={getMemberLink(system, username)}
                            >
                                <OpenInNewIcon
                                    color='primary'
                                    sx={{ fontSize: '1rem', ml: '3px' }}
                                />
                            </a>
                        </Stack>
                    </Stack>

                    {isPreferred && (
                        <Chip label='Preferred' variant='outlined' color='success' />
                    )}
                </Stack>

                <Stack direction='row' justifyContent='space-around'>
                    <Stack direction='row' alignItems='end'>
                        <Stack alignItems='end'>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Current
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {currentRating}
                            </Typography>
                        </Stack>
                        <Tooltip title='Ratings are updated every 24 hours'>
                            <HelpIcon
                                sx={{ mb: '5px', ml: '3px', color: 'text.secondary' }}
                            />
                        </Tooltip>
                    </Stack>

                    <Stack alignItems='end'>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Start
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: '2.25rem',
                                lineHeight: 1,
                                fontWeight: 'bold',
                            }}
                        >
                            {startRating}
                        </Typography>
                    </Stack>

                    <Stack alignItems='end'>
                        <Typography variant='subtitle2' color='text.secondary'>
                            Change
                        </Typography>

                        <Stack direction='row' alignItems='start'>
                            {ratingChange >= 0 ? (
                                <ArrowUpwardIcon
                                    sx={{
                                        fontSize: '2.25rem',
                                        fontWeight: 'bold',
                                        mt: '-3px',
                                    }}
                                    color='success'
                                />
                            ) : (
                                <ArrowDownwardIcon
                                    sx={{
                                        fontSize: '2.25rem',
                                        fontWeight: 'bold',
                                        mt: '-3px',
                                    }}
                                    color='error'
                                />
                            )}

                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                                color={ratingChange >= 0 ? 'success.main' : 'error.main'}
                            >
                                {Math.abs(ratingChange)}
                            </Typography>
                        </Stack>
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default RatingCard;
