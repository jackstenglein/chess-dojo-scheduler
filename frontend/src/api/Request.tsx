import { Snackbar, Alert } from '@mui/material';
import { useState, useCallback, ReactNode } from 'react';

/**
 * RequestStatus defines the different status types that an API request can have.
 */
export enum RequestStatus {
    NotSent = 'NOT_SENT',
    Loading = 'LOADING',
    Success = 'SUCCESS',
    Failure = 'FAILURE',
    Reset = 'RESET',
}

/**
 * Request defines the overall state of an API request, as well as functions to update that state.
 */
export interface Request<T = any> {
    status: RequestStatus;
    data?: T;
    error?: any;
    onStart: () => void;
    onSuccess: (data?: T) => void;
    onFailure: (error?: any) => void;
    reset: () => void;
    isLoading: () => boolean;
    isSent: () => boolean;
}

/**
 * useRequest returns a Request object that can be used to track the lifecycle of an API request.
 */
export function useRequest<T = any>(): Request<T> {
    const [status, setStatus] = useState<RequestStatus>(RequestStatus.NotSent);
    const [data, setData] = useState<T>();
    const [error, setError] = useState<any>();

    const onStart = useCallback(() => {
        setStatus(RequestStatus.Loading);
        setData(undefined);
        setError(undefined);
    }, [setStatus, setData, setError]);

    const onSuccess = useCallback(
        (data?: T) => {
            setData(data);
            setStatus(RequestStatus.Success);
        },
        [setData, setStatus]
    );

    const onFailure = useCallback(
        (error?: any) => {
            setError(error);
            setStatus(RequestStatus.Failure);
        },
        [setError, setStatus]
    );

    const reset = useCallback(() => {
        setStatus(RequestStatus.Reset);
        setData(undefined);
        setError(undefined);
    }, [setStatus, setData, setError]);

    const isLoading = useCallback(() => {
        return status === RequestStatus.Loading;
    }, [status]);

    const isSent = useCallback(() => {
        return status !== RequestStatus.NotSent;
    }, [status]);

    return {
        status,
        data,
        error,
        onStart,
        onSuccess,
        onFailure,
        reset,
        isLoading,
        isSent,
    };
}

function isReactNode(node: any | ReactNode): node is ReactNode {
    if (node === null || node === undefined) {
        return true;
    }
    if (
        typeof node === 'string' ||
        typeof node === 'number' ||
        typeof node === 'boolean'
    ) {
        return true;
    }
    return false;
}

interface RequestSnackbarProps<T = any> {
    request: Request<T>;
    showError?: boolean;
    showSuccess?: boolean;
    defaultErrorMessage?: string;
    defaultSuccessMessage?: string;
}

export function RequestSnackbar<T = any>({
    request,
    showError,
    showSuccess,
    defaultErrorMessage,
    defaultSuccessMessage,
}: RequestSnackbarProps<T>) {
    let displayError =
        (showError === undefined || showError) &&
        request.status === RequestStatus.Failure &&
        request.error !== undefined;

    let displaySuccess = showSuccess && request.data !== undefined;

    const errorMessage =
        request.error?.response?.data?.message ||
        request.error?.message ||
        defaultErrorMessage ||
        'Something went wrong. Please try again later or contact support if the problem persists';

    const successMessage = isReactNode(request.data)
        ? request.data
        : defaultSuccessMessage || 'Request succeeded';

    return (
        <>
            <Snackbar
                open={displayError}
                autoHideDuration={6000}
                onClose={request.reset}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    variant='filled'
                    severity='error'
                    sx={{ width: '100%' }}
                    onClose={request.reset}
                >
                    {errorMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={displaySuccess}
                autoHideDuration={6000}
                onClose={request.reset}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                message={successMessage}
            />
        </>
    );
}
