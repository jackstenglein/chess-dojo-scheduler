import { grey } from '@mui/material/colors';
import {
    BoardStyle,
    PieceStyle,
} from './pgn/boardTools/underboard/settings/ViewerSettings';

interface BoardSx {
    '--board-background': string;
    '--light-square-coord-color': string;
    '--dark-square-coord-color': string;
}

interface PieceSx {
    '--white-pawn': string;
    '--white-bishop': string;
    '--white-knight': string;
    '--white-rook': string;
    '--white-queen': string;
    '--white-king': string;
    '--black-pawn': string;
    '--black-bishop': string;
    '--black-knight': string;
    '--black-rook': string;
    '--black-queen': string;
    '--black-king': string;
}

/**
 * Returns a set of CSS vars that should be passed to the board wrapper's MUI sx prop,
 * based on the provided board style.
 * @param style The board style to get CSS vars for.
 * @returns A set of CSS vars that should be passed to the board wrapper's MUI sx prop.
 */
export function getBoardSx(style: BoardStyle): BoardSx {
    switch (style) {
        case BoardStyle.Standard:
            return {
                '--board-background': `url('https://chess-dojo-images.s3.amazonaws.com/board/backgrounds/icy_sea.png')`,
                '--light-square-coord-color': '#7296ac',
                '--dark-square-coord-color': '#fff',
            };
        case BoardStyle.Ocean:
            return {
                '--board-background': `url('https://github.com/lichess-org/lila/blob/master/public/images/board/ncf-board.png?raw=true')`,
                '--dark-square-coord-color': '#bbcfff',
                '--light-square-coord-color': '#5477ca',
            };
        case BoardStyle.CherryBlossom:
            return {
                '--board-background': `url('https://github.com/lichess-org/lila/blob/master/public/images/board/pink-pyramid.png?raw=true')`,
                '--dark-square-coord-color': '#f1f1c9',
                '--light-square-coord-color': '#f37a7a',
            };
        case BoardStyle.Moon:
            return {
                '--board-background': `url('https://github.com/lichess-org/lila/blob/master/public/images/board/grey.jpg?raw=true')`,
                '--dark-square-coord-color': grey['300'],
                '--light-square-coord-color': grey['800'],
            };
        case BoardStyle.Summer:
            return {
                '--board-background': `url('https://github.com/lichess-org/lila/blob/master/public/images/board/green-plastic.png?raw=true')`,
                '--dark-square-coord-color': '#f1f6b2',
                '--light-square-coord-color': '#59935d',
            };
        case BoardStyle.Walnut:
            return {
                '--board-background': `url('https://github.com/lichess-org/lila/blob/master/public/images/board/maple2.jpg?raw=true')`,
                '--dark-square-coord-color': '#e0c498',
                '--light-square-coord-color': '#9f6853',
            };
        case BoardStyle.Wood:
            return {
                '--board-background': `url('https://github.com/lichess-org/lila/blob/master/public/images/board/wood.jpg?raw=true')`,
                '--dark-square-coord-color': '#d9a55a',
                '--light-square-coord-color': '#88471d',
            };
    }
}

/**
 * Returns a set of CSS vars that should be passed to the board wrapper's MUI sx prop,
 * based on the provided piece style.
 * @param style The piece style to get the CSS vars for.
 * @returns A set of CSS vars that should be passed to the board wrapper's MUI sx prop.
 */
