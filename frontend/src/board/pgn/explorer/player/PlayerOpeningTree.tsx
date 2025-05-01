import { proxy, releaseProxy, Remote, wrap } from 'comlink';
import {
    createContext,
    Dispatch,
    ReactNode,
    RefObject,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { EditableGameFilters, useGameFilters } from './Filters';
import { OpeningTree } from './OpeningTree';
import { OpeningTreeLoaderFactory } from './OpeningTreeLoader';
import { DEFAULT_PLAYER_SOURCE, GameFilters, PlayerSource } from './PlayerSource';

export interface PlayerOpeningTreeContextType {
    sources: PlayerSource[];
    setSources: Dispatch<SetStateAction<PlayerSource[]>>;
    isLoading: boolean;
    onLoad: () => Promise<void>;
    onClear: () => void;
    indexedCount: number;
    openingTree: RefObject<OpeningTree | undefined>;
    filters: EditableGameFilters;
    readonlyFilters: GameFilters;
}

const PlayerOpeningTreeContext = createContext<PlayerOpeningTreeContextType | undefined>(undefined);

export function usePlayerOpeningTree(): PlayerOpeningTreeContextType {
    const context = useContext(PlayerOpeningTreeContext);
    if (!context) {
        throw new Error('usePlayerOpeningTree called from outside of PlayerOpeningTreeProvider');
    }
    return context;
}

export function PlayerOpeningTreeProvider({ children }: { children: ReactNode }) {
    const [sources, setSources] = useState([DEFAULT_PLAYER_SOURCE]);
    const [isLoading, setIsLoading] = useState(false);
    const [indexedCount, setIndexedCount] = useState(-1);
    const workerRef = useRef<Remote<OpeningTreeLoaderFactory>>();
    const openingTree = useRef<OpeningTree>();
    const loadComplete = useRef(false);
    const [filters, readonlyFilters] = useGameFilters(sources);

    useEffect(() => {
        console.log('Creating worker...');
        console.log('import.meta.url: ', import.meta.url);
        const url = new URL('./OpeningTreeLoader.ts', import.meta.url);
        console.log('Worker URL: ', url);
        const worker = new Worker(url);
        console.log('Worker: ', worker);
        const proxy = wrap<OpeningTreeLoaderFactory>(worker);
        console.log('Proxy: ', proxy);
        workerRef.current = proxy;
        return proxy[releaseProxy];
    }, []);

    const onLoad = useCallback(async () => {
        console.log('onLoad');

        const newSources: PlayerSource[] = [];
        const seenSources = new Set<string>();
        for (const source of sources) {
            const sourceKey = `${source.type}_${source.username.trim().toLowerCase()}`;
            if (source.username.trim() === '') {
                newSources.push({ ...source, hasError: true });
            } else if (seenSources.has(sourceKey)) {
                newSources.push({ ...source, hasError: true, error: 'Duplicate source' });
            } else {
                seenSources.add(sourceKey);
                newSources.push({ ...source, hasError: undefined, error: undefined });
            }
        }

        setSources(newSources);
        if (newSources.some((s) => s.hasError)) {
            console.log('Source has error');
            return;
        }

        const loader = await workerRef.current?.newLoader();
        if (!loader) {
            console.log('loader does not exist: ', loader);
            console.log('workerRef.current: ', workerRef.current);
            return;
        }

        setIsLoading(true);
        setIndexedCount(0);
        console.log('Loading games');
        const result = await loader.load(
            sources,
            proxy((inc = 1) => {
                if (!loadComplete.current) {
                    setIndexedCount((v) => v + inc);
                }
            }),
            proxy((tree) => (openingTree.current = OpeningTree.fromTree(tree))),
        );
        const tree = OpeningTree.fromTree(result);
        console.log('loader finished with tree: ', tree);
        openingTree.current = tree;
        loadComplete.current = true;
        setIsLoading(false);
    }, [sources, setSources, setIndexedCount]);

    const onClear = () => {
        openingTree.current = undefined;
        loadComplete.current = false;
        setIndexedCount(-1);
    };

    return (
        <PlayerOpeningTreeContext.Provider
            value={{
                sources,
                setSources,
                isLoading,
                onLoad,
                onClear,
                indexedCount,
                openingTree,
                filters,
                readonlyFilters,
            }}
        >
            {children}
        </PlayerOpeningTreeContext.Provider>
    );
}
