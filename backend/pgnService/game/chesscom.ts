import { Chess } from '@jackstenglein/chess';
import tcn from '@savi2w/chess-tcn';
import axios from 'axios';
import { Browser, BrowserErrorCaptureEnum } from 'happy-dom';
import moment from 'moment';
import { ApiError } from './errors';

function msToClk(ms: number) {
    return moment.utc(ms).format('H:mm:ss');
}

const chesscomGameRegex = new RegExp('/game/(live|daily)/(\\d+)');

type GetGameByIdResponse = {
    game?: {
        moveTimestamps?: string;
        moveList?: string;
        pgnHeaders?: Record<string, string | number>;
    };
};

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

export async function getChesscomGame(gameURL?: string) {
    const [, gameType, gameId] = (gameURL ?? '').match(chesscomGameRegex) ?? [];
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

    if (gameData?.moveList.length % 2 !== 0) {
        throw new ApiError({
            statusCode: 500,
            publicMessage: 'Chess.com API changed; unexpected moveList format.',
        });
    }

    const encodedMoves = gameData?.moveList.split('').reduce((acc, chr) => {
        if (acc.length === 0 || acc[acc.length - 1].length === 2) {
            acc.push(chr);
        } else {
            acc[acc.length - 1] += chr;
        }

        return acc;
    }, [] as string[]);

    // Convert to milliseconds
    const moveTimestamps = gameData.moveTimestamps.split(',').map((n) => Number(n) * 100);

    const game = new Chess();

    const startingPosition = gameData.pgnHeaders['FEN']?.toString();
    game.load(startingPosition, { skipValidation: true });

    encodedMoves.forEach((encodedMove, idx) => {
        const timestamp = moveTimestamps[idx];
        const clk = msToClk(timestamp);
        const move = tcn.decode(encodedMove);

        game.move(move);
        game.setComment(`[%clk ${clk}]`);
    });

    for (const [key, value] of Object.entries(gameData.pgnHeaders)) {
        game.header(key, value.toString());
    }

    return game.pgn();
}
