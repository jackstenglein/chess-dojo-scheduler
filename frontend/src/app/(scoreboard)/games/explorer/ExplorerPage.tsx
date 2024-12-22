'use client';

import { DefaultUnderboardTab } from '@/board/pgn/boardTools/underboard/underboardTabs';
import PgnBoard from '@/board/pgn/PgnBoard';
import PgnErrorBoundaryNavigator from '@/games/view/PgnErrorBoundary';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import { Box } from '@mui/material';

const startingPositionFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const ExplorerPage = () => {
    const { searchParams } = useNextSearchParams({
        fen: startingPositionFen,
    });

    return (
        <Box
            sx={{
                pt: 4,
                pb: 4,
                px: 0,
            }}
        >
            <PgnErrorBoundaryNavigator>
                <PgnBoard
                    fen={searchParams.get('fen') || startingPositionFen}
                    underboardTabs={[
                        DefaultUnderboardTab.Explorer,
                        DefaultUnderboardTab.Share,
                        DefaultUnderboardTab.Settings,
                    ]}
                    showPlayerHeaders={false}
                    initialUnderboardTab={DefaultUnderboardTab.Editor}
                />
            </PgnErrorBoundaryNavigator>
        </Box>
    );
};

export default ExplorerPage;
