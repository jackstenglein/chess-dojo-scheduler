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
    const availableWidth = parentWidth - padding - spacing;
    const boardSize = (availableWidth * 2) / 3;
    const pgnWidth = availableWidth - boardSize;
    const boardAreaHeight = getBoardAreaHeight(boardSize);

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
        availableWidth,
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
    };
}

export function getNewSizes(currentSizes: AreaSizes): AreaSizes {
    if (currentSizes.breakpoint === 'xs') {
        return currentSizes;
    }

    const maxBoardHeight = getMaxBoardHeight();
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
    return window.innerHeight - navbarHeight - margin;
}
