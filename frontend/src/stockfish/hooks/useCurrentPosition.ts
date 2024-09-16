import { useChess } from '@/board/pgn/PgnBoard';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { EngineName } from '../engine/engineEnum';
import { PositionEval } from '../engine/engineEval';
import {
    currentPositionAtom,
    engineDepthAtom,
    engineMultiPvAtom,
    savedEvalsAtom,
} from '../engine/engineState';
import { useEngine } from './useEngine';

export const useCurrentPosition = (engineName?: EngineName) => {
    const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
    const { chess } = useChess();

    const engine = useEngine(engineName);
    const depth = useAtomValue(engineDepthAtom);
    const multiPv = useAtomValue(engineMultiPvAtom);
    const [savedEvals, setSavedEvals] = useAtom(savedEvalsAtom);

    useEffect(() => {
        if (!chess) {
            return;
        }
        if (!engine?.isReady() || !engineName) {
            console.error(`Engine ${engineName} not ready`);
            return;
        }

        const evaluate = async () => {
            const fen = chess.fen();
            const savedEval = savedEvals[fen];

            if (savedEval?.engine === engineName && savedEval.lines[0].depth >= depth) {
                setCurrentPosition({ eval: savedEval });
                return;
            }

            const rawPositionEval = await engine.evaluatePositionWithUpdate({
                fen,
                depth,
                multiPv,
                setPartialEval: (positionEval: PositionEval) => {
                    setCurrentPosition({ eval: positionEval });
                },
            });

            setSavedEvals((prev) => ({
                ...prev,
                [fen]: { ...rawPositionEval, engine: engineName },
            }));
        };

        void evaluate();
        return () => {
            void engine?.stopSearch();
        };
    }, [
        chess,
        depth,
        engine,
        engineName,
        multiPv,
        savedEvals,
        setCurrentPosition,
        setSavedEvals,
    ]);

    return currentPosition;
};
