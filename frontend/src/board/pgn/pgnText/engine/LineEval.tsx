import { LineEval } from '@/stockfish/engine/engine';
import { Chess, Color, Square } from '@jackstenglein/chess';
import { Box, ListItem, Skeleton, styled, Typography } from '@mui/material';

interface Props {
    line: LineEval;
}

export default function LineEvaluation({ line }: Props) {
    const lineLabel = getLineEvalLabel(line);

    const isBlackCp =
        (line.cp !== undefined && line.cp < 0) ||
        (line.mate !== undefined && line.mate < 0);

    const showSkeleton = line.depth < 6;

    console.log('Line: ', line);

    return (
        <ListItem disablePadding sx={{ overflowX: 'clip', alignItems: 'center' }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    mr: 0.5,
                    my: 0.5,
                    py: '1px',
                    backgroundColor: isBlackCp ? 'black' : 'white',
                    borderRadius: '5px',
                    border: '1px solid',
                    borderColor: '#424242',
                    width: '45px',
                    minWidth: '45px',
                    height: '23px',
                    minHeight: '23px',
                }}
            >
                {showSkeleton ? (
                    <Skeleton
                        variant='rounded'
                        animation='wave'
                        sx={{ color: 'transparent' }}
                    >
                        placeholder
                    </Skeleton>
                ) : (
                    <Typography
                        component='span'
                        sx={{
                            pt: '2px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: isBlackCp ? 'white' : 'black',
                        }}
                    >
                        {lineLabel}
                    </Typography>
                )}
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {showSkeleton ? (
                    <Skeleton variant='rounded' animation='wave' />
                ) : (
                    line.pv
                        .map(moveLineUciToSan(line.fen))
                        .map((label, idx) => <MoveLabel key={idx}>{label}</MoveLabel>)
                )}
            </Box>
        </ListItem>
    );
}

const MoveLabel = styled('span')({
    textWrap: 'nowrap',
    marginLeft: '6px',
    fontSize: '0.9rem',
});

/**
 * Gets the evaluation label (Ex: +2.3, -1, M5) for the given line.
 * @param line The line to get the evaluation label for.
 * @returns The evaluation label.
 */
const getLineEvalLabel = (line: Pick<LineEval, 'cp' | 'mate'>): string => {
    if (line.cp !== undefined) {
        return `${line.cp > 0 ? '+' : ''}${(line.cp / 100).toFixed(2)}`;
    }

    if (line.mate) {
        return `${line.mate > 0 ? '+' : '-'}M${Math.abs(line.mate)}`;
    }

    return '?';
};

/**
 * Returns a function that converts a move's UCI to SAN. The function
 * must be called in order on each move.
 * @param fen The starting position FEN.
 * @returns A function that converts a move's UCI to SAN.
 */
const moveLineUciToSan = (fen: string): ((moveUci: string) => string) => {
    const game = new Chess({ fen });

    return (moveUci: string): string => {
        try {
            const move = game.move(uciMoveParams(moveUci));
            if (!move) {
                return moveUci;
            }

            let label = '';
            if (!move.previous || move.color === Color.white) {
                label = `${Math.ceil(move.ply / 2)}.`;
                if (move.color === Color.black) {
                    label += '..';
                }
                label += ' ';
            }

            label += move.san;
            return label;
        } catch (e) {
            return moveUci;
        }
    };
};

/**
 * Converts a UCI move string into a Chess.js move object.
 * @param uciMove The UCI move to convert.
 * @returns The Chess.js move object.
 */
const uciMoveParams = (
    uciMove: string,
): {
    from: Square;
    to: Square;
    promotion?: string | undefined;
} => ({
    from: uciMove.slice(0, 2) as Square,
    to: uciMove.slice(2, 4) as Square,
    promotion: uciMove.slice(4, 5) || undefined,
});
