// Based off of https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { Button, Container, Stack, Typography } from '@mui/material';
import React, { Component } from 'react';

import { useNavigate } from 'react-router-dom';
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
    navigate: (to: string) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
    info: any;
}

class PgnErrorBoundary extends Component<
    React.PropsWithChildren<PgnErrorBoundaryNavigatorProps>,
    ErrorBoundaryState,
    any
> {
    constructor(props: PgnErrorBoundaryNavigatorProps) {
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
                        Unfortunately, this game's PGN cannot be displayed by our PGN
                        viewer (see the error message below). This most likely happened
                        due to a malformed PGN. If you manually produced your PGN, it is
                        likely incorrect. If you believe your PGN is correct or are
                        otherwise unable to correct it, please send a Discord DM to
                        @JackStenglein with the link to this page.
                    </Typography>

                    {this.props.game && this.props.game.owner === this.props.username && (
                        <Stack direction='row' spacing={2}>
                            <Button
                                variant='contained'
                                onClick={() => this.props.navigate('./edit')}
                            >
                                Resubmit PGN
                            </Button>

                            <DeleteGameButton
                                game={this.props.game}
                                variant='contained'
                            />
                        </Stack>
                    )}

                    <Typography variant='body1' color='error' whiteSpace='pre-line'>
                        {this.state.error === null ? 'null' : this.state.error.toString()}
                        {this.state.info === null
                            ? 'No component stack'
                            : this.state.info.componentStack}
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

const PgnErrorBoundaryNavigator: React.FC<
    React.PropsWithChildren<PgnErrorBoundaryProps>
> = (props) => {
    const navigate = useNavigate();
    const username = useAuth().user?.username || '';

    return <PgnErrorBoundary navigate={navigate} username={username} {...props} />;
};

export default PgnErrorBoundaryNavigator;
