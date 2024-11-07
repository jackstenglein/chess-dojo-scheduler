import { Game } from '@/database/game';
import { createContext, useContext } from 'react';

export interface GameContextType {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
    isOwner?: boolean;
    // TODO make required
    unsaved?: boolean;
}

export const GameContext = createContext<GameContextType>({});

export default function useGame() {
    return useContext(GameContext);
}
