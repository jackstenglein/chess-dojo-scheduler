import { LichessExplorerPosition } from '@/database/explorer';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useState } from 'react';
import { EditableGameFilters, useGameFilters } from './Filters';
import { DEFAULT_PLAYER_SOURCE, GameFilters, PlayerSource } from './PlayerSource';

export interface PlayerPositionCacheItem {
    loading: boolean;
    position?: LichessExplorerPosition;
    error?: unknown;
}

export type PlayerPositionCache = Record<string, PlayerPositionCacheItem>;

export interface PlayerOpeningTreeContextType {
    sources: PlayerSource[];
    setSources: Dispatch<SetStateAction<PlayerSource[]>>;
    filters: EditableGameFilters;
    readonlyFilters: GameFilters;
    positionCache: PlayerPositionCache;
    setPositionCache: Dispatch<SetStateAction<PlayerPositionCache>>;
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
    const [filters, readonlyFilters] = useGameFilters(sources);
    const [positionCache, setPositionCache] = useState<PlayerPositionCache>({});

    return (
        <PlayerOpeningTreeContext.Provider
            value={{
                sources,
                setSources,
                filters,
                readonlyFilters,
                positionCache,
                setPositionCache,
            }}
        >
            {children}
        </PlayerOpeningTreeContext.Provider>
    );
}
