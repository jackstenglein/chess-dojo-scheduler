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

export interface Size {
    width: number;
    height: number;
}

export function getDefaultPercentages(area: 'board' | 'underboard' | 'pgn'): Size {
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

export function getBoardPixels(percentages: Size): number {
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

export function getBoardPercentages(size: number): Size {
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
