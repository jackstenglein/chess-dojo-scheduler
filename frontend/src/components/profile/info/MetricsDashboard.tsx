import { useRequirements } from '@/api/cache/requirements';
import {
    ALL_COHORTS,
    RatingSystem,
    User,
    formatRatingSystem,
    getSystemCurrentRating,
} from '@/database/user';
import { calculateTacticsRating } from '@/exams/view/exam';
import { Help } from '@mui/icons-material';
import {
    Card,
    CardContent,
    Grid2,
    Stack,
    SxProps,
    Tooltip,
    Typography,
} from '@mui/material';

interface MetricsDashboardProps {
    user: User;
    sx?: SxProps;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ user, sx }) => {
    const { requirements } = useRequirements(ALL_COHORTS, true);

    return (
        <Card variant='outlined' sx={sx}>
            <CardContent>
                <Typography variant='h6' sx={{ mb: 2 }}>
                    Metrics
                </Typography>

                <Grid2 container justifyContent='center' rowGap={1} columnGap={1}>
                    <Grid2
                        display='flex'
                        justifyContent='center'
                        size={{
                            xs: 12,
                            sm: 4,
                            md: 3,
                        }}
                    >
                        <Stack direction='row' alignItems='center'>
                            <Typography>Tactics Rating</Typography>

                            <Tooltip title='For U1700, this is a combination of progress in Polgar Mates, Puzzle Rush 5 min and Puzzle Rush Survival. For 1700-2100, this is a combination of Polgar Mates, Puzzle Rush Survival and the Dojo Tactics Test. For 2100+, this is based solely on the Dojo Tactics Test.'>
                                <Help fontSize='small' sx={{ color: 'text.secondary' }} />
                            </Tooltip>
                            <Typography ml={1} fontWeight='bold'>
                                {Math.round(
                                    10 *
                                        calculateTacticsRating(user, requirements)
                                            .overall,
                                ) / 10}
                            </Typography>
                        </Stack>
                    </Grid2>

                    {Object.values(RatingSystem).map((rs) => {
                        const currentRating = getSystemCurrentRating(user, rs);

                        if (currentRating <= 0) {
                            return null;
                        }

                        return (
                            <Grid2
                                key={rs}
                                display='flex'
                                justifyContent='center'
                                size={{
                                    xs: 12,
                                    sm: 4,
                                    md: 3,
                                }}
                            >
                                <Stack direction='row' alignItems='center'>
                                    <Typography>{formatRatingSystem(rs)}</Typography>

                                    <Typography ml={1} fontWeight='bold'>
                                        {currentRating}
                                    </Typography>
                                </Stack>
                            </Grid2>
                        );
                    })}
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default MetricsDashboard;
