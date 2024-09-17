import { EngineName } from "./eval";
import { UciEngine } from "./UciEngine";

export class Stockfish16 extends UciEngine {
  constructor(nnue?: boolean) {
    if (!Stockfish16.isSupported()) {
      throw new Error("Stockfish 16 is not supported");
    }
    const enginepath = nnue ? '/engine/stockfish-nnue-16.js' : '/engine/stockfish-nnue-16-single.js';

    super(EngineName.Stockfish16, enginepath );
  }


  public static isSupported() {
    return (
      typeof WebAssembly === "object" &&
      WebAssembly.validate(
        Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00)
      )
    );
  }

  
}
