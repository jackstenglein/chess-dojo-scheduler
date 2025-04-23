import { LichessExplorerPosition } from '@/database/explorer';
import { GameResult } from '@/database/game';
import { Chess, normalizeFen } from '@jackstenglein/chess';

export interface PositionData extends LichessExplorerPosition {
    /**
     * A set of URLs of the games played in this position. Empty
     * for the starting position.
     */
    games: Set<string>;
}

export interface GameData {
    white: string;
    black: string;
    whiteElo: number;
    blackElo: number;
    result: GameResult;
    plyCount: number;
    rated: boolean;
    url: string;
    headers: Record<string, string>;
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

    getGames(fen: string): GameData[] {
        const position = this.getPosition(fen);
        if (!position) {
            return [];
        }

        const result = [];
        for (const url of position.games) {
            const game = this.getGame(url);
            if (game) {
                result.push(game);
            }
        }
        return result;
    }

    setPosition(fen: string, position: PositionData) {
        fen = normalizeFen(fen);
        this.positionData.set(fen, position);
    }

    getPosition(fen: string) {
        fen = normalizeFen(fen);
        return this.positionData.get(fen);
    }

    mergePosition(fen: string, position: PositionData, game?: GameData) {
        if (game) {
            this.setGame(game);
            position.games.add(game.url);
        }

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
                }
                existingPosition.moves.sort(
                    (lhs, rhs) =>
                        rhs.white + rhs.black + rhs.draws - (lhs.white + lhs.black + lhs.draws),
                );
            }
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
}
