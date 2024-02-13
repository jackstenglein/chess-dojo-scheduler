import { Box, Container } from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import PgnBoard from '../../board/pgn/PgnBoard';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const ExplorerPage = () => {
    const [searchParams] = useSearchParams({
        fen: startingPositionFen,
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
                '--underboard-width': '500px',
                '--coach-width': '300px',
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
                        xl: 'auto var(--underboard-width) var(--gap) var(--board-size) var(--gap) var(--coach-width) auto',
                    },
                    gridTemplateAreas: {
                        xs: '"pgn" "extras"',
                        md: '"pgn pgn pgn pgn pgn" ". extras . . ."',
                        xl: '"pgn pgn pgn pgn pgn pgn pgn" ". . . extras . . ."',
                    },
                }}
            >
                <PgnBoard
                    fen={searchParams.get('fen') || startingPositionFen}
                    showExplorer
                    showPlayerHeaders={false}
                />
            </Box>
        </Container>
    );
};

export default ExplorerPage;
