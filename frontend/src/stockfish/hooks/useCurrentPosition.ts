import {
    boardAtom,
    currentPositionAtom,
    engineDepthAtom,
    engineMultiPvAtom,
    gameAtom,
  } from "../engine/EngineState";
  import { CurrentPosition, PositionEval } from "../engine/EngineEval";
  import { useAtom, useAtomValue } from "jotai";
  import { useEffect } from "react";
  import { useEngine } from "./useEngine";
  import { EngineName } from "../engine/EngineEnum";
  
  export const useCurrentPosition = (engineName?: EngineName) => {
    const [currentPosition, setCurrentPosition] = useAtom(currentPositionAtom);
    const engine = useEngine(engineName);
    const game = useAtomValue(gameAtom);
    const board = useAtomValue(boardAtom);
    const depth = useAtomValue(engineDepthAtom);
    const multiPv = useAtomValue(engineMultiPvAtom);
  
    useEffect(() => {
      const position: CurrentPosition = {
        lastMove: board.history({ verbose: true }).at(-1),
      };
  
      const boardHistory = board.history();
      const gameHistory = game.history();
  
      if (
        boardHistory.length <= gameHistory.length &&
        gameHistory.slice(0, boardHistory.length).join() === boardHistory.join()
      ) {
        position.currentMoveIdx = boardHistory.length;
  
      }
  
      if (!position.eval && engine?.isReady()) {
        const setPartialEval = (positionEval: PositionEval) => {
          setCurrentPosition({ ...position, eval: positionEval });
        };
  
        engine.evaluatePositionWithUpdate({
          fen: board.fen(),
          depth,
          multiPv,
          setPartialEval,
        });
      }
  
      setCurrentPosition(position);
    }, [board, game, engine, depth, multiPv, setCurrentPosition]);
  
    return currentPosition;
  };