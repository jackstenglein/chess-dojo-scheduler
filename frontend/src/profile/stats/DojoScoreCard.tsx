import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import {
    getCategoryScore,
    getCohortScore,
    getTotalCategoryScore,
} from '../../database/requirement';
import {
    User,
    getCurrentRating,
    getMinRatingBoundary,
    getRatingBoundary,
} from '../../database/user';
import { useRequirements } from '../../api/cache/requirements';
import { getTotalScore } from '../../database/requirement';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import React from 'react';

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
            <Stack alignItems='start' width={{ xs: 1, sm: '154px' }}>
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

    const graduationBoundary = getRatingBoundary(cohort, user.ratingSystem);
    const minRatingBoundary = getMinRatingBoundary(cohort, user.ratingSystem);

    return (
        <Card variant='outlined' id='cohort-score-card'>
            <CardContent>
                <Stack mb={2}>
                    <Typography variant='h6'> <EqualizerIcon color='primary'/> Cohort Score</Typography>
                </Stack>

                <Grid container rowGap={2}>
                    {graduationBoundary && (
                        <DojoScoreCardProgressBar
                            title='Graduation'
                            value={getCurrentRating(user)}
                            min={minRatingBoundary}
                            max={graduationBoundary}
                        />
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
                                getCategoryScore(user, cohort, c, requirements)
                            )}
                            min={0}
                            max={Math.round(
                                getTotalCategoryScore(cohort, c, requirements)
                            )}
                        />
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default DojoScoreCard;
