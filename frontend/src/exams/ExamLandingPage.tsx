import { Container, Stack, Typography } from '@mui/material';
import { useRequiredAuth } from '../auth/Auth';
import TacticsScoreCard from '../profile/stats/TacticsScoreCard';
import ExamGraphComposer from './list/ExamGraphComposer';
import { ExamCardComposer } from './view/ExamCardComposer';

/**
 * Renders a simple landing page that directs users to the different types of exams
 * (tactics, polgar, endgame, etc).
 */
export const ExamLandingPage = () => {
    const auth = useRequiredAuth();
    const user = auth.user;

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <Stack spacing={3}>
                <Typography variant='h4' align='center'>
                    ChessDojo Tactics Tests
                </Typography>
                <Typography>
                    Lorem Ipsum is simply dummy text of the printing and typesetting
                    industry. Lorem Ipsum has been the industry's standard dummy text ever
                    since the 1500s, when an unknown printer took a galley of type and
                </Typography>
            </Stack>
            <Stack spacing={3}>
                <TacticsScoreCard user={user} />

                <ExamGraphComposer user={user} width={700} height={500} />

                <ExamCardComposer />
            </Stack>
        </Container>
    );
};
