import { Move } from '@jackstenglein/chess';
import { Box, Divider } from '@mui/material';

import MoveButton from './MoveButton';
import Comment from './Comment';

const borderWidth = 1.5; // px
const lineInset = 8; // px

interface LineProps {
    line: Move[];
    currentMove: Move | null;
    depth: number;
    onClickMove: (m: Move) => void;
}

const Line: React.FC<LineProps> = ({ line, currentMove, depth, onClickMove }) => {
    const result: JSX.Element[] = [];

    for (let i = 0; i < line.length; i++) {
        const move = line[i];
        if (i > 0 && move.variations.length > 0) {
            result.push(
                <Lines
                    lines={[line.slice(i), ...move.variations]}
                    currentMove={currentMove}
                    depth={depth + 1}
                    onClickMove={onClickMove}
                />
            );
            break;
        }

        result.push(
            <>
                <MoveButton
                    inline
                    forceShowPly={i === 0}
                    move={move}
                    currentMove={currentMove}
                    onClickMove={onClickMove}
                />
                <Comment text={move.commentAfter} inline />
            </>
        );
    }

    return (
        <Box display='block' pl={`${lineInset}px`} mt={0.5} position='relative'>
            <Divider
                sx={{
                    borderWidth: `${borderWidth}px`,
                    width: `${lineInset}px`,
                    display: 'inline-block',
                    position: 'absolute',
                    left: 0,
                    top: '0.65rem',
                }}
            />

            {result}
        </Box>
    );
};

interface LinesProps {
    lines: Move[][];
    currentMove: Move | null;
    depth?: number;
    onClickMove: (m: Move) => void;
}

const Lines: React.FC<LinesProps> = ({ lines, currentMove, depth, onClickMove }) => {
    let d = depth || 0;

    return (
        <Box
            display='block'
            position='relative'
            sx={{
                pl: d > 0 ? `${2 * borderWidth}px` : 0,
            }}
        >
            {d > 0 && (
                <>
                    {/* Horizontal line when we go down another level */}
                    <Divider
                        sx={{
                            borderWidth: `${borderWidth}px`,
                            width: `${lineInset}px`,
                            display: 'inline-block',
                            position: 'absolute',
                            left: `${-lineInset}px`,
                        }}
                    />
                    {/* Vertical divider showing how far this line extends */}
                    <Divider
                        component='div'
                        orientation='vertical'
                        sx={{
                            position: 'absolute',
                            borderWidth: `${borderWidth}px`,
                            height: 1,
                            left: 0,
                        }}
                    />
                </>
            )}

            {lines.map((l, idx) => (
                <Line
                    key={idx}
                    line={l}
                    currentMove={currentMove}
                    depth={d}
                    onClickMove={onClickMove}
                />
            ))}
        </Box>
    );
};

export default Lines;
