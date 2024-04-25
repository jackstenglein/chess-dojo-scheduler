import { CommentType, Event, EventType, Move } from '@jackstenglein/chess';
import { Box, Divider } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';
import { useChess } from '../PgnBoard';
import Comment from './Comment';
import MoveButton from './MoveButton';

const borderWidth = 1.5; // px
const lineInset = 8; // px

interface LineProps {
    line: Move[];
    depth: number;
    onClickMove: (m: Move) => void;
    handleScroll: (child: HTMLButtonElement | null) => void;
}

const Line: React.FC<LineProps> = ({ line, depth, onClickMove, handleScroll }) => {
    const chess = useChess().chess;
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.NewVariation, EventType.DeleteMove],
                handler: (event: Event) => {
                    if (event.previousMove && line.includes(event.previousMove)) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, line, setForceRender]);

    const result: JSX.Element[] = [];

    for (let i = 0; i < line.length; i++) {
        const move = line[i];
        if (i > 0 && move.variations.length > 0) {
            result.push(
                <Lines
                    key={`line-${i}`}
                    lines={[line.slice(i), ...move.variations]}
                    depth={depth + 1}
                    onClickMove={onClickMove}
                    handleScroll={handleScroll}
                />,
            );
            break;
        }

        result.push(
            <Fragment key={`fragment-${i}`}>
                <Comment move={move} type={CommentType.Before} inline />
                <MoveButton
                    inline
                    forceShowPly={i === 0}
                    move={move}
                    onClickMove={onClickMove}
                    handleScroll={handleScroll}
                />
                <Comment move={move} inline />
            </Fragment>,
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
    depth?: number;
    onClickMove: (m: Move) => void;
    handleScroll: (child: HTMLButtonElement | null) => void;
}

const Lines: React.FC<LinesProps> = ({ lines, depth, onClickMove, handleScroll }) => {
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
                    depth={d}
                    onClickMove={onClickMove}
                    handleScroll={handleScroll}
                />
            ))}
        </Box>
    );
};

export default Lines;
