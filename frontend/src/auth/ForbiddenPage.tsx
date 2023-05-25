import { Container, Stack, Typography } from '@mui/material';

interface ForbiddenPageProps {
    message: string;
}

const ForbiddenPage: React.FC<ForbiddenPageProps> = ({ message }) => {
    return (
        <Container maxWidth='md' sx={{ pt: 4, pb: 4 }}>
            <Stack alignItems='center'>
                <Typography variant='h4'>Access Denied</Typography>
                <Typography mt={2} textAlign='center'>
                    {message}
                </Typography>
                <Typography mt={4} textAlign='center'>
                    You must have an active subscription at{' '}
                    <a
                        href='https://chessdojo.club/plans-pricing'
                        target='_blank'
                        rel='noreferrer'
                    >
                        https://chessdojo.club
                    </a>{' '}
                    in order to access this site. If you do have an active subscription,
                    make sure you are using the same email address on both sites. If you
                    still cannot login and think it is incorrect, contact either DM Hokie
                    (discord: DMHokie#2533, email: ) or Jack (discord: Heh13#5117, email:
                    jackstenglein@gmail.com).
                </Typography>
            </Stack>
        </Container>
    );
};

export default ForbiddenPage;
