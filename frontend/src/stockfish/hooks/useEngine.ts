
import { Stockfish16 } from "../engine/Stockfish";
import { UciEngine } from "../engine/UciEngine";
import { EngineName } from "../engine/EngineEnum";
import { useEffect, useState } from "react";

export const useEngine = (engineName: EngineName | undefined) => {
  const [engine, setEngine] = useState<UciEngine | null>(null);

  useEffect(() => {
    if (!engineName) return;

    if (engineName.includes("stockfish_16") && !Stockfish16.isSupported()) {
      return;
    }

    const engine = pickEngine(engineName);
    engine.init().then(() => {
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
    case EngineName.Stockfish16point1:
      return new Stockfish16(false);
    case EngineName.Stockfish16point1NNUE:
      return new Stockfish16(true);
    default:
      throw new Error(`Engine ${engine} does not exist ?!`);
  }
};