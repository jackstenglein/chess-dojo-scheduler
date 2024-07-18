import { Card, CardContent, Stack } from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { ExamType } from '../../database/exam';
import { QueenIcon, RookIcon } from '../../style/ChessIcons';
import { ExamCard } from './ExamCard';

export const ExamCardComposer = () => {
    return (
        <Card variant='outlined' sx={{ borderColor: 'gold' }}>
            <CardContent>
                <Stack
                    direction='column'
                    mb={2}
                    spacing={3}
                    justifyContent='center'
                    alignItems='center'
                ></Stack>
                <Grid2 container rowSpacing={2} columnSpacing={2} md={18}>
                    <ExamCard
                        name='Tactics Tests'
                        description='All Ratings'
                        href='/tests/tactics'
                        icon={QueenIcon}
                        colorType={ExamType.Tactics}
                    />

                    <ExamCard
                        name='Endgame Tests'
                        description='All Ratings'
                        href='/tests/endgame'
                        icon={RookIcon}
                        colorType={ExamType.Endgame}
                    />
                </Grid2>
            </CardContent>
        </Card>
    );
};
