import { Card, CardContent, Stack, Tooltip, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS, User } from '../../database/user';
import { calculateTacticsRating } from '../../tactics/tactics';

interface TacticsScoreCardProps {
    user: User;
}

const TacticsScoreCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);
    const minCohort = parseInt(user.dojoCohort);
    const maxCohort =
        user.dojoCohort.split('-').length > 1
            ? parseInt(user.dojoCohort.split('-')[1])
            : minCohort;

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack
                    direction='row'
                    mb={2}
                    spacing={2}
                    justifyContent='start'
                    alignItems='center'
                >
                    <Typography variant='h6'>Tactics Rating </Typography>
                    <Tooltip
                        title={
                            tacticsRating.overall < minCohort
                                ? 'Your tactics rating is low for your cohort. It is calculated as the average of the below components.'
                                : tacticsRating.overall > maxCohort
                                  ? 'Your tactics rating is at the next level! It is calculated as the average of the below components.'
                                  : 'Your tactics rating is even with your cohort. It is calculated as the average of the below components.'
                        }
                    >
                        <Typography
                            variant='h6'
                            sx={{
                                fontSize: '2rem',
                                fontWeight: 'bold',
                            }}
                            color={
                                tacticsRating.overall < minCohort
                                    ? 'error'
                                    : tacticsRating.overall > maxCohort
                                      ? 'success.main'
                                      : 'warning.main'
                            }
                        >
                            {Math.round(tacticsRating.overall)}
                        </Typography>
                    </Tooltip>
                </Stack>

                <Grid2 container rowGap={4} columnSpacing={2} justifyContent='center'>
                    {tacticsRating.components.map((c) => (
                        <Grid2
                            key={c.name}
                            xs={6}
                            sm={3}
                            md
                            display='flex'
                            justifyContent='center'
                        >
                            <Tooltip title={c.description}>
                                <Stack alignItems='center'>
                                    <Typography variant='body2' color='text.secondary'>
                                        {c.name}
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: '2rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {Math.round(c.rating)}
                                    </Typography>
                                </Stack>
                            </Tooltip>
                        </Grid2>
                    ))}
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default TacticsScoreCard;
