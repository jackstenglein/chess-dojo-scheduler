import { useRequirements } from '@/api/cache/requirements';
import { useAuth } from '@/auth/Auth';
import {
    getCategoryScore,
    getCohortScore,
    getTotalCategoryScore,
    getTotalScore,
    RequirementCategory,
} from '@/database/requirement';
import {
    formatRatingSystem,
    getCurrentRating,
    getMinRatingBoundary,
    getRatingBoundary,
    User,
} from '@/database/user';
import ScoreboardProgress from '@/scoreboard/ScoreboardProgress';
import { RatingSystemIcon } from '@/style/RatingSystemIcons';
import { CategoryColors } from '@/style/ThemeProvider';
import { Help } from '@mui/icons-material';
import { Card, CardContent, Grid2, Stack, Tooltip, Typography } from '@mui/material';
import React from 'react';

const categories = [
    RequirementCategory.Games,
    RequirementCategory.Tactics,
    RequirementCategory.Middlegames,
    RequirementCategory.Endgame,
    RequirementCategory.Opening,
] as const;

interface DojoScoreCardProgressBarProps {
    title: string;
    value: number;
    min: number;
    max: number;
    label?: string;
    color: string;
}

const DojoScoreCardProgressBar: React.FC<DojoScoreCardProgressBarProps> = ({
    title,
    value,
    min,
    max,
    label,
    color,
}) => {
    return (
        <Grid2
            size={{ xs: 12 }}
            display='flex'
            justifyContent={{
                xs: 'start',
            }}
        >
            <Stack alignItems='start' width={{ xs: 1 }} color={color}>
                <Typography variant='subtitle2' color='text.secondary' sx={{ mb: -0.5 }}>
                    {title}
                </Typography>
                <ScoreboardProgress
                    value={value}
                    min={min}
                    max={max}
                    label={label}
                    color='inherit'
                />
            </Stack>
        </Grid2>
    );
};

interface DojoScoreCardProps {
    user: User;
    cohort: string;
}

const DojoScoreCard: React.FC<DojoScoreCardProps> = ({ user, cohort }) => {
    const { user: viewer } = useAuth();
    const { requirements } = useRequirements(cohort, false);

    const totalScore = getTotalScore(cohort, requirements);
    const cohortScore = getCohortScore(user, cohort, requirements);
    const percentComplete = Math.round((100 * cohortScore) / totalScore);

    const minRatingBoundary = getMinRatingBoundary(cohort, user.ratingSystem);
    const graduationBoundary = getRatingBoundary(cohort, user.ratingSystem);
    const currentRating = getCurrentRating(user);
    const showRatingProgress =
        (!viewer?.enableZenMode || viewer.username !== user.username) &&
        graduationBoundary &&
        graduationBoundary > 0 &&
        currentRating > 0;

    return (
        <Card id='cohort-score-card'>
            <CardContent>
                <Grid2 container rowGap={2} columnSpacing={3} alignItems='center'>
                    {showRatingProgress && (
                        <Grid2 size={12}>
                            <Stack width={1}>
                                <Stack direction='row' alignItems='center' gap={0.5}>
                                    <RatingSystemIcon
                                        system={user.ratingSystem}
                                        size='small'
                                    />
                                    <Typography
                                        variant='body2'
                                        color='text.secondary'
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        {formatRatingSystem(user.ratingSystem)}
                                    </Typography>
                                </Stack>

                                <Stack direction='row' alignItems='center' gap={0.5}>
                                    <ScoreboardProgress
                                        value={currentRating}
                                        min={minRatingBoundary}
                                        max={graduationBoundary}
                                        color='primary'
                                        sx={{ height: '8px', borderRadius: '2px' }}
                                        label={`${currentRating} / ${graduationBoundary}`}
                                    />

                                    <Tooltip title='Next graduation'>
                                        <Help
                                            sx={{
                                                color: 'text.secondary',
                                                fontSize: '16px',
                                            }}
                                        />
                                    </Tooltip>
                                </Stack>
                            </Stack>
                        </Grid2>
                    )}

                    <DojoScoreCardProgressBar
                        title='All Tasks'
                        value={percentComplete}
                        min={0}
                        max={100}
                        label={`${percentComplete}%`}
                        color='inherit'
                    />

                    {categories.map((c, idx) => {
                        const value = getCategoryScore(user, cohort, c, requirements);
                        const total = getTotalCategoryScore(cohort, c, requirements);
                        const percent = Math.round((100 * value) / total);
                        return (
                            <DojoScoreCardProgressBar
                                key={idx}
                                title={c}
                                value={percent}
                                min={0}
                                max={100}
                                label={`${percent}%`}
                                color={CategoryColors[c]}
                            />
                        );
                    })}
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default DojoScoreCard;
