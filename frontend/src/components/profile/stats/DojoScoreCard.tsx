import { useRequirements } from '@/api/cache/requirements';
import {
    getCategoryScore,
    getCohortScore,
    getTotalCategoryScore,
    getTotalScore,
} from '@/database/requirement';
import { User, getCurrentRating, getNormalizedRating } from '@/database/user';
import ScoreboardProgress from '@/scoreboard/ScoreboardProgress';
import { getCohortRangeInt } from '@jackstenglein/chess-dojo-common/src/database/cohort';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import { Card, CardContent, Grid2, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';

const categories = [
    'Games + Analysis',
    'Tactics',
    'Middlegames + Strategy',
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
        <Grid2
            size={{ xs: 12, sm: 4, md: 3 }}
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
        </Grid2>
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

    const [minRatingBoundary, graduationBoundary] = getCohortRangeInt(cohort);

    const normalizedRating = Math.round(
        getNormalizedRating(getCurrentRating(user), user.ratingSystem),
    );

    const showRatingProgress = graduationBoundary < Infinity && normalizedRating > 0;

    return (
        <Card variant='outlined' id='cohort-score-card'>
            <CardContent>
                <Grid2 container rowGap={2} columnSpacing={3} alignItems='center'>
                    <Grid2
                        size={{
                            xs: 12,
                            sm: showRatingProgress ? 5 : 12,
                            md: showRatingProgress ? 3 : 12,
                        }}
                        mb={{ xs: 0, sm: 3 }}
                    >
                        <Stack direction='row' spacing={0.5} alignItems='center'>
                            <EqualizerIcon
                                color='primary'
                                sx={{ position: 'relative', bottom: '3px' }}
                            />
                            <Typography variant='h6'>Cohort&nbsp;Progress</Typography>
                        </Stack>
                    </Grid2>

                    {showRatingProgress && (
                        <Tooltip title='The normalized Dojo rating, compared to the graduation rating for this cohort'>
                            <Grid2 size={{ xs: 12, sm: 7, md: 9 }} mb={{ xs: 3, sm: 3 }}>
                                <ScoreboardProgress
                                    value={normalizedRating}
                                    min={minRatingBoundary}
                                    max={graduationBoundary}
                                    color='success'
                                    sx={{ height: '8px', borderRadius: '2px' }}
                                    label={`${normalizedRating} / ${graduationBoundary}`}
                                />
                            </Grid2>
                        </Tooltip>
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
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default DojoScoreCard;
