import { useChess } from '@/board/pgn/PgnBoard';
import { EventType } from '@jackstenglein/chess';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
    ENGINE_DEPTH,
    ENGINE_HASH,
    ENGINE_LINE_COUNT,
    ENGINE_THREADS,
    EngineName,
    PositionEval,
    SavedEvals,
} from '../engine/engine';
import { useEngine } from './useEngine';

export function useEval(
    enabled: boolean,
    engineName?: EngineName,
): PositionEval | undefined {
    const [currentPosition, setCurrentPosition] = useState<PositionEval>();
    const { chess } = useChess();
    const engine = useEngine(enabled, engineName);
    const [depth] = useLocalStorage(ENGINE_DEPTH.Key, ENGINE_DEPTH.Default);
    const [multiPv] = useLocalStorage(ENGINE_LINE_COUNT.Key, ENGINE_LINE_COUNT.Default);
    const [threads, setThreads] = useLocalStorage(
        ENGINE_THREADS.Key,
        ENGINE_THREADS.Default,
    );
    const [hash] = useLocalStorage(ENGINE_HASH.Key, ENGINE_HASH.Default);
    const savedEvals = useRef<SavedEvals>({});

    useEffect(() => {
        if (!ENGINE_THREADS.Default) {
            ENGINE_THREADS.Default = navigator.hardwareConcurrency;
            ENGINE_THREADS.Max = navigator.hardwareConcurrency;
        }
        if (threads === 0) {
            setThreads(navigator.hardwareConcurrency);
        }
    }, [threads, setThreads]);

    useEffect(() => {
        if (!enabled || !chess || !engine || !engineName) {
            return;
        }

        if (!engine?.isReady()) {
            console.error(`Engine ${engineName} not ready`);
            // return;
        }

        const evaluate = async () => {
            const fen = chess.fen();
            const savedEval = savedEvals.current[fen];

            if (
                savedEval?.engine === engineName &&
                savedEval.lines.length >= multiPv &&
                savedEval.lines[0].depth >= depth
            ) {
                setCurrentPosition(savedEval);
                return;
            }

            const rawPositionEval = await engine.evaluatePositionWithUpdate({
                fen,
                depth,
                multiPv,
                threads: threads || 4,
                hash: Math.pow(2, hash),
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
            void engine?.stopSearch();
            chess.removeObserver(observer);
        };
    }, [
        enabled,
        chess,
        depth,
        engine,
        engineName,
        multiPv,
        threads,
        hash,
        setCurrentPosition,
    ]);

    return currentPosition;
}
