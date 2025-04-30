import { proxy, releaseProxy, Remote, wrap } from 'comlink';
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { EditableGameFilters, useGameFilters } from './Filters';
import { OpeningTree } from './OpeningTree';
import { OpeningTreeLoaderFactory } from './OpeningTreeLoaderWorker';
import { DEFAULT_PLAYER_SOURCE, GameFilters, PlayerSource } from './PlayerSource';

export interface PlayerOpeningTreeContextType {
    sources: PlayerSource[];
    setSources: Dispatch<SetStateAction<PlayerSource[]>>;
    isLoading: boolean;
    onLoad: () => void;
    indexedCount: number;
    openingTree: OpeningTree | undefined;
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
    const [indexedCount, setIndexedCount] = useState(0);
    const workerRef = useRef<Remote<OpeningTreeLoaderFactory>>();
    const [openingTree, setOpeningTree] = useState<OpeningTree>();
    const [filters, readonlyFilters] = useGameFilters();

    useEffect(() => {
        const worker = new Worker(new URL('./OpeningTreeLoaderWorker.ts', import.meta.url));
        const proxy = wrap<OpeningTreeLoaderFactory>(worker);
        workerRef.current = proxy;
        return proxy[releaseProxy];
    }, []);

    const onLoad = useCallback(async () => {
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

        setIsLoading(true);
        const tree = OpeningTree.fromTree(
            await loader.load(
                sources,
                proxy((inc = 1) => setIndexedCount((v) => v + inc)),
            ),
        );
        console.log('loader finished with tree: ', tree);
        setOpeningTree(tree);
        setIsLoading(false);
    }, [sources, setSources]);

    return (
        <PlayerOpeningTreeContext.Provider
            value={{
                sources,
                setSources,
                isLoading,
                onLoad,
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
