import { useFreeTier } from '@/auth/Auth';
import { GameInfo } from '@/database/game';
import UpsellAlert from '@/upsell/UpsellAlert';
import { ExpandMore } from '@mui/icons-material';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import Database from '../Database';
import { ExplorerDatabaseType } from '../Explorer';
import { Filters } from './Filters';
import { usePlayerOpeningTree } from './PlayerOpeningTree';
import { PlayerSources } from './PlayerSources';
import { usePlayerPosition } from './usePlayerPosition';

function onClickGame(game: GameInfo) {
    window.open(game.headers.Site, '_blank');
}

export function PlayerTab({ fen }: { fen: string }) {
    const { sources, setSources, filters, readonlyFilters, positionCache, setPositionCache } =
        usePlayerOpeningTree();
    const isFreeTier = useFreeTier();
    // const pagination = usePlayerGames(fen, openingTree, readonlyFilters);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const positionCacheItem = usePlayerPosition({
        sources,
        filters: readonlyFilters,
        fen,
        cache: positionCache,
        setCache: setPositionCache,
    });

    // console.log('positionCache: ', positionCache);
    // console.log('positionCacheItem: ', positionCacheItem);

    if (isFreeTier) {
        return (
            <Box mt={2}>
                <UpsellAlert>Upgrade to a full account to search by player.</UpsellAlert>
            </Box>
        );
    }

    return (
        <Stack>
            <Accordion
                expanded={filtersOpen}
                onChange={(_, expanded) => setFiltersOpen(expanded)}
                disableGutters
                elevation={0}
                sx={{ mt: 1, background: 'transparent' }}
            >
                <AccordionSummary
                    sx={{
                        flexDirection: 'row-reverse',
                        gap: 1,
                        p: 0,
                        // display: !isLoading && !openingTree.current ? 'none' : undefined,
                    }}
                    expandIcon={<ExpandMore />}
                >
                    <Typography>Filters</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                    <PlayerSources
                        sources={sources}
                        setSources={setSources}
                        locked={false}
                        onClear={() => null}
                    />
                    <Filters filters={filters} />
                </AccordionDetails>
            </Accordion>

            <Database
                type={ExplorerDatabaseType.Player}
                fen={fen}
                position={positionCacheItem?.position}
                isLoading={positionCacheItem?.loading ?? false}
                // pagination={pagination}
                onClickGame={onClickGame}
            />

            {/* {!isLoading && !openingTree.current && (
                <Button variant='contained' onClick={onLoad} sx={{ mt: 3 }} color='dojoOrange'>
                    Load Games
                </Button>
            )} */}
        </Stack>
    );
}
