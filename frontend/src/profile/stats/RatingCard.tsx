import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import HelpIcon from '@mui/icons-material/Help';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid,
    Link,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { AxisOptions, Chart } from 'react-charts';
import { useAuth } from '../../auth/Auth';
import {
    RatingHistory,
    RatingSystem,
    formatRatingSystem,
    getRatingBoundary,
    normalizeToFide,
} from '../../database/user';

export function getMemberLink(ratingSystem: RatingSystem, username: string): string {
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
        case RatingSystem.Dwz:
            return `https://www.schachbund.de/spieler/${username}.html`;
        case RatingSystem.Acf:
            return `https://sachess.org.au/ratings/player?id=${username}`;
        case RatingSystem.Custom:
            return '';
    }
}

function everySevenDays(startDate: Date, endDate: Date): Date[] {
    const result: Date[] = [];
    const currentDate = startDate;
    while (currentDate <= endDate) {
        result.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
    }
    return result;
}

function datesAreSameDay(first: Date, second: Date) {
    return (
        first.getFullYear() === second.getFullYear() &&
        first.getMonth() === second.getMonth() &&
        first.getDate() === second.getDate()
    );
}

export function getChartData(
    ratingHistory: RatingHistory[] | undefined,
    currentRating: number,
) {
    if (!ratingHistory || ratingHistory.length === 0) {
        return [];
    }

    const dates = everySevenDays(new Date(ratingHistory[0].date), new Date());
    let data = [];

    if (dates.length === ratingHistory.length) {
        data = ratingHistory?.map((r) => ({
            date: new Date(r.date),
            rating: r.rating,
        }));
    } else {
        let historyIndex = 0;
        for (const date of dates) {
            if (
                historyIndex < ratingHistory.length &&
                date >= new Date(ratingHistory[historyIndex].date)
            ) {
                data.push({
                    date,
                    rating: ratingHistory[historyIndex].rating,
                });
                historyIndex++;
            } else if (historyIndex > 0) {
                data.push({
                    date,
                    rating: ratingHistory[historyIndex - 1].rating,
                });
            }
        }
    }

    const now = new Date();
    if (data.length > 0 && !datesAreSameDay(now, data[data.length - 1].date)) {
        data.push({
            date: now,
            rating: currentRating,
        });
    }

    return [{ label: 'Rating', data }];
}

function RatingProfileLink({
    usernameHidden,
    username,
    system,
}: {
    usernameHidden: boolean;
    username: string;
    system: RatingSystem;
}) {
    if (usernameHidden || system === RatingSystem.Custom) {
        return null;
    }
    return (
        <Stack direction='row' alignItems='end'>
            <Typography variant='subtitle1' color='text.secondary'>
                {username}
            </Typography>
            <Link
                target='_blank'
                rel='noopener noreferrer'
                href={getMemberLink(system, username)}
            >
                <OpenInNewIcon sx={{ fontSize: '1rem', ml: '3px' }} />
            </Link>
        </Stack>
    );
}

interface Datum {
    date: Date;
    rating: number;
}

export const primaryAxis: AxisOptions<Datum> = {
    scaleType: 'time',
    getValue: (datum) => datum.date,
};

export const secondaryAxes: Array<AxisOptions<Datum>> = [
    {
        scaleType: 'linear',
        getValue: (datum) => datum.rating,
        formatters: {
            scale: (value) => `${value}`,
        },
    },
];

interface RatingCardProps {
    system: RatingSystem;
    cohort: string;
    username: string;
    usernameHidden: boolean;
    currentRating: number;
    startRating: number;
    name?: string;
    isPreferred?: boolean;
    ratingHistory?: RatingHistory[];
}

const RatingCard: React.FC<RatingCardProps> = ({
    system,
    cohort,
    username,
    usernameHidden,
    currentRating,
    startRating,
    name,
    isPreferred,
    ratingHistory,
}) => {
    const dark = !useAuth().user?.enableLightMode;
    const ratingChange = currentRating - startRating;
    const graduation = getRatingBoundary(cohort, system);

    const historyData = useMemo(() => {
        return getChartData(ratingHistory, currentRating);
    }, [ratingHistory, currentRating]);

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack direction='row' justifyContent='space-between' mb={2}>
                    <Stack>
                        <Typography variant='h6'>
                            {formatRatingSystem(system)}
                            {system === RatingSystem.Custom && name && ` (${name})`}
                        </Typography>
                        <RatingProfileLink
                            usernameHidden={usernameHidden}
                            username={username}
                            system={system}
                        />
                    </Stack>

                    {isPreferred && (
                        <Chip label='Preferred' variant='outlined' color='success' />
                    )}
                </Stack>

                <Grid container justifyContent='space-around' rowGap={2}>
                    <Grid item xs={6} sm={3} md display='flex' justifyContent='center'>
                        <Stack alignItems='center'>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Current
                            </Typography>
                            <Stack direction='row' alignItems='end'>
                                <Typography
                                    sx={{
                                        fontSize: '2.25rem',
                                        lineHeight: 1,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {currentRating}
                                </Typography>
                                <Tooltip title='Ratings are updated every 24 hours'>
                                    <HelpIcon
                                        sx={{
                                            mb: '5px',
                                            ml: '3px',
                                            color: 'text.secondary',
                                        }}
                                    />
                                </Tooltip>
                            </Stack>
                        </Stack>
                    </Grid>

                    <Grid item xs={6} sm={3} md display='flex' justifyContent='center'>
                        <Stack alignItems='center'>
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

                    <Grid item xs={6} sm={3} md display='flex' justifyContent='center'>
                        <Stack alignItems='center'>
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

                    {system !== RatingSystem.Custom && (
                        <Grid
                            item
                            xs={6}
                            sm={3}
                            md
                            display='flex'
                            justifyContent='center'
                        >
                            <Stack alignItems='center'>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    Normalized
                                </Typography>
                                <Stack direction='row' alignItems='end'>
                                    <Typography
                                        sx={{
                                            fontSize: '2.25rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {Math.round(
                                            normalizeToFide(currentRating, system),
                                        )}
                                    </Typography>
                                    <Tooltip title='Normalized to FIDE using the table on Material > Rating Conversions'>
                                        <HelpIcon
                                            sx={{
                                                mb: '5px',
                                                ml: '3px',
                                                color: 'text.secondary',
                                            }}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Grid>
                    )}

                    <Grid item xs={6} sm={3} md display='flex' justifyContent='center'>
                        <Stack alignItems='center'>
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

                {historyData.length > 0 && (
                    <Stack>
                        <Box height={300} mt={2}>
                            <Chart
                                options={{
                                    data: historyData,
                                    primaryAxis,
                                    secondaryAxes,
                                    dark,
                                    interactionMode: 'closest',
                                    tooltip: false,
                                }}
                            />
                        </Box>
                        <Typography
                            variant='caption'
                            color='text.secondary'
                            mt={0.5}
                            ml={0.5}
                        >
                            *Graphs are updated weekly
                        </Typography>
                    </Stack>
                )}
            </CardContent>
        </Card>
    );
};

export default RatingCard;
