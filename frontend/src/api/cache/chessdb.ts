
import { openDB } from "idb";

export interface ChessDbMove {
  uci: string;
  san: string;
  score: string;
  winrate: string;
  rank: string;
  note: string;
}

const DB_NAME = "chessDB";
const STORE_NAME = "positions";
const DB_VERSION = 1;

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function getChessDbCache(fen: string) {
  const db = await getDb();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return db.get(STORE_NAME, fen);
}

export async function setChessDbCache(fen: string, data: ChessDbMove[]) {
  const db = await getDb();
  return db.put(STORE_NAME, data, fen);
}
