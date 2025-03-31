import { CircularProgress, Stack, SxProps } from '@mui/material';

const LoadingPage = ({ disableShrink, sx }: { disableShrink?: boolean; sx?: SxProps }) => {
    return (
        <Stack sx={{ pt: 6, pb: 4, ...sx }} justifyContent='center' alignItems='center'>
            <CircularProgress disableShrink={disableShrink} />
        </Stack>
    );
};

export default LoadingPage;
