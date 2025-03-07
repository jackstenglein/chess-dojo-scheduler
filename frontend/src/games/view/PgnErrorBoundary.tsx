// Based off of https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { Button, Container, Stack, Typography } from '@mui/material';
import React, { Component, ErrorInfo } from 'react';
import { EventType, trackEvent } from '../../analytics/events';
import { useAuth } from '../../auth/Auth';
import { Game } from '../../database/game';
import DeleteGameButton from './DeleteGameButton';

interface PgnErrorBoundaryProps {
    pgn?: string;
    game?: Game;
}

interface PgnErrorBoundaryNavigatorProps extends PgnErrorBoundaryProps {
    username: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
    info?: ErrorInfo;
}

class PgnErrorBoundary extends Component<
    React.PropsWithChildren<PgnErrorBoundaryNavigatorProps>,
    ErrorBoundaryState
> {
    constructor(props: PgnErrorBoundaryNavigatorProps) {
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
        trackEvent(EventType.PgnErrorBoundary, {
            location: window.location.href,
            error: error?.toString() || '',
        });
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        return (
            <Container maxWidth='md' sx={{ pt: 6, pb: 4, gridArea: 'pgn' }}>
                <Stack spacing={4}>
                    <Typography variant='h5'>Invalid PGN</Typography>
                    <Typography variant='body1'>
                        Unfortunately, this game's PGN cannot be displayed by our PGN viewer (see
                        the error message below). This most likely happened due to a malformed PGN.
                        If you manually produced your PGN, it is likely incorrect. If you believe
                        your PGN is correct or are otherwise unable to correct it, please send a
                        Discord DM to @JackStenglein with the link to this page.
                    </Typography>

                    {this.props.game && this.props.game.owner === this.props.username && (
                        <Stack direction='row' spacing={2}>
                            <Button variant='contained' href={window.location.href + '/edit'}>
                                Resubmit PGN
                            </Button>

                            <DeleteGameButton
                                games={[
                                    {
                                        cohort: this.props.game.cohort,
                                        id: this.props.game.id,
                                    },
                                ]}
                                variant='contained'
                            />
                        </Stack>
                    )}

                    <Typography variant='body1' color='error' whiteSpace='pre-line'>
                        {this.state.error ? this.state.error.toString() : 'Null error'}
                        {this.state.info ? this.state.info.componentStack : 'No component stack'}
                    </Typography>

                    <Typography variant='body1' whiteSpace='pre-line'>
                        {`Raw PGN:
                        
                        ${this.props.pgn}`}
                    </Typography>
                </Stack>
            </Container>
        );
    }
}

const PgnErrorBoundaryNavigator: React.FC<React.PropsWithChildren<PgnErrorBoundaryProps>> = (
    props,
) => {
    const username = useAuth().user?.username || '';

    return <PgnErrorBoundary username={username} {...props} />;
};

export default PgnErrorBoundaryNavigator;
