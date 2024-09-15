import { EvaluateGameParams, LineEval} from "./EngineEval";
import { Chess, PieceSymbol, Square } from "chess.js";
import { Color } from "./EngineEnum";

export const getEvaluateGameParams = (game: Chess): EvaluateGameParams => {
  const history = game.history({ verbose: true });

  const fens = history.map((move) => move.before);
  fens.push(history[history.length - 1].after);

  const uciMoves = history.map(
    (move) => move.from + move.to + (move.promotion || "")
  );

  return { fens, uciMoves };
};

export const getGameFromPgn = (pgn: string): Chess => {
  const game = new Chess();
  game.loadPgn(pgn);

  return game;
};

export const getLineEvalLabel = (
    line: Pick<LineEval, "cp" | "mate">
  ): string => {
    if (line.cp !== undefined) {
      return `${line.cp > 0 ? "+" : ""}${(line.cp / 100).toFixed(2)}`;
    }
  
    if (line.mate) {
      return `${line.mate > 0 ? "+" : "-"}M${Math.abs(line.mate)}`;
    }
  
    return "?";
  };

export const moveLineUciToSan = (
  fen: string
): ((moveUci: string) => string) => {
  const game = new Chess(fen);

  return (moveUci: string): string => {
    try {
      const move = game.move(uciMoveParams(moveUci));
      return move.san;
    } catch (e) {
      return moveUci;
    }
  };
};



export const getWhoIsCheckmated = (fen: string): "w" | "b" | null => {
  const game = new Chess(fen);
  if (!game.isCheckmate()) return null;
  return game.turn();
};

export const uciMoveParams = (
  uciMove: string
): {
  from: Square;
  to: Square;
  promotion?: string | undefined;
} => ({
  from: uciMove.slice(0, 2) as Square,
  to: uciMove.slice(2, 4) as Square,
  promotion: uciMove.slice(4, 5) || undefined,
});

export const isSimplePieceRecapture = (
  fen: string,
  uciMoves: [string, string]
): boolean => {
  const game = new Chess(fen);
  const moves = uciMoves.map((uciMove) => uciMoveParams(uciMove));

  if (moves[0].to !== moves[1].to) return false;

  const piece = game.get(moves[0].to);
  if (piece) return true;

  return false;
};

export const getIsPieceSacrifice = (
  fen: string,
  playedMove: string,
  bestLinePvToPlay: string[]
): boolean => {
  if (
    !bestLinePvToPlay.length ||
    bestLinePvToPlay[0].slice(2, 4) !== playedMove.slice(2, 4)
  )
    return false;

  const game = new Chess(fen);
  const whiteToPlay = game.turn() === "w";
  const startingMaterialDifference = getMaterialDifference(fen);

  let moves = [playedMove, ...bestLinePvToPlay];
  if (moves.length % 2 === 1) {
    moves = moves.slice(0, -1);
  }
  let nonCapturingMovesTemp = 1;

  for (const move of moves) {
    const fullMove = game.move(uciMoveParams(move));
    if (fullMove.captured) {
      nonCapturingMovesTemp = 1;
    } else {
      nonCapturingMovesTemp--;
      if (nonCapturingMovesTemp < 0) break;
    }
  }

  const endingMaterialDifference = getMaterialDifference(game.fen());

  const materialDiff = endingMaterialDifference - startingMaterialDifference;
  const materialDiffPlayerRelative = whiteToPlay ? materialDiff : -materialDiff;

  return materialDiffPlayerRelative < -1;
};

export const getMaterialDifference = (fen: string): number => {
  const game = new Chess(fen);
  const board = game.board().flat();

  return board.reduce((acc, square) => {
    if (!square) return acc;
    const piece = square.type;

    if (square.color === "w") {
      return acc + getPieceValue(piece);
    }

    return acc - getPieceValue(piece);
  }, 0);
};

const getPieceValue = (piece: PieceSymbol): number => {
  switch (piece) {
    case "p":
      return 1;
    case "n":
      return 3;
    case "b":
      return 3;
    case "r":
      return 5;
    case "q":
      return 9;
    default:
      return 0;
  }
};

export const getStartingFen = (
  params: { pgn: string } | { game: Chess }
): string => {
  const game = "game" in params ? params.game : getGameFromPgn(params.pgn);

  const history = game.history({ verbose: true });
  if (!history.length) return game.fen();

  return history[0].before;
};

export const isCheck = (fen: string): boolean => {
  const game = new Chess(fen);
  return game.inCheck();
};

export const getCapturedPieces = (
  fen: string,
  color: Color
): Record<string, number | undefined> => {
  const capturedPieces: Record<string, number | undefined> = {};
  if (color === Color.White) {
    capturedPieces.p = 8;
    capturedPieces.r = 2;
    capturedPieces.n = 2;
    capturedPieces.b = 2;
    capturedPieces.q = 1;
  } else {
    capturedPieces.P = 8;
    capturedPieces.R = 2;
    capturedPieces.N = 2;
    capturedPieces.B = 2;
    capturedPieces.Q = 1;
  }

  const fenPiecePlacement = fen.split(" ")[0];
  for (const piece of Object.keys(capturedPieces)) {
    const count = fenPiecePlacement.match(new RegExp(piece, "g"))?.length;
    if (count) capturedPieces[piece] = (capturedPieces[piece] ?? 0) - count;
  }

  return capturedPieces;
};