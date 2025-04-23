import { ChesscomGame, fetchChesscomArchiveGames } from '@/api/external/chesscom';
import { chesscomGameResult } from '@/api/external/onlineGame';
import axios from 'axios';
import { GameData, OpeningTree } from './OpeningTree';
import { PlayerSource, SourceType } from './PlayerSource';

export async function loadChesscom(
    sources: PlayerSource[],
    incrementIndexedCount: (inc?: number) => void,
) {
    const result = new OpeningTree();
    for (const source of sources) {
        await loadChesscomSource(source, result, incrementIndexedCount);
    }
    return result;
}

interface ChesscomListArchivesResponse {
    /**
     * A list of URLs in the form https://api.chess.com/pub/player/{username}/{year}/{month}
     * sorted in ascending order. Months are 1-indexed.
     */
    archives: string[];
}

const CHESSCOM_ARCHIVE_REGEX = /^https:\/\/api.chess.com\/pub\/player\/.*\/(\d{4})\/(\d{2})$/;

async function loadChesscomSource(
    source: PlayerSource,
    result: OpeningTree,
    incrementIndexedCount: (inc?: number) => void,
) {
    if (source.type !== SourceType.Chesscom) {
        throw new Error(`Invalid source type: ${source.type}`);
    }

    const archiveResponse = await axios.get<ChesscomListArchivesResponse>(
        `https://api.chess.com/pub/player/${source.username}/games/archives`,
    );
    const archives = archiveResponse.data.archives;
    console.log(`Got archives: `, archives);

    let count = 0;
    for (const archive of archives) {
        const match = CHESSCOM_ARCHIVE_REGEX.exec(archive);
        if (!match) {
            console.error(
                `Skipping archive ${archive} because it does not match archive regex ${CHESSCOM_ARCHIVE_REGEX.source}`,
            );
            continue;
        }
        const year = match[1];
        const month = match[2];

        const games = await fetchChesscomArchiveGames(source.username, year, month);
        console.log(`Got games: `, games);
        for (const game of games) {
            if (indexGame(game, result)) {
                incrementIndexedCount();
                count++;
                if (count >= 100) {
                    return;
                }
            }
        }
    }
}

function indexGame(game: ChesscomGame, result: OpeningTree): boolean {
    const gameData: GameData = {
        white: game.white.username,
        black: game.black.username,
        whiteElo: game.white.rating,
        blackElo: game.black.rating,
        result: chesscomGameResult(game)[0],
        plyCount: 0,
        rated: game.rated,
        url: game.url,
        headers: {},
    };
    return result.indexGame(gameData, game.pgn);
}
