// Based off of https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { Container, Stack, Typography } from '@mui/material';
import { Component } from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
    info: any;
}

class ErrorBoundary extends Component<any, ErrorBoundaryState, any> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null, info: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, info: any) {
        console.log('Error: ', error);
        console.log('Info: ', info);
        this.setState({ hasError: true, error, info });
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
                        {this.state.error === null ? 'null' : this.state.error.toString()}
                        {this.state.info === null
                            ? 'No component stack'
                            : this.state.info.componentStack}
                    </Typography>
                </Stack>
            </Container>
        );
    }
}

export default ErrorBoundary;
