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
    breakpoint: 'xs' | 'sm' | 'md';
    availableWidth: number;
    board: ResizableData;
    underboard: ResizableData;
    pgn: ResizableData;
}

export function getSizes(
    parentWidth: number,
    showUnderboard?: boolean,
    hidePlayerHeaders?: boolean
): AreaSizes {
    if (parentWidth < breakpoints.sm) {
        return xsSizes(parentWidth, showUnderboard, hidePlayerHeaders);
    }
    if (parentWidth < breakpoints.md) {
        return smSizes(parentWidth, showUnderboard, hidePlayerHeaders);
    }
    return mdSizes(parentWidth, showUnderboard, hidePlayerHeaders);
}

function xsSizes(
    parentWidth: number,
    showUnderboard?: boolean,
    hidePlayerHeaders?: boolean
): AreaSizes {
    const padding = 6;
    const boardSize = parentWidth - padding;
    const playerHeadersHeight = hidePlayerHeaders ? 0 : 2 * playerHeaderHeight;

    return {
        breakpoint: 'xs',
        availableWidth: boardSize,
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
                playerHeadersHeight -
                16,
            minHeight: 200,
            maxHeight: Infinity,
        },
        underboard: showUnderboard
            ? {
                  width: boardSize,
                  minWidth: boardSize,
                  maxWidth: boardSize,
                  height: 512,
                  minHeight: 200,
                  maxHeight: Infinity,
                  order: 1,
              }
            : {
                  width: 0,
                  height: 0,
                  maxWidth: 0,
                  maxHeight: 0,
                  minWidth: 0,
                  minHeight: 0,
              },
    };
}

function smSizes(
    parentWidth: number,
    showUnderboard?: boolean,
    hidePlayerHeaders?: boolean
): AreaSizes {
    const padding = 6;
    const spacing = 4;
    const availableWidth = parentWidth - padding - spacing;
    const boardSize = availableWidth * 0.66;
    const pgnWidth = availableWidth - boardSize;
    const boardAreaHeight = getBoardAreaHeight(boardSize, hidePlayerHeaders);

    return {
        breakpoint: 'sm',
        availableWidth,
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
        underboard: showUnderboard
            ? {
                  width: parentWidth - padding,
                  minWidth: parentWidth - padding,
                  maxWidth: parentWidth - padding,
                  height: 512,
                  minHeight: 200,
                  maxHeight: Infinity,
                  order: 1,
              }
            : {
                  width: 0,
                  height: 0,
                  maxWidth: 0,
                  maxHeight: 0,
                  minWidth: 0,
                  minHeight: 0,
              },
    };
}

function mdSizes(
    parentWidth: number,
    showUnderboard?: boolean,
    hidePlayerHeaders?: boolean
): AreaSizes {
    const padding = 6;
    const spacing = 8;

    const availableWidth = parentWidth - padding - 2 * spacing;
    const maxBoardWidth = availableWidth * (showUnderboard ? 0.4 : 0.66);
    const maxBoardHeight = getMaxBoardHeight(hidePlayerHeaders);
    const boardSize = Math.min(maxBoardWidth, maxBoardHeight);

    let pgnWidth: number;
    let underboardWidth = 0;

    if (showUnderboard) {
        pgnWidth = (availableWidth - boardSize) / 2;
        underboardWidth = (availableWidth - boardSize) / 2;
    } else {
        pgnWidth = availableWidth - boardSize;
    }

    const maxBoardAreaHeight = getMaxBoardAreaHeight();

    return {
        breakpoint: 'md',
        availableWidth,
        board: {
            width: boardSize,
            height: boardSize,
            maxWidth: boardSize,
            maxHeight: maxBoardHeight,
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
        underboard: showUnderboard
            ? {
                  width: underboardWidth,
                  height: maxBoardAreaHeight,
                  maxWidth: underboardWidth,
                  maxHeight: maxBoardAreaHeight,
                  minWidth: 100,
                  minHeight: 200,
              }
            : {
                  width: 0,
                  height: 0,
                  maxWidth: 0,
                  maxHeight: 0,
                  minWidth: 0,
                  minHeight: 0,
              },
    };
}

export function getNewSizes(
    currentSizes: AreaSizes,
    hidePlayerHeaders?: boolean
): AreaSizes {
    if (currentSizes.breakpoint === 'xs') {
        return currentSizes;
    }

    const maxBoardHeight = getMaxBoardHeight(hidePlayerHeaders);
    let maxBoardWidth = currentSizes.availableWidth - currentSizes.pgn.width;

    if (currentSizes.breakpoint === 'sm') {
        const maxBoardSize = Math.min(maxBoardHeight, maxBoardWidth);
        return {
            ...currentSizes,
            board: {
                ...currentSizes.board,
                maxWidth: maxBoardSize,
                maxHeight: maxBoardSize,
            },
            pgn: {
                ...currentSizes.pgn,
                maxWidth: currentSizes.availableWidth - currentSizes.board.width,
            },
        };
    }

    maxBoardWidth -= currentSizes.underboard.width;
    const maxBoardSize = Math.min(maxBoardHeight, maxBoardWidth);
    return {
        ...currentSizes,
        board: {
            ...currentSizes.board,
            maxWidth: maxBoardSize,
            maxHeight: maxBoardSize,
        },
        pgn: {
            ...currentSizes.pgn,
            maxWidth:
                currentSizes.availableWidth -
                currentSizes.board.width -
                currentSizes.underboard.width,
        },
        underboard: {
            ...currentSizes.underboard,
            maxWidth:
                currentSizes.availableWidth -
                currentSizes.board.width -
                currentSizes.pgn.width,
        },
    };
}

function getBoardAreaHeight(boardSize: number, hidePlayerHeaders?: boolean): number {
    const playerHeadersHeight = hidePlayerHeaders ? 0 : 2 * playerHeaderHeight;
    return boardSize + playerHeadersHeight + controlsHeight + controlsMargin;
}

function getMaxBoardHeight(hidePlayerHeaders?: boolean): number {
    const playerHeadersHeight = hidePlayerHeaders ? 0 : 2 * playerHeaderHeight;
    return (
        window.innerHeight -
        navbarHeight -
        playerHeadersHeight -
        controlsHeight -
        controlsMargin -
        margin
    );
}

function getMaxBoardAreaHeight(): number {
    return window.innerHeight - navbarHeight - margin;
}
