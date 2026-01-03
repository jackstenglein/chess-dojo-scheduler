import { Link } from '@/components/navigation/Link';
import { Container, Divider, Stack, Typography } from '@mui/material';

export default function Page() {
    return (
        <Container sx={{ py: 5 }}>
            <Typography variant='h5'>Admin Tools</Typography>
            <Divider />
            <Stack sx={{ mt: 2 }}>
                <Link href='/admin/game-review'>Update Game Review Cohorts</Link>
            </Stack>
        </Container>
    );
}
