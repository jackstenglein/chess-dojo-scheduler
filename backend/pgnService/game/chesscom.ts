import { CandidateMove, Chess } from '@jackstenglein/chess';
import tcn from '@savi2w/chess-tcn';
import axios from 'axios';
import { ApiError } from 'chess-dojo-directory-service/api';
import { Browser, BrowserErrorCaptureEnum } from 'happy-dom';
import moment from 'moment';
/**
 * Converts the given epoch milliseconds to the H:mm:ss format.
 * @param ms The epoch time in milliseconds.
 * @returns The given time converted to H:mm:ss format.
 */
function msToClk(ms: number) {
    return moment.utc(ms).format('H:mm:ss');
}

const chesscomGameRegexes = [
    new RegExp('/game/(live|daily)/(\\d+)'),
    new RegExp('/(live|daily)/game/(\\d+)'),
];

type GetGameByIdResponse = {
    game?: {
        moveTimestamps?: string;
        moveList?: string;
        pgnHeaders?: Record<string, string | number>;
    };
};

/**
 * Extracts the PGN from a Chess.com saved analysis.
 * @param url The URL of the analysis.
 * @returns The PGN of the analysis.
 */
export async function getChesscomAnalysis(url?: string) {
    if (!url) {
        throw new ApiError({
            statusCode: 400,
            publicMessage:
                'Invalid request: url is required when importing a chess.com saved analysis.',
        });
    }

    const browser = new Browser({
        settings: {
            disableJavaScriptFileLoading: true,
            disableCSSFileLoading: true,
            disableIframePageLoading: true,
            disableComputedStyleRendering: true,
            errorCapture: BrowserErrorCaptureEnum.processLevel,
        },
    });

    const page = browser.newPage();
    await page.goto(url);
    await page.waitUntilComplete();

    const data = page.mainFrame.window.eval('window.chesscom');
    if (typeof data !== 'object') {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'This Chess.com analysis page may not yet be supported.',
            privateMessage: 'window.chesscom was undefined or not an object',
        });
    }

    if (!('analysis' in data)) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'This Chess.com analysis page may not yet be supported.',
            privateMessage: 'window.chesscom did not contain an analysis field',
        });
    }

    const analysis = data.analysis;
    if (typeof analysis !== 'object' || !('pgn' in analysis)) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'This Chess.com analysis page may not yet be supported.',
            privateMessage: 'window.chesscom.analysis did not contain a pgn filed',
        });
    }

    const pgnText = analysis.pgn;
    if (typeof pgnText !== 'string') {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'This Chess.com analysis page may not yet be supported.',
            privateMessage: 'window.chesscom.analysis.pgn was not a string',
        });
    }

    return pgnText;
}

/**
 * Extracts the PGN from a Chess.com game.
 * @param gameURL The URL of the game.
 * @returns The PGN of the game.
 */
export async function getChesscomGame(gameURL?: string) {
    let gameType: string | undefined = undefined;
    let gameId: string | undefined = undefined;

    for (const regex of chesscomGameRegexes) {
        [, gameType, gameId] = (gameURL ?? '').match(regex) ?? [];
        if (gameType && gameId) {
            break;
        }
    }

    if (!gameType || !gameId) {
        throw new ApiError({
            statusCode: 400,
            publicMessage: 'Not a valid chess.com live or daily game URL',
        });
    }

    const resp = await axios.get<GetGameByIdResponse>(
        `https://www.chess.com/callback/${gameType}/game/${gameId}`,
    );
    const gameData = resp.data.game;

    // Unstable endpoint not part of the official API
    if (
        gameData?.moveTimestamps === undefined ||
        gameData?.moveList === undefined ||
        gameData?.pgnHeaders === undefined
    ) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Chess.com API changed',
        });
    }

    if (gameData.moveList.length % 2 !== 0) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Chess.com API changed; unexpected moveList format',
        });
    }

    const encodedMoves = [];
    for (let i = 0; i < gameData.moveList.length; i += 2) {
        encodedMoves.push(gameData.moveList.slice(i, i + 2));
    }

    // Convert to milliseconds
    const moveTimestamps = gameData.moveTimestamps.split(',').map((n) => Number(n) * 100);

    const startingPosition = gameData.pgnHeaders['FEN']?.toString();
    const game = new Chess({ fen: startingPosition });

    encodedMoves.forEach((encodedMove, idx) => {
        const timestamp = moveTimestamps[idx];
        const clk = msToClk(timestamp);
        const move = tcn.decode(encodedMove);

        game.move(move as CandidateMove);
        game.setComment(`[%clk ${clk}]`);
    });

    for (const [key, value] of Object.entries(gameData.pgnHeaders)) {
        game.setHeader(key, value.toString());
    }

    return game.pgn.render();
}
