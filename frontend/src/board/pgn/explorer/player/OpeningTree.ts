import { OnlineGameTimeClass } from '@/api/external/onlineGame';
import { LichessExplorerMove, LichessExplorerPosition } from '@/database/explorer';
import { GameResult } from '@/database/game';
import { Chess, normalizeFen } from '@jackstenglein/chess';
import { Color, GameFilters } from './PlayerSource';

interface PositionDataMove extends LichessExplorerMove {
    /**
     * A set of URLs of the games that played this move.
     */
    games: Set<string>;
}

export interface PositionData extends LichessExplorerPosition {
    /** The moves played from this position, ordered from most common to least common. */
    moves: PositionDataMove[];

    /**
     * A set of URLs of the games played in this position. Empty
     * for the starting position.
     */
    games: Set<string>;
}

export interface GameData {
    playerColor: Color.White | Color.Black;
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    result: GameResult;
    plyCount: number;
    rated: boolean;
    url: string;
    headers: Record<string, string>;
    timeClass: OnlineGameTimeClass;
}

export class OpeningTree {
    private positionData: Map<string, PositionData>;
    private gameData: Map<string, GameData>;

    constructor(positionData?: Map<string, PositionData>, gameData?: Map<string, GameData>) {
        this.positionData = new Map<string, PositionData>(positionData);
        this.gameData = new Map<string, GameData>(gameData);
    }

    static fromTree(other: OpeningTree): OpeningTree {
        return new OpeningTree(other.positionData, other.gameData);
    }

    setGame(game: GameData) {
        this.gameData.set(game.url, game);
    }

    getGame(url: string): GameData | undefined {
        return this.gameData.get(url);
    }

    getGames(fen: string, filters?: GameFilters): GameData[] {
        const position = this.getPosition(fen);
        if (!position) {
            return [];
        }

        const result = [];
        for (const url of position.games) {
            const game = this.getGame(url);
            if (game && matchesFilter(game, filters)) {
                result.push(game);
            }
        }
        return result.sort((lhs, rhs) =>
            (rhs.headers.Date ?? '').localeCompare(lhs.headers.Date ?? ''),
        );
    }

    setPosition(fen: string, position: PositionData) {
        fen = normalizeFen(fen);
        this.positionData.set(fen, position);
    }

    getPosition(fen: string, filters?: GameFilters) {
        fen = normalizeFen(fen);
        const position = this.positionData.get(fen);
        if (!position || !filters) {
            return position;
        }

        let white = 0;
        let black = 0;
        let draws = 0;
        for (const gameUrl of position.games) {
            const game = this.getGame(gameUrl);
            if (matchesFilter(game, filters)) {
                if (game?.result === GameResult.White) white++;
                else if (game?.result === GameResult.Black) black++;
                else draws++;
            }
        }

        const moves = position.moves
            .map((move) => {
                let white = 0;
                let black = 0;
                let draws = 0;
                for (const gameUrl of move.games) {
                    const game = this.getGame(gameUrl);
                    if (matchesFilter(game, filters)) {
                        if (game?.result === GameResult.White) white++;
                        else if (game?.result === GameResult.Black) black++;
                        else draws++;
                    }
                }
                return { ...move, white, black, draws };
            })
            .filter((m) => m.white || m.black || m.draws)
            .sort(
                (lhs, rhs) =>
                    rhs.white + rhs.black + rhs.draws - (lhs.white + lhs.black + lhs.draws),
            );

        return { ...position, white, black, draws, moves };
    }

    mergePosition(fen: string, position: PositionData) {
        fen = normalizeFen(fen);
        const existingPosition = this.positionData.get(fen);
        if (!existingPosition) {
            this.positionData.set(fen, position);
        } else {
            existingPosition.white += position.white;
            existingPosition.black += position.black;
            existingPosition.draws += position.draws;
            for (const g of position.games) {
                existingPosition.games.add(g);
            }

            for (const move of position.moves) {
                const existingMove = existingPosition.moves.find((m) => m.san === move.san);
                if (!existingMove) {
                    existingPosition.moves.push(move);
                } else {
                    existingMove.white += move.white;
                    existingMove.black += move.black;
                    existingMove.draws += move.draws;
                    for (const g of move.games) {
                        existingMove.games.add(g);
                    }
                }
            }
            existingPosition.moves.sort(
                (lhs, rhs) =>
                    rhs.white + rhs.black + rhs.draws - (lhs.white + lhs.black + lhs.draws),
            );
        }
    }

    indexGame(game: GameData, pgn: string): boolean {
        try {
            const chess = new Chess({ pgn });
            if (chess.plyCount() < 2) {
                return false;
            }

            game.plyCount = chess.plyCount();
            game.headers = chess.header().valueMap();
            this.setGame(game);

            const resultKey =
                game.result === '1-0' ? 'white' : game.result === '0-1' ? 'black' : 'draws';
            let position: PositionData = {
                white: 0,
                black: 0,
                draws: 0,
                [resultKey]: 1,
                games: new Set([game.url]),
                moves: [
                    {
                        san: chess.firstMove()?.san || '',
                        white: 0,
                        black: 0,
                        draws: 0,
                        [resultKey]: 1,
                        games: new Set([game.url]),
                    },
                ],
            };
            this.mergePosition(chess.setUpFen(), position);

            for (const move of chess.history()) {
                const nextMove = chess.nextMove(move);

                position = {
                    ...position,
                    games: new Set([game.url]),
                    moves: nextMove
                        ? [
                              {
                                  san: nextMove.san,
                                  white: 0,
                                  black: 0,
                                  draws: 0,
                                  [resultKey]: 1,
                                  games: new Set([game.url]),
                              },
                          ]
                        : [],
                };
                this.mergePosition(move.fen, position);
            }
            return true;
        } catch (err) {
            console.error(`Failed to index game`, game, err);
            return false;
        }
    }

    mergeTree(other: OpeningTree) {
        for (const [url, game] of other.gameData) {
            this.gameData.set(url, game);
        }
        for (const [fen, position] of other.positionData) {
            this.mergePosition(fen, position);
        }
    }
}

function matchesFilter(game: GameData | undefined, filter: GameFilters | undefined): boolean {
    if (!game) {
        return false;
    }
    if (!filter) {
        return true;
    }
    if (filter.color !== Color.Both && game.playerColor !== filter.color) {
        return false;
    }
    if (!filter.casual && !game.rated) {
        return false;
    }
    if (!filter.rated && game.rated) {
        return false;
    }
    if (filter.dateRange[0] && filter.dateRange[0] > game.headers.Date) {
        return false;
    }
    if (filter.dateRange[1] && filter.dateRange[1] < game.headers.Date) {
        return false;
    }
    const opponentRating = game.playerColor === Color.White ? game.blackElo : game.whiteElo;
    if (filter.opponentRating[0] > opponentRating || filter.opponentRating[1] < opponentRating) {
        return false;
    }
    if (!filter.bullet && game.timeClass === OnlineGameTimeClass.Bullet) {
        return false;
    }
    if (!filter.blitz && game.timeClass === OnlineGameTimeClass.Blitz) {
        return false;
    }
    if (!filter.rapid && game.timeClass === OnlineGameTimeClass.Rapid) {
        return false;
    }
    if (!filter.classical && game.timeClass === OnlineGameTimeClass.Classical) {
        return false;
    }
    if (!filter.daily && game.timeClass === OnlineGameTimeClass.Daily) {
        return false;
    }
    return true;
}
