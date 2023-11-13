import { Box, Container, Stack } from '@mui/material';
import { ModuleProps } from './Module';
import { useState } from 'react';
import useMeasure from 'react-use-measure';

import PgnBoard from '../../board/pgn/PgnBoard';
import PgnErrorBoundary from '../../games/view/PgnErrorBoundary';
import PgnSelector from './PgnSelector';

const ModelGamesModule: React.FC<ModuleProps> = ({ module }) => {
    const [ref, bounds] = useMeasure();
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!module.pgns || module.pgns.length < 1) {
        return null;
    }

    return (
        <Stack>
            <Container
                maxWidth={false}
                ref={ref}
                sx={{
                    pt: 4,
                    pb: 4,
                    px: '0 !important',
                    '--container-width': `${bounds.width}px`,
                    '--gap': '16px',
                    '--site-header-height': '80px',
                    '--site-header-margin': '100px',
                    '--player-header-height': '28px',
                    '--toc-width': '21vw',
                    '--underboard-width': '400px',
                    '--coach-width': '400px',
                    '--tools-height': '40px',
                    '--board-width':
                        'calc(var(--container-width) - var(--coach-width) - 60px)',
                    '--board-height':
                        'calc(100vh - var(--site-header-height) - var(--site-header-margin) - var(--tools-height) - 8px - 2 * var(--player-header-height))',
                    '--board-size': 'calc(min(var(--board-width), var(--board-height)))',
                }}
            >
                <Box
                    sx={{
                        display: 'grid',
                        rowGap: '32px',
                        gridTemplateRows: {
                            xs: 'auto auto',
                        },
                        gridTemplateColumns: {
                            xs: '1fr',
                            md: 'auto var(--board-size) var(--gap) var(--coach-width) auto',
                        },
                        gridTemplateAreas: {
                            xs: '"extras" "pgn"',
                            md: '". extras extras extras ." "pgn pgn pgn pgn pgn"',
                        },
                    }}
                >
                    <PgnSelector
                        pgns={module.pgns}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                    />

                    <PgnErrorBoundary pgn={module.pgns[selectedIndex]}>
                        <PgnBoard
                            key={module.pgns[selectedIndex]}
                            pgn={module.pgns[selectedIndex]}
                            showPlayerHeaders={true}
                            startOrientation={module.boardOrientation}
                        />
                    </PgnErrorBoundary>
                </Box>
            </Container>
        </Stack>
    );
};

export default ModelGamesModule;
