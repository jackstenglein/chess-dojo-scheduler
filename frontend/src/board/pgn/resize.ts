export const CONTAINER_ID = 'resize-container';

const breakpoints = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
};

const minBoardSize = 275;

const navbarHeight = 80;
const playerHeaderHeight = 27.9833;
const controlsHeight = 40;
const controlsMargin = 8;
const margin = 64;

// const defaultPercentageWidths = {
//     xs: {
//         board: 0.42,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     sm: {
//         board: 0.42,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     md: {
//         board: 0.42,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     lg: {
//         board: 0.42,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     xl: {
//         board: 0.42,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
// };

// const defaultPercentageHeights = {
//     xs: {
//         board: 1,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     sm: {
//         board: 1,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     md: {
//         board: 1,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     lg: {
//         board: 1,
//         underboard: 0.29,
//         pgn: 0.29,
//     },
//     xl: {
//         board: 1,
//         underboard: 1,
//         pgn: 1,
//     },
// };

export interface ResizableData {
    width: number;
    minWidth: number;
    maxWidth: number;
    height: number;
    minHeight: number;
    maxHeight: number;
    order?: number;
}

export interface AreaSizes {
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    board: ResizableData;
    underboard: ResizableData;
    pgn: ResizableData;
}

export function getSizes(parentWidth: number): AreaSizes {
    if (parentWidth < breakpoints.sm) {
        return xsSizes(parentWidth);
    }
    if (parentWidth < breakpoints.md) {
        return smSizes(parentWidth);
    }
    return mdSizes(parentWidth);
}

function xsSizes(parentWidth: number): AreaSizes {
    const padding = 6;
    const boardSize = parentWidth - padding;
    return {
        breakpoint: 'xs',
        board: {
            width: boardSize,
            minWidth: boardSize,
            maxWidth: boardSize,
            height: boardSize,
            minHeight: boardSize,
            maxHeight: boardSize,
        },
        pgn: {
            width: boardSize,
            minWidth: boardSize,
            maxWidth: boardSize,
            height:
                window.innerHeight -
                boardSize -
                controlsHeight -
                controlsMargin -
                2 * playerHeaderHeight -
                16,
            minHeight: 200,
            maxHeight: Infinity,
        },
        underboard: {
            width: boardSize,
            minWidth: boardSize,
            maxWidth: boardSize,
            height: 512,
            minHeight: 200,
            maxHeight: Infinity,
            order: 1,
        },
    };
}

function smSizes(parentWidth: number): AreaSizes {
    const padding = 6;
    const spacing = 4;
    const boardSize = ((parentWidth - padding - spacing) * 2) / 3;
    const pgnWidth = parentWidth - padding - spacing - boardSize;
    const boardAreaHeight = getBoardAreaHeight(boardSize);

    return {
        breakpoint: 'sm',
        board: {
            width: boardSize,
            minWidth: minBoardSize,
            maxWidth: boardSize,
            height: boardSize,
            minHeight: minBoardSize,
            maxHeight: boardSize,
        },
        pgn: {
            width: pgnWidth,
            minWidth: 100,
            maxWidth: pgnWidth,
            height: boardAreaHeight,
            minHeight: 100,
            maxHeight: boardAreaHeight,
        },
        underboard: {
            width: parentWidth - padding,
            minWidth: parentWidth - padding,
            maxWidth: parentWidth - padding,
            height: 512,
            minHeight: 200,
            maxHeight: Infinity,
            order: 1,
        },
    };
}

function mdSizes(parentWidth: number): AreaSizes {
    const padding = 6;
    const spacing = 8;

    const availableWidth = parentWidth - padding - 2 * spacing;
    const maxBoardWidth = availableWidth * 0.4;
    const maxBoardHeight = getMaxBoardHeight();
    const boardSize = Math.min(maxBoardWidth, maxBoardHeight);

    const pgnWidth = (availableWidth - boardSize) / 2;
    const underboardWidth = (availableWidth - boardSize) / 2;
    const maxBoardAreaHeight = getMaxBoardAreaHeight();

    return {
        breakpoint: 'md',
        underboard: {
            width: underboardWidth,
            height: maxBoardAreaHeight,
            maxWidth: underboardWidth,
            maxHeight: maxBoardAreaHeight,
            minWidth: 100,
            minHeight: 200,
        },
        board: {
            width: boardSize,
            height: boardSize,
            maxWidth: boardSize,
            maxHeight: boardSize,
            minWidth: minBoardSize,
            minHeight: minBoardSize,
        },
        pgn: {
            width: pgnWidth,
            height: maxBoardAreaHeight,
            maxWidth: pgnWidth,
            maxHeight: maxBoardAreaHeight,
            minWidth: 100,
            minHeight: 200,
        },
    };
}

function getBoardAreaHeight(boardSize: number): number {
    return boardSize + 2 * playerHeaderHeight + controlsHeight + controlsMargin;
}

function getMaxBoardHeight(): number {
    return (
        window.innerHeight -
        navbarHeight -
        2 * playerHeaderHeight -
        controlsHeight -
        controlsMargin -
        margin
    );
}

function getMaxBoardAreaHeight(): number {
    console.log('window.innerHeight: ', window.innerHeight);
    return window.innerHeight - navbarHeight - margin;
}
