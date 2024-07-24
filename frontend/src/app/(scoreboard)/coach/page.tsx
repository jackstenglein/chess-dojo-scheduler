import { Container, Divider, Stack, Typography } from '@mui/material';
import NotFoundPage from '../../NotFoundPage';
import { useRequiredAuth } from '../../auth/Auth';
import CoursesCard from './courseEditor/CoursesCard';
import ConnectStripeAccount from './stripe/ConnectStripeAccount';
import StripeInfo from './stripe/StripeInfo';

const CoachPortalPage = () => {
    const { user } = useRequiredAuth();

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

                {user.coachInfo?.stripeId ? (
                    <>
                        <StripeInfo />
                        <CoursesCard />
                    </>
                ) : (
                    <ConnectStripeAccount />
                )}
            </Stack>
        </Container>
    );
};

export default CoachPortalPage;
