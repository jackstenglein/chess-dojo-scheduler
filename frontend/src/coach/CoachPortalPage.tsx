import { Container, Divider, Stack, Typography } from '@mui/material';

import { useAuth } from '../auth/Auth';
import NotFoundPage from '../NotFoundPage';
import StripeInfo from './stripe/StripeInfo';
import ConnectStripeAccount from './stripe/ConnectStripeAccount';

const CoachPortalPage = () => {
    const user = useAuth().user!;

    if (!user.isCoach) {
        return <NotFoundPage />;
    }

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Stack>
                    <Typography variant='h4'>Coach Portal</Typography>
                    <Divider />
                </Stack>

                {user.coachInfo?.stripeId ? <StripeInfo /> : <ConnectStripeAccount />}
            </Stack>
        </Container>
    );
};

export default CoachPortalPage;
