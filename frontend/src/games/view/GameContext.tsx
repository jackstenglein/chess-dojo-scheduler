import { Game } from '@/database/game';
import { createContext, useContext } from 'react';

export interface GameContextType {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
    isOwner?: boolean;
}

export const GameContext = createContext<GameContextType>({});

export function useGame() {
    return useContext(GameContext);
}
