import { useEffect, useState } from 'react';
import { EngineName } from '../engine/eval';
import { Stockfish11 } from '../engine/stockfish11';
import { UciEngine } from '../engine/uciEngine';

export const useEngine = (engineName: EngineName | undefined) => {
    const [engine, setEngine] = useState<UciEngine | null>(null);

    useEffect(() => {
        if (!engineName) return;

        const engine = pickEngine(engineName);
        void engine.init().then(() => {
            setEngine(engine);
        });

        return () => {
            engine.shutdown();
        };
    }, [engineName]);

    return engine;
};

const pickEngine = (engine: EngineName): UciEngine => {
    switch (engine) {
        // case EngineName.Stockfish16:
        // return new Stockfish16(false);
        // case EngineName.Stockfish16NNUE:
        // return new Stockfish16(true);
        case EngineName.Stockfish11:
            return new Stockfish11();
        default:
            throw new Error(`Engine ${engine} does not exist ?!`);
    }
};