export function getPieceSx(style: PieceStyle): PieceSx {
    switch (style) {
        case PieceStyle.Standard:
            return {
                '--white-pawn': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wp.png')`,
                '--white-bishop': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wb.png')`,
                '--white-knight': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wn.png')`,
                '--white-rook': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wr.png')`,
                '--white-queen': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wq.png')`,
                '--white-king': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/wk.png')`,
                '--black-pawn': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bp.png')`,
                '--black-bishop': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bb.png')`,
                '--black-knight': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bn.png')`,
                '--black-rook': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/br.png')`,
                '--black-queen': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bq.png')`,
                '--black-king': `url('https://chess-dojo-images.s3.amazonaws.com/board/pieces/bases/bk.png')`,
            };
        case PieceStyle.Pixel:
            return getStandardPieceBackgrounds(
                'https://raw.githubusercontent.com/lichess-org/lila-gif/1c47319f4750e90b8883ec97017cb63b68731ee5/theme/piece/pixel/',
                '.svg',
            );
        case PieceStyle.Spatial:
            return getStandardPieceBackgrounds(
                'https://raw.githubusercontent.com/lichess-org/lila-gif/1c47319f4750e90b8883ec97017cb63b68731ee5/theme/piece/spatial/',
                '.svg',
            );
        case PieceStyle.Celtic:
            return getStandardPieceBackgrounds(
                'https://raw.githubusercontent.com/lichess-org/lila-gif/1c47319f4750e90b8883ec97017cb63b68731ee5/theme/piece/celtic/',
                '.svg',
            );
        case PieceStyle.Fantasy:
            return getStandardPieceBackgrounds(
                'https://raw.githubusercontent.com/lichess-org/lila-gif/1c47319f4750e90b8883ec97017cb63b68731ee5/theme/piece/fantasy/',
                '.svg',
            );
        case PieceStyle.Chessnut:
            return getStandardPieceBackgrounds(
                'https://raw.githubusercontent.com/lichess-org/lila-gif/1c47319f4750e90b8883ec97017cb63b68731ee5/theme/piece/chessnut/',
                '.svg',
            );
        case PieceStyle.Cburnett:
            return getStandardPieceBackgrounds(
                'https://raw.githubusercontent.com/lichess-org/lila-gif/1c47319f4750e90b8883ec97017cb63b68731ee5/theme/piece/cburnett/',
                '.svg',
            );
        case PieceStyle.ThreeD:
            return {
                '--white-pawn': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/White-Pawn.png?raw=true')`,
                '--white-bishop': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/White-Bishop.png?raw=true')`,
                '--white-knight': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/White-Knight.png?raw=true')`,
                '--white-rook': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/White-Rook.png?raw=true')`,
                '--white-queen': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/White-Queen.png?raw=true')`,
                '--white-king': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/White-King.png?raw=true')`,
                '--black-pawn': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/Black-Pawn.png?raw=true')`,
                '--black-bishop': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/Black-Bishop.png?raw=true')`,
                '--black-knight': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/Black-Knight.png?raw=true')`,
                '--black-rook': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/Black-Rook.png?raw=true')`,
                '--black-queen': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/Black-Queen.png?raw=true')`,
                '--black-king': `url('https://github.com/clarkerubber/Staunton-Pieces/blob/master/Renders/RedVBlue/MaxRes/Black-King.png?raw=true')`,
            };
    }
}

/**
 * Returns a set of CSS piece backgrounds vars in standard format. IE: urlPrefix followed by wP,
 * wB, bP, etc. followed by urlSuffix.
 * @param urlPrefix The prefix of the piece URL. IE: the portion before wP, wB, etc.
 * @param urlSuffix The suffix of the piece URL. IE: the portion after wP, wB, etc.
 * @returns A set of CSS piece background vars.
 */
function getStandardPieceBackgrounds(urlPrefix: string, urlSuffix: string): PieceSx {
    return {
        '--white-pawn': `url('${urlPrefix}wP${urlSuffix}')`,
        '--white-bishop': `url('${urlPrefix}wB${urlSuffix}')`,
        '--white-knight': `url('${urlPrefix}wN${urlSuffix}')`,
        '--white-rook': `url('${urlPrefix}wR${urlSuffix}')`,
        '--white-queen': `url('${urlPrefix}wQ${urlSuffix}')`,
        '--white-king': `url('${urlPrefix}wK${urlSuffix}')`,
        '--black-pawn': `url('${urlPrefix}bP${urlSuffix}')`,
        '--black-bishop': `url('${urlPrefix}bB${urlSuffix}')`,
        '--black-knight': `url('${urlPrefix}bN${urlSuffix}')`,
        '--black-rook': `url('${urlPrefix}bR${urlSuffix}')`,
        '--black-queen': `url('${urlPrefix}bQ${urlSuffix}')`,
        '--black-king': `url('${urlPrefix}bK${urlSuffix}')`,
    };
}
