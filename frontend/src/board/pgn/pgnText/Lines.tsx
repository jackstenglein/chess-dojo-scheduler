import { CommentType, Event, EventType, Move } from '@jackstenglein/chess';
import { Box, Collapse, Divider, Stack, Tooltip, Typography } from '@mui/material';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useChess } from '../PgnBoard';
import Comment from './Comment';
import MoveButton from './MoveButton';

const borderWidth = 1.5; // px
const lineInset = 8; // px

interface LineProps {
    line: Move[];
    depth: number;
    handleScroll: (child: HTMLElement | null) => void;
}

const Line: React.FC<LineProps> = ({ line, depth, handleScroll }) => {
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

const SCROLL_EXPANSION_INTO_VIEW_Y = 110;

interface LinesProps {
    lines: Move[][];
    depth?: number;
    handleScroll: (child: HTMLElement | null) => void;
}

const Lines: React.FC<LinesProps> = ({ lines, depth, handleScroll }) => {
    const [expanded, setExpanded] = useState(true);
    const expandRef = useRef<HTMLHRElement>(null);
    const d = depth || 0;

    const onCollapse = () => {
        setExpanded(false);
        if (
            expandRef.current &&
            expandRef.current.getBoundingClientRect().y < SCROLL_EXPANSION_INTO_VIEW_Y
        ) {
            handleScroll(expandRef.current);
        }
    };

    return (
        <Box
            display='block'
            position='relative'
            sx={{
                pl: d > 0 ? `${2 * borderWidth}px` : 0,
            }}
        >
            {d > 0 && (
                <Stack direction='row' alignItems={expanded ? undefined : 'center'}>
                    {/* Horizontal line when we go down another level */}
                    <Divider
                        ref={expandRef}
                        sx={{
                            borderWidth: `${borderWidth}px`,
                            width: `${lineInset}px`,
                            display: 'inline-block',
                            position: 'absolute',
                            left: `${-lineInset}px`,
                        }}
                    />

                    {expanded ? (
                        <Tooltip key='collapse' title='Collapse variations' followCursor>
                            <Divider
                                component='div'
                                orientation='vertical'
                                onClick={onCollapse}
                                sx={{
                                    position: 'absolute',
                                    borderWidth: `${borderWidth}px`,
                                    height: 1,
                                    left: 0,
                                    cursor: 'pointer',
                                    ':hover': {
                                        borderColor: 'primary.main',
                                    },
                                }}
                            />
                        </Tooltip>
                    ) : (
                        <Tooltip key='expand' title='Expand variations'>
                            <Box
                                bgcolor='text.disabled'
                                borderRadius='50%'
                                sx={{
                                    width: '20px',
                                    height: '20px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    mb: '2px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => setExpanded(true)}
                            >
                                <Typography variant='caption' color='background.paper'>
                                    +{lines.length}
                                </Typography>
                            </Box>
                        </Tooltip>
                    )}
                </Stack>
            )}

            <Collapse in={expanded}>
                {lines.map((l, idx) => (
                    <Line key={idx} line={l} depth={d} handleScroll={handleScroll} />
                ))}
            </Collapse>
        </Box>
    );
};

export default Lines;
