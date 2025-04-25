import { GameInfo } from '@/database/game';
import { Button, CircularProgress, Stack, Typography } from '@mui/material';
import { proxy, releaseProxy, Remote, wrap } from 'comlink';
import { useEffect, useRef, useState } from 'react';
import Database from '../Database';
import { ExplorerDatabaseType } from '../Explorer';
import { Filters, readonlyGameFilters, useGameFilters } from './Filters';
import { OpeningTree } from './OpeningTree';
import { OpeningTreeLoaderFactory } from './OpeningTreeLoaderWorker';
import { DEFAULT_PLAYER_SOURCE, PlayerSource } from './PlayerSource';
import { PlayerSources } from './PlayerSources';
import { usePlayerGames } from './usePlayerGames';

function onClickGame(game: GameInfo) {
    window.open(game.headers.Site, '_blank');
}

export function PlayerTab({ fen }: { fen: string }) {
    const [sources, setSources] = useState([DEFAULT_PLAYER_SOURCE]);
    const filters = useGameFilters();
    const readonlyFilters = readonlyGameFilters(filters);
    const workerRef = useRef<Remote<OpeningTreeLoaderFactory>>();
    const [isLoading, setIsLoading] = useState(false);
    const [indexedCount, setIndexedCount] = useState(0);
    const openingTree = useRef<OpeningTree>();
    const pagination = usePlayerGames(fen, openingTree.current, readonlyFilters);

    useEffect(() => {
        const worker = new Worker(new URL('./OpeningTreeLoaderWorker.ts', import.meta.url));
        const proxy = wrap<OpeningTreeLoaderFactory>(worker);
        workerRef.current = proxy;
        return proxy[releaseProxy];
    }, []);

    const onLoadGames = async () => {
        const newSources: PlayerSource[] = [];
        let error = false;
        for (const source of sources) {
            if (source.username.trim() === '') {
                newSources.push({ ...source, hasError: true });
                error = true;
            } else if (source.hasError || source.error) {
                newSources.push({ ...source, hasError: undefined, error: undefined });
            } else {
                newSources.push(source);
            }
        }
        setSources(newSources);
        if (error) {
            return;
        }

        const loader = await workerRef.current?.newLoader();
        if (!loader) {
            return;
        }

        console.log('loader: ', loader);
        setIsLoading(true);
        const tree = OpeningTree.fromTree(
            await loader.load(
                sources,
                proxy((inc = 1) => setIndexedCount((v) => v + inc)),
            ),
        );
        console.log('loader finished with tree: ', tree);
        openingTree.current = tree;
        setIsLoading(false);
    };

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
                <Button onClick={onLoadGames}>Load Games</Button>
            )}
        </Stack>
    );
}
