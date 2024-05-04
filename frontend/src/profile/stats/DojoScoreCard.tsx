import EqualizerIcon from '@mui/icons-material/Equalizer';
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import React from 'react';
import { useRequirements } from '../../api/cache/requirements';
import {
    getCategoryScore,
    getCohortScore,
    getTotalCategoryScore,
    getTotalScore,
} from '../../database/requirement';
import {
    RatingSystem,
    User,
    getCurrentRating,
    getMinRatingBoundary,
    getRatingBoundary,
    normalizeToFide,
} from '../../database/user';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';

const categories = [
    'Games + Analysis',
    'Middlegames + Strategy',
    'Tactics',
    'Endgame',
    'Opening',
];

interface DojoScoreCardProgressBarProps {
    title: string;
    value: number;
    min: number;
    max: number;
    label?: string;
}

const DojoScoreCardProgressBar: React.FC<DojoScoreCardProgressBarProps> = ({
    title,
    value,
    min,
    max,
    label,
}) => {
    return (
        <Grid
            item
            xs={12}
            sm={4}
            md={3}
            display='flex'
            justifyContent={{
                xs: 'start',
                sm: 'center',
            }}
        >
            <Stack alignItems='start' width={{ xs: 1 }}>
                <Typography variant='subtitle2' color='text.secondary'>
                    {title}
                </Typography>
                <ScoreboardProgress value={value} min={min} max={max} label={label} />
            </Stack>
        </Grid>
    );
};

interface DojoScoreCardProps {
    user: User;
    cohort: string;
}

const DojoScoreCard: React.FC<DojoScoreCardProps> = ({ user, cohort }) => {
    const { requirements } = useRequirements(cohort, false);

    const totalScore = getTotalScore(cohort, requirements);
    const cohortScore = getCohortScore(user, cohort, requirements);
    const percentComplete = Math.round((100 * cohortScore) / totalScore);

    const graduationBoundary = getRatingBoundary(cohort, RatingSystem.Fide);
    const minRatingBoundary = getMinRatingBoundary(cohort, RatingSystem.Fide);
    const normalizedRating = normalizeToFide(getCurrentRating(user), user.ratingSystem);

    return (
        <Card variant='outlined' id='cohort-score-card'>
            <CardContent>
                <Grid container rowGap={2} columnSpacing={3} alignItems='center'>
                    <Grid item xs={12} sm={5} md={3} mb={{ xs: 0, sm: 3 }}>
                        <Stack direction='row' spacing={0.5} alignItems='center'>
                            <EqualizerIcon
                                color='primary'
                                sx={{ position: 'relative', bottom: '3px' }}
                            />
                            <Typography variant='h6'>Cohort&nbsp;Progress</Typography>
                        </Stack>
                    </Grid>

                    {graduationBoundary && normalizedRating > 0 && (
                        <Grid item xs={12} sm={7} md={9} mb={{ xs: 3, sm: 3 }}>
                            <ScoreboardProgress
                                value={normalizedRating}
                                min={minRatingBoundary}
                                max={graduationBoundary}
                            />
                        </Grid>
                    )}

                    <DojoScoreCardProgressBar
                        title='Percent Complete'
                        value={percentComplete}
                        min={0}
                        max={100}
                        label={`${percentComplete}%`}
                    />

                    <DojoScoreCardProgressBar
                        title='All Requirements'
                        value={Math.round(cohortScore)}
                        min={0}
                        max={Math.round(totalScore)}
                    />

                    {categories.map((c, idx) => (
                        <DojoScoreCardProgressBar
                            key={idx}
                            title={c}
                            value={Math.round(
                                getCategoryScore(user, cohort, c, requirements),
                            )}
                            min={0}
                            max={Math.round(
                                getTotalCategoryScore(cohort, c, requirements),
                            )}
                        />
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default DojoScoreCard;
