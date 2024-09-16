
import { Stockfish16 } from "../engine/Stockfish16";
import { UciEngine } from "../engine/UciEngine";
import { EngineName } from "../engine/EngineEnum";
import { useEffect, useState } from "react";
import { Stockfish11 } from "../engine/Stockfish11";

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
    case EngineName.Stockfish16:
      return new Stockfish16(false);
    case EngineName.Stockfish16NNUE:
      return new Stockfish16(true);
    case EngineName.Stockfish11:
      return new Stockfish11();
    default:
      throw new Error(`Engine ${engine} does not exist ?!`);
  }
};
