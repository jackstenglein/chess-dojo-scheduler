import { Box, Container } from '@mui/material';
import PgnBoard from '../../board/pgn/PgnBoard';
import { useSearchParams } from 'react-router-dom';

const ExplorerPage = () => {
    const [searchParams] = useSearchParams({
        fen: '',
    });

    return (
        <Container
            maxWidth={false}
            sx={{
                pt: 4,
                pb: 4,
                '--gap': '16px',
                '--site-header-height': '80px',
                '--site-header-margin': '60px',
                '--player-header-height': '28px',
                '--coach-width': '400px',
                '--tools-height': '40px',
                '--board-width': 'calc(100vw - var(--coach-width) - 60px)',
                '--board-height':
                    'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 8px - 2 * var(--player-header-height))',
                '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
            }}
        >
            <Box
                sx={{
                    display: 'grid',
                    rowGap: '16px',
                    gridTemplateRows: {
                        xs: 'auto auto',
                    },
                    gridTemplateColumns: {
                        xs: '1fr',
                        md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                        xl: 'auto var(--coach-width) var(--gap) var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: '"pgn" "extras"',
                        md: '"pgn pgn pgn pgn pgn" ". extras . . ."',
                        xl: '"pgn pgn pgn pgn pgn pgn pgn" ". . . extras . . ."',
                    },
                }}
            >
                <PgnBoard
                    pgn={''}
                    fen={searchParams.get('fen') || ''}
                    showExplorer
                    showPlayerHeaders={false}
                />
            </Box>
        </Container>
    );
};

export default ExplorerPage;
