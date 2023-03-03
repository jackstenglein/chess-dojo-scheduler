import { CircularProgress, Stack } from '@mui/material';

const LoadingPage = () => {
    return (
        <Stack sx={{ pt: 6, pb: 4 }} justifyContent='center' alignItems='center'>
            <CircularProgress />
        </Stack>
    );
};

export default LoadingPage;
