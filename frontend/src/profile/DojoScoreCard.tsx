import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';

import {
    getCategoryScore,
    getCohortScore,
    getTotalCategoryScore,
} from '../database/requirement';
import { User } from '../database/user';
import { useRequirements } from '../api/cache/requirements';
import { getTotalScore } from '../database/requirement';
import ScoreboardProgress from '../scoreboard/ScoreboardProgress';

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
    const percentComplete = Math.round((100 * cohortScore) / totalScore);

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
                        <Stack alignItems='start' width='154px'>
                            <Typography variant='subtitle2' color='text.secondary'>
                                Percent Complete
                            </Typography>
                            <ScoreboardProgress
                                value={percentComplete}
                                min={0}
                                max={100}
                                label={`${percentComplete}%`}
                            />
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
                            sm: 0,
                        }}
                    >
                        <Stack alignItems='start' width='154px'>
                            <Typography variant='subtitle2' color='text.secondary'>
                                All Requirements
                            </Typography>
                            <ScoreboardProgress
                                value={cohortScore}
                                min={0}
                                max={Math.round(totalScore)}
                            />
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
                                sm: 0,
                            }}
                        >
                            <Stack alignItems='start' width='154px'>
                                <Typography variant='subtitle2' color='text.secondary'>
                                    {c}
                                </Typography>
                                <ScoreboardProgress
                                    value={getCategoryScore(
                                        user,
                                        user.dojoCohort,
                                        c,
                                        requirements
                                    )}
                                    min={0}
                                    max={Math.round(
                                        getTotalCategoryScore(
                                            user.dojoCohort,
                                            c,
                                            requirements
                                        )
                                    )}
                                />
                            </Stack>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default DojoScoreCard;
