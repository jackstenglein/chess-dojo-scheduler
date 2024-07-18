import { Card, CardContent, Link, Stack, Tooltip, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { Link as RouterLink } from 'react-router-dom';
import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS, User } from '../../database/user';
import { calculateTacticsRating } from '../../exams/view/exam';
import MeterGauge from './MeterGauge';
import { getRatingCompoProgressColor } from './TacticsBarCard';

interface TacticsScoreCardProps {
    user: User;
}

export function getTooltip(
    rating: number,
    minCohort: number,
    maxCohort: number,
    isProvisional: boolean,
): string {
    let tooltip = '';
    if (rating < minCohort) {
        tooltip =
            'Your tactics rating is low for your cohort. It is calculated as the average of the below components.';
    } else if (rating > maxCohort) {
        tooltip =
            'Your tactics rating is at the next level! It is calculated as the average of the below components.';
    } else {
        tooltip =
            'Your tactics rating is even with your cohort. It is calculated as the average of the below components.';
    }

    if (isProvisional) {
        tooltip +=
            " Your rating is provisional because one or more components hasn't been started or could not be calculated.";
    }

    return tooltip;
}

const TacticsMeterCard: React.FC<TacticsScoreCardProps> = ({ user }) => {
    const { requirements } = useRequirements(ALL_COHORTS, true);
    const tacticsRating = calculateTacticsRating(user, requirements);
    const minCohort = parseInt(user.dojoCohort);
    const maxCohort =
        user.dojoCohort.split('-').length > 1
            ? parseInt(user.dojoCohort.split('-')[1])
            : minCohort;

    const isProvisional = tacticsRating.components.some((c) => c.rating < 0);
    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack
                    direction='row'
                    mb={2}
                    spacing={2}
                    justifyContent='center'
                    alignItems='center'
                >
                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 'bold',
                        }}
                    >
                        Tactics Rating:{' '}
                    </Typography>

                    <Tooltip
                        title={getTooltip(
                            tacticsRating.overall,
                            minCohort,
                            maxCohort,
                            isProvisional,
                        )}
                    >
                        <Stack
                            mb={2}
                            spacing={1}
                            justifyContent='center'
                            alignItems='center'
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
                                {isProvisional && '?'}
                            </Typography>
                        </Stack>
                    </Tooltip>
                </Stack>

                <Grid2 container rowGap={4} columnSpacing={2} justifyContent='center'>
                    {isProvisional && Math.round(tacticsRating.overall) <= 0 ? (
                        <MeterGauge
                            value={0}
                            width={300}
                            height={300}
                            text='?'
                            color='white'
                            userMaxValue={maxCohort + 100}
                        />
                    ) : (
                        <MeterGauge
                            value={Math.round(tacticsRating.overall)}
                            width={100}
                            height={100}
                            text={new Number(
                                Math.round(tacticsRating.overall),
                            ).toString()}
                            color={getRatingCompoProgressColor(
                                minCohort,
                                maxCohort,
                                tacticsRating.overall,
                            )}
                            userMaxValue={isProvisional ? 2900 : maxCohort + 100}
                        />
                    )}
                </Grid2>

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
                                <Stack alignItems='center' spacing={2}>
                                    <Typography
                                        variant='body2'
                                        color='text.main'
                                        sx={{
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {c.link ? (
                                            <Link
                                                component={RouterLink}
                                                to={c.link}
                                                color='primary'
                                            >
                                                {c.name}
                                            </Link>
                                        ) : (
                                            c.name
                                        )}
                                    </Typography>

                                    <>
                                        {' '}
                                        {c.rating <= 0 ? (
                                            <MeterGauge
                                                value={0}
                                                width={100}
                                                height={100}
                                                text={'?'}
                                                color='white'
                                                userMaxValue={maxCohort + 100}
                                            />
                                        ) : (
                                            <MeterGauge
                                                value={Math.round(c.rating)}
                                                width={100}
                                                height={100}
                                                text={new Number(
                                                    Math.round(c.rating),
                                                ).toString()}
                                                color={getRatingCompoProgressColor(
                                                    minCohort,
                                                    maxCohort,
                                                    c.rating,
                                                )}
                                                userMaxValue={
                                                    isProvisional ? 2900 : maxCohort + 100
                                                }
                                            />
                                        )}
                                    </>
                                </Stack>
                            </Tooltip>
                        </Grid2>
                    ))}
                </Grid2>
            </CardContent>
        </Card>
    );
};

export default TacticsMeterCard;
