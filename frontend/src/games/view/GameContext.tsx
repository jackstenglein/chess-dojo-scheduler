import { Game } from '@/database/game';
import { createContext, useContext } from 'react';

interface GameContextType {
    game?: Game;
    onUpdateGame?: (g: Game) => void;
    isOwner?: boolean;
}

const GameContext = createContext<GameContextType>({});

export function useGame() {
    return useContext(GameContext);
}
