import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

import {
    getCategoryScore,
    getCohortScore,
    getTotalCategoryScore,
} from '../database/requirement';
import { User } from '../database/user';
import { useRequirements } from '../api/cache/requirements';
import { getTotalScore } from '../database/requirement';

const categories = [
    'Games + Analysis',
    'Middlegames + Strategy',
    'Tactics',
    'Endgame',
    'Opening',
];

interface DojoScoreCardProps {
    user: User;
}

const DojoScoreCard: React.FC<DojoScoreCardProps> = ({ user }) => {
    const { requirements } = useRequirements(user.dojoCohort, false);

    const totalScore = getTotalScore(user.dojoCohort, requirements);
    const cohortScore = getCohortScore(user, user.dojoCohort, requirements);

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack mb={2}>
                    <Typography variant='h6'>Dojo Score</Typography>
                </Stack>

                <Grid container rowGap={2}>
                    <Grid
                        item
                        xs={6}
                        sm={4}
                        md={3}
                        display='flex'
                        justifyContent={{
                            xs: 'start',
                            sm: 'center',
                        }}
                    >
                        <Stack alignItems='end' width='150px'>
                            <Typography variant='subtitle2' color='text.secondary'>
                                All Reqs
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {cohortScore}/{Math.round(totalScore)}
                            </Typography>
                        </Stack>
                    </Grid>

                    <Grid
                        item
                        xs={6}
                        sm={4}
                        md={3}
                        display='flex'
                        justifyContent={{
                            xs: 'end',
                            sm: 'center',
                        }}
                        pr={{
                            xs: 1,
                        }}
                    >
                        <Stack alignItems='end' width='150px'>
                            <Typography
                                variant='subtitle2'
                                color='text.secondary'
                                textAlign='end'
                            >
                                Percent Complete
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '2.25rem',
                                    lineHeight: 1,
                                    fontWeight: 'bold',
                                }}
                            >
                                {Math.round((100 * cohortScore) / totalScore)}%
                            </Typography>
                        </Stack>
                    </Grid>

                    {categories.map((c, idx) => (
                        <Grid
                            key={c}
                            item
                            xs={6}
                            sm={4}
                            md={3}
                            display='flex'
                            justifyContent={{
                                xs: idx % 2 ? 'end' : 'start',
                                sm: 'center',
                            }}
                            pr={{
                                xs: idx % 2 ? 1 : 0,
                            }}
                        >
                            <Stack alignItems='end' width='154px'>
                                <Typography
                                    variant='subtitle2'
                                    color='text.secondary'
                                    textAlign='end'
                                >
                                    {c}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '2.25rem',
                                        lineHeight: 1,
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {getCategoryScore(
                                        user,
                                        user.dojoCohort,
                                        c,
                                        requirements
                                    )}
                                    /
                                    {Math.round(
                                        getTotalCategoryScore(
                                            user.dojoCohort,
                                            c,
                                            requirements
                                        )
                                    )}
                                </Typography>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default DojoScoreCard;
