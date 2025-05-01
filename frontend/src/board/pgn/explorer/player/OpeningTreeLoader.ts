import { ChesscomGame, fetchChesscomArchiveGames } from '@/api/external/chesscom';
import { LichessGame } from '@/api/external/lichess';
import { chesscomGameResult, getTimeClass, lichessGameResult } from '@/api/external/onlineGame';
import { Mutex } from 'async-mutex';
import axios from 'axios';
import { expose, proxy } from 'comlink';
import { GameData, OpeningTree } from './OpeningTree';
import { Color, MIN_DOWNLOAD_LIMIT, PlayerSource, SourceType } from './PlayerSource';

interface ChesscomListArchivesResponse {
    /**
     * A list of URLs in the form https://api.chess.com/pub/player/{username}/{year}/{month}
     * sorted in ascending order. Months are 1-indexed.
     */
    archives: string[];
}

const CHESSCOM_ARCHIVE_REGEX = /^https:\/\/api.chess.com\/pub\/player\/.*\/(\d{4})\/(\d{2})$/;

export interface OpeningTreeLoaderFactory {
    newLoader: () => OpeningTreeLoader;
}

export class OpeningTreeLoader {
    private openingTree: OpeningTree | undefined;
    private mutex = new Mutex();
    private incrementIndexedCount: ((inc?: number) => void) | undefined;
    private updateProgress: ((tree: OpeningTree) => void) | undefined;

    async load(
        sources: PlayerSource[],
        incrementIndexedCount: (inc?: number) => void,
        updateProgress: (tree: OpeningTree) => void,
    ) {
        this.incrementIndexedCount = incrementIndexedCount;
        this.updateProgress = updateProgress;

        this.openingTree = new OpeningTree();
        const chesscomSources: PlayerSource[] = [];
        const lichessSources: PlayerSource[] = [];

        for (const source of sources) {
            if (source.type === SourceType.Chesscom) {
                chesscomSources.push(source);
            } else {
                lichessSources.push(source);
            }
        }

        const promises = [this.loadChesscom(chesscomSources), this.loadLichess(lichessSources)];
        await Promise.all(promises);

        console.log('Final tree: ', this.openingTree);
        return this.openingTree;
    }

    private async loadChesscom(sources: PlayerSource[]) {
        for (const source of sources) {
            await this.loadChesscomSource({
                ...source,
                username: source.username.trim().toLowerCase(),
            });
        }
    }

    private async loadChesscomSource(source: PlayerSource) {
        if (source.type !== SourceType.Chesscom) {
            throw new Error(`Invalid source type: ${source.type}`);
        }

        const archiveResponse = await axios.get<ChesscomListArchivesResponse>(
            `https://api.chess.com/pub/player/${source.username}/games/archives`,
        );
        const archives = archiveResponse.data.archives?.toReversed() ?? [];

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
            const promises = games.map((game) => this.indexChesscomGame(source, game));
            await Promise.allSettled(promises);
        }
    }

    private indexChesscomGame(source: PlayerSource, game: ChesscomGame) {
        const gameData: GameData = {
            source,
            playerColor:
                game.white.username.toLowerCase() === source.username ? Color.White : Color.Black,
            white: game.white.username,
            black: game.black.username,
            whiteElo: game.white.rating,
            blackElo: game.black.rating,
            result: chesscomGameResult(game)[0],
            plyCount: 0,
            rated: game.rated,
            url: game.url,
            headers: {},
            timeClass: getTimeClass(game.time_class),
        };
        return this.indexGame(gameData, game.pgn);
    }

    private async loadLichess(sources: PlayerSource[]) {
        for (const source of sources) {
            await this.loadLichessSource({
                ...source,
                username: source.username.trim().toLowerCase(),
            });
        }
    }

    private async loadLichessSource(source: PlayerSource) {
        if (source.type !== SourceType.Lichess) {
            throw new Error(
                `Invalid source type ${source.type} does not equal ${SourceType.Lichess}`,
            );
        }

        const response = await fetch(
            `https://lichess.org/api/games/user/${source.username}?pgnInJson=true`,
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
                    await this.indexLichessGame(source, game);
                } catch (err) {
                    console.error('Failed to load lichess game: ', line, err);
                }
            }
        }
    }

    private indexLichessGame(source: PlayerSource, game: LichessGame) {
        const gameData: GameData = {
            source,
            playerColor:
                game.players?.white?.user?.id?.toLowerCase() === source.username
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
        return this.indexGame(gameData, game.pgn);
    }

    private indexGame(game: GameData, pgn: string) {
        return this.mutex.runExclusive(() => {
            if (this.openingTree?.indexGame(game, pgn)) {
                if (this.openingTree.getGameCount() % MIN_DOWNLOAD_LIMIT === 0) {
                    this.incrementIndexedCount?.(MIN_DOWNLOAD_LIMIT);
                    this.updateProgress?.(this.openingTree);
                }
            }
        });
    }
}

expose({
    newLoader: () => proxy(new OpeningTreeLoader()),
});
