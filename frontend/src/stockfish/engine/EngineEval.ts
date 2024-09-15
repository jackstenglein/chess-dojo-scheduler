import { Move } from "chess.js";
import { EngineName, MoveClassification } from "./EngineEnum";

export interface PositionEval {
  bestMove?: string;
  moveClassification?: MoveClassification;
  opening?: string;
  lines: LineEval[];
}

export interface LineEval {
  pv: string[];
  cp?: number;
  mate?: number;
  depth: number;
  multiPv: number;
}

export interface Accuracy {
  white: number;
  black: number;
}

export interface EngineSettings {
  engine: EngineName;
  depth: number;
  multiPv: number;
  date: string;
}

export interface GameEval {
  positions: PositionEval[];
  accuracy: Accuracy;
  settings: EngineSettings;
}

export interface EvaluatePositionWithUpdateParams {
  fen: string;
  depth?: number;
  multiPv?: number;
  setPartialEval: (positionEval: PositionEval) => void;
}

export interface CurrentPosition {
  lastMove?: Move;
  eval?: PositionEval;
  lastEval?: PositionEval;
  currentMoveIdx?: number;
}

export interface EvaluateGameParams {
  fens: string[];
  uciMoves: string[];
  depth?: number;
  multiPv?: number;
  setEvaluationProgress?: (value: number) => void;
}