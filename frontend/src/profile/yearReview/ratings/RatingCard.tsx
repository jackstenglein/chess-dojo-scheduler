import { ArrowDownward, ArrowUpward, Help, OpenInNew } from '@mui/icons-material';
import {
    Box,
    Card,
    CardContent,
    Chip,
    Grid2,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Chart } from 'react-charts';
import {
    RatingSystem,
    formatRatingSystem,
    getNormalizedRating,
} from '../../../database/user';
import { YearReviewRatingData } from '../../../database/yearReview';
import {
    getChartData,
    getMemberLink,
    primaryAxis,
    secondaryAxes,
} from '../../stats/RatingCard';

interface RatingCardProps {
    cohort: string;
    system: RatingSystem;
    data: YearReviewRatingData;
    dark: boolean;
}

const RatingCard: React.FC<RatingCardProps> = ({ cohort, system, data, dark }) => {
    const historyData = useMemo(
        () => getChartData(data.history, data.currentRating.value),
        [data],
    );

    return (
        <Card variant='outlined' sx={{ width: 1 }}>
            <CardContent>
                <Stack direction='row' justifyContent='space-between'>
                    <Stack>
                        <Typography variant='h6'>{formatRatingSystem(system)}</Typography>
                        <Stack direction='row' alignItems='center' sx={{ mb: 2 }}>
                            {Boolean(data.username) && (
                                <>
                                    <Typography
                                        variant='subtitle1'
                                        color='text.secondary'
                                    >
                                        {data.username}
                                    </Typography>
                                    <a
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        href={getMemberLink(system, data.username)}
                                    >
                                        <OpenInNew
                                            color='primary'
                                            sx={{ fontSize: '1rem', ml: '3px' }}
                                        />
                                    </a>
                                </>
                            )}
                        </Stack>
                    </Stack>

                    {data.isPreferred && (
                        <Chip label='Preferred' variant='outlined' color='success' />
                    )}
                </Stack>

                <Grid2 container alignItems='center' rowSpacing={2}>
                    <Grid2
                        display='flex'
                        justifyContent={{ xs: 'start', sm: 'center' }}
                        size={{
                            xs: 6,
                            sm: 4,
                            md: 'grow',
                        }}
                    >
                        <Stack alignItems={{ xs: 'start', sm: 'end' }}>
                            <Typography variant='caption' color='text.secondary'>
                                Jan 1, 2023
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {data.startRating}
                            </Typography>
                        </Stack>
                    </Grid2>

                    <Grid2
                        display='flex'
                        justifyContent={{ xs: 'end', sm: 'center' }}
                        size={{
                            xs: 6,
                            sm: 4,
                            md: 'grow',
                        }}
                    >
                        <Stack alignItems='end'>
                            <Typography variant='caption' color='text.secondary'>
                                Dec 25, 2023
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {data.currentRating.value}
                            </Typography>
                        </Stack>
                    </Grid2>

                    <Grid2
                        display='flex'
                        justifyContent={{ xs: 'start', sm: 'center' }}
                        size={{
                            xs: 6,
                            sm: 4,
                            md: 'grow',
                        }}
                    >
                        <Stack alignItems={{ xs: 'start', sm: 'end' }}>
                            <Typography variant='caption' color='text.secondary'>
                                Change
                            </Typography>

                            <Stack direction='row' alignItems='start'>
                                {data.ratingChange >= 0 ? (
                                    <ArrowUpward
                                        sx={{
                                            fontSize: '2.25rem',
                                            fontWeight: 'bold',
                                            mt: '-3px',
                                        }}
                                        color='success'
                                    />
                                ) : (
                                    <ArrowDownward
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
                                        data.ratingChange >= 0
                                            ? 'success.main'
                                            : 'error.main'
                                    }
                                >
                                    {Math.abs(data.ratingChange)}
                                </Typography>
                            </Stack>
                        </Stack>
                    </Grid2>

                    {system !== RatingSystem.Custom && (
                        <>
                            <Grid2
                                display='flex'
                                justifyContent={{ xs: 'end', sm: 'center' }}
                                size={{
                                    xs: 6,
                                    sm: 4,
                                    md: 'grow',
                                }}
                            >
                                <Stack alignItems='end'>
                                    <Stack
                                        spacing={0.5}
                                        direction='row'
                                        alignItems='center'
                                    >
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                        >
                                            Normalized
                                        </Typography>
                                        <Tooltip title='Normalized Dojo rating using the table on Material > Rating Conversions'>
                                            <Help
                                                fontSize='inherit'
                                                sx={{
                                                    color: 'text.secondary',
                                                }}
                                            />
                                        </Tooltip>
                                    </Stack>

                                    <Typography
                                        sx={{
                                            fontSize: '2.25rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {Math.round(
                                            getNormalizedRating(
                                                data.currentRating.value,
                                                system,
                                            ),
                                        )}
                                    </Typography>
                                </Stack>
                            </Grid2>

                            <Grid2
                                display='flex'
                                justifyContent={{ xs: 'start', sm: 'center' }}
                                size={{
                                    xs: 6,
                                    sm: 4,
                                    md: 'grow',
                                }}
                            >
                                <Stack alignItems={{ xs: 'start', sm: 'end' }}>
                                    <Stack
                                        spacing={0.5}
                                        direction='row'
                                        alignItems='center'
                                    >
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                        >
                                            Percentile
                                        </Typography>
                                        <Tooltip
                                            title={
                                                data.isPreferred
                                                    ? 'The percent of Dojo members whose normalized preferred rating is below yours'
                                                    : `The percent of Dojo members whose ${formatRatingSystem(
                                                          system,
                                                      )} rating is below yours`
                                            }
                                        >
                                            <Help
                                                fontSize='inherit'
                                                sx={{
                                                    color: 'text.secondary',
                                                }}
                                            />
                                        </Tooltip>
                                    </Stack>

                                    <Typography
                                        sx={{
                                            fontSize: '2.25rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {Math.round(10 * data.currentRating.percentile) /
                                            10}
                                        %
                                    </Typography>
                                </Stack>
                            </Grid2>

                            <Grid2
                                display='flex'
                                justifyContent={{ xs: 'end', sm: 'center' }}
                                size={{
                                    xs: 6,
                                    sm: 4,
                                    md: 'grow',
                                }}
                            >
                                <Stack alignItems='end'>
                                    <Stack
                                        spacing={0.5}
                                        direction='row'
                                        alignItems='center'
                                    >
                                        <Typography
                                            variant='caption'
                                            color='text.secondary'
                                        >
                                            Cohort Percentile
                                        </Typography>
                                        <Tooltip
                                            title={
                                                data.isPreferred
                                                    ? `The percent of members in the ${cohort} cohort whose normalized preferred rating is below yours`
                                                    : `The percent of members in the ${cohort} cohort whose ${formatRatingSystem(
                                                          system,
                                                      )} rating is below yours`
                                            }
                                        >
                                            <Help
                                                fontSize='inherit'
                                                sx={{
                                                    color: 'text.secondary',
                                                }}
                                            />
                                        </Tooltip>
                                    </Stack>

                                    <Typography
                                        sx={{
                                            fontSize: '2.25rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {Math.round(
                                            10 * data.currentRating.cohortPercentile,
                                        ) / 10}
                                        %
                                    </Typography>
                                </Stack>
                            </Grid2>
                        </>
                    )}
                </Grid2>

                <Stack>
                    <Box height={300} mt={2}>
                        <Chart
                            options={{
                                data: historyData,
                                primaryAxis,
                                secondaryAxes,
                                interactionMode: 'closest',
                                tooltip: false,
                                dark,
                            }}
                        />
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default RatingCard;
