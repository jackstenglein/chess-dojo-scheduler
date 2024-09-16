import { Chess } from 'chess.js';
import { atom } from 'jotai';
import { EngineName } from './engineEnum';
import { CurrentPosition, SavedEvals } from './engineEval';

// credit: https://github.com/GuillaumeSD/Freechess

export const gameAtom = atom(new Chess());
export const boardAtom = atom(new Chess());
export const currentPositionAtom = atom<CurrentPosition>({});

// export const boardOrientationAtom = atom(true);
// export const showBestMoveArrowAtom = atom(true);
// export const showPlayerMoveIconAtom = atom(true);

export const engineNameAtom = atom<EngineName>(EngineName.Stockfish11);
export const engineDepthAtom = atom(16);
export const engineMultiPvAtom = atom(3);
export const evaluationProgressAtom = atom(0);
export const savedEvalsAtom = atom<SavedEvals>({});
