import { Breakpoint } from '@mui/material';

export const CONTAINER_ID = 'resize-container';

const breakpoints = {
    xs: 0,
    sm: 600,
    md: 900,
    lg: 1200,
    xl: 1536,
};

const defaultPercentageWidths = {
    xs: {
        board: 0.42,
        underboard: 0.29,
        pgn: 0.29,
    },
    sm: {
        board: 0.42,
        underboard: 0.29,
        pgn: 0.29,
    },
    md: {
        board: 0.42,
        underboard: 0.29,
        pgn: 0.29,
    },
    lg: {
        board: 0.42,
        underboard: 0.29,
        pgn: 0.29,
    },
    xl: {
        board: 0.42,
        underboard: 0.29,
        pgn: 0.29,
    },
};

const defaultPercentageHeights = {
    xs: {
        board: 1,
        underboard: 0.29,
        pgn: 0.29,
    },
    sm: {
        board: 1,
        underboard: 0.29,
        pgn: 0.29,
    },
    md: {
        board: 1,
        underboard: 0.29,
        pgn: 0.29,
    },
    lg: {
        board: 1,
        underboard: 0.29,
        pgn: 0.29,
    },
    xl: {
        board: 1,
        underboard: 1,
        pgn: 1,
    },
};

export interface ResizableData {
    width: number;
    height: number;
    order?: number;
}

export interface AreaSizes {
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
    if (parentWidth < breakpoints.lg) {
        return mdSizes(parentWidth);
    }
    return lgSizes(parentWidth);
}

function xsSizes(parentWidth: number): AreaSizes {
    const padding = 6;
    return {
        board: {
            width: parentWidth - padding,
            height: parentWidth - padding,
        },
        pgn: {
            width: parentWidth - padding,
            height: 200,
        },
        underboard: {
            width: parentWidth - padding,
            height: 200,
            order: 1,
        },
    };
}

function smSizes(parentWidth: number): AreaSizes {
    const padding = 6;
    const spacing = 4;
    const boardSize = ((parentWidth - padding - spacing) * 2) / 3;
    const pgnWidth = parentWidth - padding - spacing - boardSize;

    return {
        board: {
            width: boardSize,
            height: boardSize,
        },
        pgn: {
            width: pgnWidth,
            height: boardSize,
        },
        underboard: {
            width: parentWidth - padding,
            height: 200,
            order: 1,
        },
    };
}

function mdSizes(parentWidth: number): AreaSizes {
    const padding = 6;
    const spacing = 16;

    const boardSize = (parentWidth - padding - 2 * spacing) * 0.5;
    const pgnWidth = (parentWidth - padding - 2 * spacing - boardSize) / 2;
    const underboardWidth = parentWidth - padding - 2 * spacing - boardSize - pgnWidth;

    const boardAreaHeight = getBoardAreaHeight(boardSize);

    return {
        underboard: {
            width: underboardWidth,
            height: boardAreaHeight,
        },
        board: {
            width: boardSize,
            height: boardSize,
        },
        pgn: {
            width: pgnWidth,
            height: boardAreaHeight,
        },
    };
}

function lgSizes(parentWidth: number): AreaSizes {
    const padding = 16;
    const spacing = 16;
    const minUnderboardWidth = 400;
    const minPgnWidth = 400;

    const availableWidth = parentWidth - padding - 2 * spacing;
    const maxBoardWidth = availableWidth - minUnderboardWidth - minPgnWidth;
    const maxBoardHeight = getMaxBoardHeight();

    const boardSize = Math.min(maxBoardWidth, maxBoardHeight);
    const underboardWidth = (availableWidth - boardSize) / 2;
    const pgnWidth = availableWidth - boardSize - underboardWidth;
    const boardAreaHeight = getBoardAreaHeight(boardSize);

    return {
        underboard: {
            width: underboardWidth,
            height: boardAreaHeight,
        },
        board: {
            width: boardSize,
            height: boardSize,
        },
        pgn: {
            width: pgnWidth,
            height: boardAreaHeight,
        },
    };
}

function getBoardAreaHeight(boardSize: number): number {
    const playerHeaderHeight = 27.9833;
    const controlsHeight = 40;
    const controlsMargin = 8;
    return boardSize + 2 * playerHeaderHeight + controlsHeight + controlsMargin;
}

function getMaxBoardHeight(): number {
    const navbarHeight = 80;
    const playerHeaderHeight = 27.9833;
    const controlsHeight = 40;
    const controlsMargin = 8;
    const margin = 64;

    return (
        window.innerHeight -
        navbarHeight -
        2 * playerHeaderHeight -
        controlsHeight -
        controlsMargin -
        margin
    );
}

export function getDefaultPercentages(
    area: 'board' | 'underboard' | 'pgn'
): ResizableData {
    const parentWidth =
        document.getElementById(CONTAINER_ID)?.getBoundingClientRect().width || 0;

    if (parentWidth > breakpoints.xl) {
        return {
            width: defaultPercentageWidths.xl[area],
            height: defaultPercentageHeights.xl[area],
        };
    }
    if (parentWidth > breakpoints.lg) {
        return {
            width: defaultPercentageWidths.lg[area],
            height: defaultPercentageHeights.lg[area],
        };
    }
    if (parentWidth > breakpoints.md) {
        return {
            width: defaultPercentageWidths.md[area],
            height: defaultPercentageHeights.md[area],
        };
    }
    if (parentWidth > breakpoints.sm) {
        return {
            width: defaultPercentageWidths.sm[area],
            height: defaultPercentageHeights.sm[area],
        };
    }
    return {
        width: defaultPercentageWidths.xs[area],
        height: defaultPercentageHeights.xs[area],
    };
}

export function getBoardPixels(percentages: ResizableData): number {
    const parentWidth =
        document.getElementById(CONTAINER_ID)?.getBoundingClientRect().width || 0;
    console.log('Percentages: ', percentages);
    console.log('Parent Width: ', parentWidth);
    console.log('Window Height: ', window.innerHeight);
    if (!parentWidth) {
        return 0;
    }

    const width = parentWidth * percentages.width;
    const height = (window.innerHeight - 80 - 56 - 48 - 64) * percentages.height;
    console.log('Width: ', width);
    console.log('Height: ', height);

    return Math.min(width, height);
}

export function getBoardPercentages(size: number): ResizableData {
    const parentRect = document.getElementById(CONTAINER_ID)?.getBoundingClientRect();
    if (!parentRect) {
        return {
            width: defaultPercentageWidths.xs.board,
            height: defaultPercentageHeights.xs.board,
        };
    }

    const availableHeight = window.innerHeight - 80 - 56 - 48 - 64;

    return {
        width: size / parentRect.width,
        height: size / availableHeight,
    };
}

export function getDefaultWidth(
    breakpoint: Breakpoint,
    area: 'board' | 'underboard' | 'pgn'
): number {
    const parentWidth =
        document.getElementById(CONTAINER_ID)?.getBoundingClientRect().width || 0;

    console.log('Parent Width: ', parentWidth);
    const result = parentWidth * defaultPercentageWidths[breakpoint][area];
    console.log('Default width: ', result);
    return result;
}
