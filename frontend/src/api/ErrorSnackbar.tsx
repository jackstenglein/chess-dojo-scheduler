import { isObject } from '@/database/scoreboard';
import { Alert, Snackbar } from '@mui/material';
import { AxiosError } from 'axios';

export function ErrorSnackbar({
    error,
    defaultErrorMessage,
}: {
    error?: unknown;
    defaultErrorMessage?: string;
}) {
    if (!error) {
        return null;
    }

    let errorMessage =
        defaultErrorMessage ||
        'Something went wrong. Please try again later or contact support if the problem persists';

    if (
        error instanceof AxiosError &&
        isObject(error.response?.data) &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
    ) {
        errorMessage = error.response.data.message;
    } else if (isObject(error) && 'message' in error && typeof error.message === 'string') {
        errorMessage = error.message;
    }

    if (errorMessage === 'Unauthorized') {
        errorMessage = 'Login expired. Please refresh and try again.';
    }

    return (
        <Snackbar
            data-cy='error-snackbar'
            open={!!error}
            autoHideDuration={6000}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert variant='filled' severity='error' sx={{ width: '100%' }}>
                {errorMessage}
            </Alert>
        </Snackbar>
    );
}
