import { openDB } from 'idb';

export interface ChessDbMove {
    uci: string;
    san: string;
    score: string;
    winrate: string;
    rank: string;
    note: string;
}

export interface ChessDbPv {
    score: number;
    depth: number;
    pv: string[];
    pvSAN: string[];
}

export interface ChessDbCacheEntry {
    moves?: ChessDbMove[];
    pv?: ChessDbPv;
}

const DB_NAME = 'chessDB';
const STORE_NAME = 'positions';
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

export async function getChessDbCache(fen: string): Promise<ChessDbCacheEntry | undefined> {
    const db = await getDb();
    return db.get(STORE_NAME, fen) as Promise<ChessDbCacheEntry | undefined>;
}

export async function setChessDbMovesCache(fen: string, moves: ChessDbMove[]) {
    const db = await getDb();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing: ChessDbCacheEntry = (await db.get(STORE_NAME, fen)) ?? {};
    return db.put(STORE_NAME, { ...existing, moves }, fen);
}

export async function setChessDbPvCache(fen: string, pv: ChessDbPv) {
    const db = await getDb();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const existing: ChessDbCacheEntry = (await db.get(STORE_NAME, fen)) ?? {};
    return db.put(STORE_NAME, { ...existing, pv }, fen);
}
