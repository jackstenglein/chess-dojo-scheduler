import { useChess } from '@/board/pgn/PgnBoard';
import { EventType } from '@jackstenglein/chess';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef } from 'react';
import { EngineName } from '../engine/engineEnum';
import { PositionEval, SavedEvals } from '../engine/engineEval';
import {
    currentPositionAtom,
    engineDepthAtom,
    engineMultiPvAtom,
} from '../engine/engineState';
import { useEngine } from './useEngine';

export const useCurrentPosition = (engineName?: EngineName) => {
    const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
    const { chess } = useChess();

    const engine = useEngine(engineName);
    const depth = useAtomValue(engineDepthAtom);
    const multiPv = useAtomValue(engineMultiPvAtom);
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
                setCurrentPosition({ eval: savedEval });
                return;
            }

            console.log('useCurrentPosition: Evaluating fen ', fen);
            const rawPositionEval = await engine.evaluatePositionWithUpdate({
                fen,
                depth,
                multiPv,
                setPartialEval: (positionEval: PositionEval) => {
                    setCurrentPosition({ eval: positionEval });
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
