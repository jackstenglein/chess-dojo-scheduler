import { Container, Typography } from '@mui/material';

export default function NotFound() {
    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Typography variant='h4'>404</Typography>
            <Typography variant='h6'>Resource not found</Typography>
        </Container>
    );
}
