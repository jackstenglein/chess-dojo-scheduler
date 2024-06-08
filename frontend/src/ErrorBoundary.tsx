// Based off of https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { Container, Stack, Typography } from '@mui/material';
import { Component, ErrorInfo, ReactNode } from 'react';
import { EventType, trackEvent } from './analytics/events';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    info?: ErrorInfo;
}

class ErrorBoundary extends Component<React.PropsWithChildren, ErrorBoundaryState> {
    constructor(props: { children: ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.log('Error: ', error);
        console.log('Info: ', info);
        this.setState({ hasError: true, error, info });
        trackEvent(EventType.ErrorBoundary, {
            location: window.location.href,
            error: error?.toString() || '',
        });
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
                <Stack spacing={4}>
                    <Typography variant='h5'>Unknown Error</Typography>
                    <Typography variant='h6'>
                        Congratulations! You have broken the site in a new and interesting
                        way. To report this error, please send a Discord message to
                        @jackstenglein with a description of what you were doing when the
                        site broke and a copy of the error message below. Then refresh the
                        page to continue using the site.
                    </Typography>

                    <Typography variant='body1' color='error' whiteSpace='pre-line'>
                        {this.state.error ? this.state.error.toString() : 'Null error'}
                        {this.state.info
                            ? this.state.info.componentStack
                            : 'No component stack'}
                    </Typography>
                </Stack>
            </Container>
        );
    }
}

export default ErrorBoundary;
