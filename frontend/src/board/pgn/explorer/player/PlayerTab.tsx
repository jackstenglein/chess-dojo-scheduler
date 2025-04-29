import { useFreeTier } from '@/auth/Auth';
import { GameInfo } from '@/database/game';
import UpsellAlert from '@/upsell/UpsellAlert';
import { Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import Database from '../Database';
import { ExplorerDatabaseType } from '../Explorer';
import { Filters, readonlyGameFilters } from './Filters';
import { usePlayerOpeningTree } from './PlayerOpeningTree';
import { PlayerSources } from './PlayerSources';
import { usePlayerGames } from './usePlayerGames';

function onClickGame(game: GameInfo) {
    window.open(game.headers.Site, '_blank');
}

export function PlayerTab({ fen }: { fen: string }) {
    const { sources, setSources, isLoading, onLoad, indexedCount, openingTree, filters } =
        usePlayerOpeningTree();
    const isFreeTier = useFreeTier();
    const readonlyFilters = readonlyGameFilters(filters);
    const pagination = usePlayerGames(fen, openingTree.current, readonlyFilters);

    if (isFreeTier) {
        return (
            <Box mt={2}>
                <UpsellAlert>Upgrade to a full account to search by player.</UpsellAlert>
            </Box>
        );
    }

    return (
        <Stack>
            <PlayerSources sources={sources} setSources={setSources} />
            <Filters filters={filters} />

            {isLoading ? (
                <Stack direction='row' spacing={1}>
                    <Typography>
                        {indexedCount} game{indexedCount === 1 ? '' : 's'} loaded...
                    </Typography>
                    <CircularProgress size={20} />
                </Stack>
            ) : openingTree.current ? (
                <Database
                    type={ExplorerDatabaseType.Player}
                    fen={fen}
                    position={openingTree.current.getPosition(fen, readonlyFilters)}
                    isLoading={false}
                    pagination={pagination}
                    onClickGame={onClickGame}
                />
            ) : (
                <Button onClick={onLoad}>Load Games</Button>
            )}
        </Stack>
    );
}
