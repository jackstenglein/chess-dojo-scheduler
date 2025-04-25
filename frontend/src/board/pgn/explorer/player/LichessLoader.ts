import { LichessGame } from '@/api/external/lichess';
import { getTimeClass, lichessGameResult } from '@/api/external/onlineGame';
import { GameData, OpeningTree } from './OpeningTree';
import { Color, PlayerSource, SourceType } from './PlayerSource';

export async function loadLichess(
    sources: PlayerSource[],
    incrementIndexedCount: (inc?: number) => void,
) {
    const result = new OpeningTree();
    for (const source of sources) {
        await loadLichessSource(source, result, incrementIndexedCount);
    }
    return result;
}

async function loadLichessSource(
    source: PlayerSource,
    result: OpeningTree,
    incrementIndexedCount: (inc?: number) => void,
) {
    if (source.type !== SourceType.Lichess) {
        throw new Error(`Invalid source type ${source.type} does not equal ${SourceType.Lichess}`);
    }

    const response = await fetch(
        `https://lichess.org/api/games/user/${source.username.trim()}?pgnInJson=true`,
        {
            headers: { Accept: 'application/x-ndjson' },
        },
    );

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error(`No reader for lichess request`);
    }
    const decoder = new TextDecoder();

    let done = false;
    while (!done) {
        const readVal = await reader.read();
        done = readVal.done;
        if (done) {
            break;
        }

        const chunk = decoder.decode(readVal.value);
        for (let line of chunk.split('\n')) {
            line = line.trim();
            if (!line) continue;

            try {
                const game = JSON.parse(line) as LichessGame;
                if (indexGame(source, game, result)) {
                    incrementIndexedCount();
                }
            } catch (err) {
                console.error('Failed to load lichess game: ', line, err);
            }
        }
    }

    console.log('Streaming complete.');
}

function indexGame(source: PlayerSource, game: LichessGame, tree: OpeningTree): boolean {
    const gameData: GameData = {
        playerColor:
            game.players?.white?.user?.id?.toLowerCase() === source.username.toLowerCase()
                ? Color.White
                : Color.Black,
        white: game.players.white.user?.id ?? '',
        black: game.players.black.user?.id ?? '',
        whiteElo: game.players.white.rating ?? 0,
        blackElo: game.players.black.rating ?? 0,
        result: lichessGameResult(game)[0],
        plyCount: 0,
        rated: game.rated,
        url: `https://lichess.org/${game.id}`,
        headers: {},
        timeClass: getTimeClass(game.speed),
    };
    return tree.indexGame(gameData, game.pgn);
}
