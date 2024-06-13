import { Card, CardContent, Stack, Typography } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { KingIcon, QueenIcon, RookIcon } from '../../style/ChessIcons';
import { ExamCard } from './ExamCard';

export const ExamCardComposer = () => {
    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack
                    direction='column'
                    mb={2}
                    spacing={3}
                    justifyContent='center'
                    alignItems='center'
                >
                    <Typography
                        variant='h6'
                        align='center'
                        sx={{
                            fontWeight: 'bold',
                        }}
                    >
                        Attempt Test
                    </Typography>
                </Stack>
                <Grid2 container rowSpacing={3} columnSpacing={3}>
                    <ExamCard
                        name='Start Tactics Tests'
                        description='All Ratings'
                        href='/tests/tactics'
                        icon={QueenIcon}
                    />

                    <ExamCard
                        name='Start Checkmate Tests'
                        description='All Ratings'
                        href='/tests/checkmate'
                        icon={KingIcon}
                    />

                    <ExamCard
                        name='Start Endgame Tests'
                        description='All Ratings'
                        href='/tests/endgame'
                        icon={RookIcon}
                    />
                </Grid2>
            </CardContent>
        </Card>
    );
};
