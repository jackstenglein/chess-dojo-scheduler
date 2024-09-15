import { EngineName } from "./EngineEnum";
import { UciEngine } from "./UciEngine";

export class Stockfish16 extends UciEngine {
  constructor(nnue?: boolean) {
    if (!Stockfish16.isSupported()) {
      throw new Error("Stockfish 16 is not supported");
    }

    const isMultiThreadSupported = Stockfish16.isMultiThreadSupported();
    if (!isMultiThreadSupported) console.log("Multiple thread mode");

    const enginePath = isMultiThreadSupported
      ? "engine/stockfish-wasm/stockfish-16.1-single.js"
      : "engine/stockfish-wasm/stockfish-16.1.js";

    const customEngineInit = async () => {
      await this.sendCommands(
        [`setoption name Use NNUE value ${!!nnue}`, "isready"],
        "readyok"
      );
    };

    super(EngineName.Stockfish16point1, enginePath, customEngineInit);
  }

  public static isSupported() {
    return (
      typeof WebAssembly === "object" &&
      WebAssembly.validate(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      )
    );
  }

  public static isMultiThreadSupported() {
    return SharedArrayBuffer === undefined;
  }
}