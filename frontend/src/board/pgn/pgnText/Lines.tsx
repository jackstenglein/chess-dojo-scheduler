import { useAuth } from '@/auth/Auth';
import { CommentType, Event, EventType, Move } from '@jackstenglein/chess';
import { Box, Collapse, Divider, Stack, Tooltip, Typography } from '@mui/material';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import {
    isSuggestedVariation,
    isVariationSuggestor,
} from '../boardTools/underboard/comments/suggestVariation';
import { ShowSuggestedVariations } from '../boardTools/underboard/settings/ViewerSettings';
import { useChess } from '../PgnBoard';
import Comment from './Comment';
import MoveButton, { MoveButtonSlotProps } from './MoveButton';

const borderWidth = 1.5; // px
const lineInset = 8; // px

interface LineProps {
    line: Move[];
    depth: number;
    handleScroll: (child: HTMLElement | null) => void;
    onExpand: () => void;
    forceShowSuggestedVariations?: boolean;
    slotProps?: {
        moveButton?: MoveButtonSlotProps;
    };
}

export const Line: React.FC<LineProps> = ({
    line,
    depth,
    handleScroll,
    onExpand,
    forceShowSuggestedVariations,
    slotProps,
}) => {
    const { user } = useAuth();
    const { chess } = useChess();
    const [, setForceRender] = useState(0);
    const [showSuggestedVariations] = useLocalStorage<boolean>(
        ShowSuggestedVariations.key,
        ShowSuggestedVariations.default,
    );

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
        if (
            !forceShowSuggestedVariations &&
            !showSuggestedVariations &&
            isSuggestedVariation(move) &&
            !isVariationSuggestor(user?.username, move)
        ) {
            break;
        }

        if (i > 0 && move.variations.length > 0) {
            result.push(
                <Lines
                    key={`line-${i}`}
                    lines={[line.slice(i), ...move.variations]}
                    depth={depth + 1}
                    handleScroll={handleScroll}
                    expandParent={onExpand}
                    forceShowSuggestedVariations={forceShowSuggestedVariations}
                    slotProps={slotProps}
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
                    slotProps={slotProps?.moveButton}
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
    expandParent?: () => void;
    forceShowSuggestedVariations?: boolean;
    slotProps?: {
        moveButton?: MoveButtonSlotProps;
    };
}

const Lines: React.FC<LinesProps> = ({
    lines,
    depth,
    handleScroll,
    expandParent,
    forceShowSuggestedVariations,
    slotProps,
}) => {
    const { chess } = useChess();

    const forceExpansion = useMemo(() => {
        const variation = chess?.currentMove()?.variation;
        for (const m of variation ?? []) {
            for (const line of lines) {
                if (m === line[0]) {
                    return true;
                }
            }
            if (m === chess?.currentMove()) {
                return false;
            }
        }
        return false;
    }, [chess, lines]);

    depth = depth ?? 0;
    const [expanded, setExpanded] = useState(forceExpansion || depth < 3 || depth % 2 === 0);
    const expandRef = useRef<HTMLHRElement>(null);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.NewVariation, EventType.LegalMove],
                handler: (event: Event) => {
                    for (const m of event.move?.variation ?? []) {
                        for (const line of lines) {
                            if (m === line[0]) {
                                setExpanded(true);
                                expandParent?.();
                                return;
                            }
                        }
                        if (m === event.move) {
                            // We found the move that triggered the event, and it comes before
                            // all of the lines, so we don't need to expand anything.
                            return;
                        }
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, lines, setExpanded, expandParent]);

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
            ref={expandRef}
            display='block'
            position='relative'
            sx={{
                pl: depth > -1 ? `${2 * borderWidth}px` : 0,
            }}
        >
            <Stack direction='row' alignItems={expanded ? undefined : 'center'}>
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
                                minWidth: '20px',
                                minHeight: '20px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                mb: '2px',
                                cursor: 'pointer',
                                aspectRatio: '1',
                                ...(depth === 0
                                    ? {
                                          mt: '2px',
                                      }
                                    : {}),
                            }}
                            onClick={() => setExpanded(true)}
                        >
                            <Typography
                                variant='caption'
                                color='background.paper'
                                sx={{ mx: '2px' }}
                            >
                                +{lines.length}
                            </Typography>
                        </Box>
                    </Tooltip>
                )}
            </Stack>

            <Collapse in={expanded} unmountOnExit={true}>
                {lines.map((l, idx) => (
                    <Line
                        key={idx}
                        line={l}
                        depth={depth}
                        handleScroll={handleScroll}
                        onExpand={() => {
                            setExpanded(true);
                            expandParent?.();
                        }}
                        forceShowSuggestedVariations={forceShowSuggestedVariations}
                        slotProps={slotProps}
                    />
                ))}
            </Collapse>
        </Box>
    );
};

export default Lines;
