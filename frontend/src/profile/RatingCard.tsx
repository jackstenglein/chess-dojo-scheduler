import { Card, CardContent, Typography, Stack, Tooltip, Chip, Grid } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HelpIcon from '@mui/icons-material/Help';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { RatingSystem, formatRatingSystem, getRatingBoundary } from '../database/user';

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
        case RatingSystem.Ecf:
            return `https://www.ecfrating.org.uk/v2/new/player.php?ECF_code=${username}`;
        case RatingSystem.Cfc:
            return `https://www.chess.ca/en/ratings/p/?id=${username}`;
        case RatingSystem.Custom:
            return '';
    }
}

interface RatingCardProps {
    system: RatingSystem;
    cohort: string;
    username: string;
    usernameHidden: boolean;
    currentRating: number;
    startRating: number;
    isPreferred?: boolean;
}

const RatingCard: React.FC<RatingCardProps> = ({
    system,
    cohort,
    username,
    usernameHidden,
    currentRating,
    startRating,
    isPreferred,
}) => {
    const ratingChange = currentRating - startRating;
    const graduation = getRatingBoundary(cohort, system);

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack direction='row' justifyContent='space-between'>
                    <Stack>
                        <Typography variant='h6'>{formatRatingSystem(system)}</Typography>
                        <Stack direction='row' alignItems='center' sx={{ mb: 2 }}>
                            {!usernameHidden && (
                                <>
                                    <Typography
                                        variant='subtitle1'
                                        color='text.secondary'
                                    >
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
                                </>
                            )}
                        </Stack>
                    </Stack>

                    {isPreferred && (
                        <Chip label='Preferred' variant='outlined' color='success' />
                    )}
                </Stack>

                <Grid container justifyContent='space-around' rowGap={2}>
                    <Grid item xs={6} sm={3} display='flex' justifyContent='center'>
                        <Stack direction='row' alignItems='end' width='82px'>
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
                    </Grid>

                    <Grid item xs={6} sm={3} display='flex' justifyContent='center'>
                        <Stack alignItems='end' width='82px'>
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
                    </Grid>

                    <Grid item xs={6} sm={3} display='flex' justifyContent='center'>
                        <Stack alignItems='end' width='82px'>
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
                                    color={
                                        ratingChange >= 0 ? 'success.main' : 'error.main'
                                    }
                                >
                                    {Math.abs(ratingChange)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Grid>

                    <Grid item xs={6} sm={3} display='flex' justifyContent='center'>
                        <Stack alignItems='end' width='82px'>
                            <Typography
                                variant='subtitle2'
                                color='text.secondary'
                                whiteSpace='nowrap'
                            >
                                Next Graduation
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {graduation || 'N/A'}
                            </Typography>
                        </Stack>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>
    );
};

export default RatingCard;
