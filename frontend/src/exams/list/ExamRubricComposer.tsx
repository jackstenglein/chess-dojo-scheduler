import { Card, CardContent, Stack, Typography } from '@mui/material';

const ExamRubricComposer: React.FC = () => {
    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack
                    direction='column'
                    mb={2}
                    spacing={2}
                    justifyContent='center'
                    
                >
                    <Typography
                        variant='h6'
                        sx={{
                            fontWeight: 'bold',
                        }}
                        align='center'
                    >
                        Tactics Rubric{' '}
                    </Typography>

                    <Typography variant='body1'>
                        The Dojo tests three essential skills: tactics, endgame and
                        positional play. By doing these tests you will be able to
                        ascertain where your game needs the most work. Unlike every other
                        problem server the Dojo demands that you find the responses to
                        your move. A computer does not play it for you. This is to
                        replicate what a real game is like: you must find your opponent’s
                        resources.
                    </Typography>
                    <Typography variant='body1' alignContent='start'>
                        In these tests you will be pushed to the limit in two very
                        important ways.
                    </Typography>
                    <Typography variant='body1' sx={{
                            fontWeight: 'bold',
                        }}>
                        1) The patterns and ideas are the next level up from where you
                        currently are. You should therefore not expect them to be easy.
                    </Typography>
                    <Typography variant='body1' sx={{
                            fontWeight: 'bold',
                        }}>
                        2) You will find your mental stamina tested. Like in a real game
                        you will start losing the freshness of your thinking process.
                        Frustration and exhaustion should be expected! The Dojo is able to
                        grade these tests to a high degree of accuracy.
                    </Typography>
                    <Typography variant='body1'>
                        If your rating is highlighted in green then the skill measured
                        surpasses that of your cohort. If your rating is red it means you
                        need work in that area. The scores of the tests are continually
                        adjusted and really aren’t stabilized until 100+ Dojoers take the
                        test. You can therefore expect your rating to grow more precise.
                        It sometimes happen that there is a flaw in the test. For example,
                        you might have found an alternate variation. In this case the test
                        will be adjusted and you will get points refunded.
                    </Typography>
                    <Typography variant='body1'>
                        The tests help determine your overall rating for the skill that is
                        being tested, but other factors will help determine that overall
                        rating. Those other factors will depend on the cohort you are in.
                        As an example, the Rook Endgame Progression will only be an
                        endgame component for those in the 1500+ cohorts.
                    </Typography>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ExamRubricComposer;
