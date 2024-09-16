import { useChess } from '@/board/pgn/PgnBoard';
import { EventType } from '@jackstenglein/chess';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { EngineName, PositionEval, SavedEvals } from '../engine/eval';
import { useEngine } from './useEngine';

export const useCurrentPosition = (engineName?: EngineName) => {
    const [currentPosition, setCurrentPosition] = useState<PositionEval>();
    const { chess } = useChess();
    const engine = useEngine(engineName);
    const [depth] = useLocalStorage('engine-depth', 16);
    const [multiPv] = useLocalStorage('engine-multi-pv', 3);
    const savedEvals = useRef<SavedEvals>({});

    useEffect(() => {
        console.log('useCurrentPosition: useEffect');

        if (!chess) {
            return;
        }
        if (!engine?.isReady() || !engineName) {
            console.error(`Engine ${engineName} not ready`);
            return;
        }

        const evaluate = async () => {
            const fen = chess.fen();
            const savedEval = savedEvals.current[fen];

            if (
                savedEval?.engine === engineName &&
                savedEval.lines.length >= multiPv &&
                savedEval.lines[0].depth >= depth
            ) {
                console.log('useCurrentPosition: Using saved position');
                setCurrentPosition(savedEval);
                return;
            }

            console.log('useCurrentPosition: Evaluating fen ', fen);
            const rawPositionEval = await engine.evaluatePositionWithUpdate({
                fen,
                depth,
                multiPv,
                setPartialEval: (positionEval: PositionEval) => {
                    setCurrentPosition(positionEval);
                },
            });

            savedEvals.current = {
                ...savedEvals.current,
                [fen]: { ...rawPositionEval, engine: engineName },
            };
        };

        const observer = {
            types: [
                EventType.Initialized,
                EventType.DeleteMove,
                EventType.LegalMove,
                EventType.NewVariation,
                EventType.PromoteVariation,
            ],
            handler: evaluate,
        };

        void evaluate();
        chess.addObserver(observer);
        return () => {
            console.log('useCurrentPosition: Shutting down useEffect');
            void engine?.stopSearch();
            chess.removeObserver(observer);
        };
    }, [chess, depth, engine, engineName, multiPv, setCurrentPosition]);

    return currentPosition;
};
