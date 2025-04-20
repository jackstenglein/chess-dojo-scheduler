import { Button, Stack } from '@mui/material';
import { releaseProxy, Remote, wrap } from 'comlink';
import { useCallback, useEffect, useRef, useState } from 'react';
import { OpeningTreeLoader } from './OpeningTreeLoaderWorker';
import { DEFAULT_PLAYER_SOURCE } from './PlayerSource';
import { PlayerSources } from './PlayerSources';

export function PlayerTab() {
    const [sources, setSources] = useState([DEFAULT_PLAYER_SOURCE]);

    const workerRef = useRef<Remote<OpeningTreeLoader>>();

    useEffect(() => {
        const worker = new Worker(new URL('./OpeningTreeLoaderWorker.ts', import.meta.url));
        const proxy = wrap<OpeningTreeLoader>(worker);
        workerRef.current = proxy;
        return proxy[releaseProxy];
    }, []);

    const handleWork = useCallback(async () => {
        const loader = workerRef.current;
        if (!loader) {
            return;
        }

        console.log('loader: ', loader);
        await loader.load(sources);
        console.log('loader finished');
    }, [sources]);

    // const onLoadGames = async () => {
    //     console.log('creating loader');
    //     const obj = NewOpeningTreeLoader();
    //     console.log('obj: ', obj);
    //     alert(`Counter: ${await obj.counter}`);
    //     await obj.inc();
    //     alert(`Counter: ${await obj.counter}`);
    // };

    return (
        <Stack>
            <PlayerSources sources={sources} setSources={setSources} />

            <Button onClick={handleWork}>Load Games</Button>
        </Stack>
    );
}
