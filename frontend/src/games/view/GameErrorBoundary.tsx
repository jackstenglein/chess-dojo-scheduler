// Based off of https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { Container, Stack, Typography } from '@mui/material';
import { Component } from 'react';
import { Game } from '../../database/game';

interface GameErrorBoundaryProps {
    game: Game;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
    info: any;
}

class GameErrorBoundary extends Component<
    React.PropsWithChildren<GameErrorBoundaryProps>,
    ErrorBoundaryState,
    any
> {
    constructor(props: GameErrorBoundaryProps) {
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
                    <Typography variant='h5'>Invalid PGN</Typography>
                    <Typography variant='body1'>
                        Unfortunately, this game's PGN cannot be displayed by the PGN
                        viewer library (see the error message below). This can happen due
                        to a variety of reasons, including:
                    </Typography>

                    <ul>
                        <li>Malformed PGN</li>
                        <li>PGN uses the Lichess "force variation" feature</li>
                        <li>Unrecognized Chess.com/Chessbase PGN annotations</li>
                    </ul>

                    <Typography variant='body1'>
                        Eventually we plan to replace the PGN viewer with one that can
                        support these PGNs, but for now please try updating your game's
                        PGN to remove these features if you are using them.
                    </Typography>

                    <Typography variant='body1' color='error' whiteSpace='pre-line'>
                        {this.state.error === null ? 'null' : this.state.error.toString()}
                        {this.state.info === null
                            ? 'No component stack'
                            : this.state.info.componentStack}
                    </Typography>

                    <Typography variant='body1' whiteSpace='pre-line'>
                        {`Raw PGN:
                        
                        ${this.props.game.pgn}`}
                    </Typography>
                </Stack>
            </Container>
        );
    }
}

export default GameErrorBoundary;
