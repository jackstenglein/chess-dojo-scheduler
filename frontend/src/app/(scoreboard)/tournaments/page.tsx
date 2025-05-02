import { ExamCard } from '@/components/exams/ExamCard';
import { CrossedSwordIcon } from '@/style/CrossedSwordIcon';
import { TournamentBracketIcon } from '@/style/TournamentIcon';
import { MilitaryTech } from '@mui/icons-material';
import { Container, Grid2, Typography } from '@mui/material';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'ChessDojo Tournaments',
    description: `Win a free ChessDojo membership by participating in the ChessDojo Champions' Circuit!`,
};

/**
 * Renders a basic landing page for tournaments that redirects to the more specific
 * tournament pages.
 */
export default function Page() {
    return (
        <Container
            maxWidth='lg'
            sx={{ py: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
            <Typography variant='h4' textAlign='center' sx={{ mb: 2 }}>
                ChessDojo Tournaments
            </Typography>

            <Grid2 container rowSpacing={2} columnSpacing={2}>
                <ExamCard
                    name='Round Robin'
                    description='Nine rounds of classical chess with members of your cohort, scheduled at your own pace.'
                    href='/tournaments/round-robin'
                    icon={CrossedSwordIcon}
                />

                <ExamCard
                    name='Open Classical'
                    description='Seven-round classical tournament with two sections and one game per week.'
                    href='/tournaments/open-classical'
                    icon={TournamentBracketIcon}
                />

                <ExamCard
                    name='DojoLiga'
                    description='Weekly blitz, rapid, and classical arenas. No Dojo account required.'
                    href='/tournaments/liga'
                    icon={MilitaryTech}
                />
            </Grid2>

            <Typography variant='h5' textAlign='center' sx={{ mt: 10, mb: 2 }}>
                Champions' Circuit
            </Typography>

            <Typography textAlign='center' maxWidth='md'>
                The winners of the round robin and open classical tournaments will each earn a free
                year membership to the Dojo, as well as entrance into our end of year tournament of
                champions. Repeat winners will earn only a single prize. Any players banned for fair
                play violations will have their subscriptions canceled without warning.
            </Typography>
        </Container>
    );
}
