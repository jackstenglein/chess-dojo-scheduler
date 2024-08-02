import { RequirementCategory } from '@/database/requirement';
import Icon from '@/style/Icon';
import { FiberManualRecord, FiberManualRecordOutlined } from '@mui/icons-material';
import { Card, CardContent, Link, Stack, Tooltip, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useRequirements } from '../../api/cache/requirements';
import { ALL_COHORTS, User } from '../../database/user';
import { calculateTacticsRating } from '../../exams/view/exam';

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

    const isProvisional = tacticsRating.components.some((c) => c.rating < 0);

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
                    <Typography variant='h6'>
                        <Icon
                            name={RequirementCategory.Tactics}
                            color='primary'
                            fontSize='large'
                            sx={{ marginRight: 1.5, verticalAlign: 'middle' }}
                        />
                        Tactics Rating
                    </Typography>
                    <Tooltip
                        title={getTooltip(
                            tacticsRating.overall,
                            minCohort,
                            maxCohort,
                            isProvisional,
                        )}
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
                                    <Typography variant='body1' color='text.secondary'>
                                        <LinkIf to={c.link}>{c.name}</LinkIf>
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: '2rem',
                                            lineHeight: 1,
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {c.rating > 0 ? Math.round(c.rating) : '?'}
                                    </Typography>
                                    {c.examCount && c.rating > 0 ? (
                                        <Typography
                                            variant='body2'
                                            color='text.secondary'
                                        >
                                            <Stack direction='row'>
                                                {[...Array(3 - c.examCount).keys()].map(
                                                    (idx) => (
                                                        <FiberManualRecord
                                                            key={`taken-${idx}`}
                                                            sx={{
                                                                width: '0.85rem',
                                                                height: '0.85rem',
                                                            }}
                                                        />
                                                    ),
                                                )}
                                                {[...Array(c.examCount).keys()].map(
                                                    (idx) => (
                                                        <FiberManualRecordOutlined
                                                            key={`untaken-${idx}`}
                                                            sx={{
                                                                width: '0.85rem',
                                                                height: '0.85rem',
                                                            }}
                                                        />
                                                    ),
                                                )}
                                            </Stack>
                                        </Typography>
                                    ) : (
                                        <></>
                                    )}
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

function getTooltip(
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

const LinkIf = ({ to, children }: { to?: string; children: ReactNode }) => {
    return to ? (
        <Link component={RouterLink} to={to}>
            {children}
        </Link>
    ) : (
        children
    );
};
