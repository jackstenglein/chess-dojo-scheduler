import Board from '@/board/Board';
import AnnotationWarnings from '@/board/pgn/annotations/AnnotationWarnings';
import { getNagGlyph } from '@/board/pgn/Nag';
import { Color, EventType } from '@jackstenglein/chess';
import { Circle } from '@mui/icons-material';
import { TabContext } from '@mui/lab';
import { Box, CardContent, Stack, Tab, Tabs, Typography } from '@mui/material';
import { blue, red } from '@mui/material/colors';
import { Chess as ChessJS, Square } from 'chess.js';
import { DrawShape } from 'chessground/draw';
import { Key } from 'chessground/types';
import { useEffect, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useGame } from '../../../../../games/view/GamePage';
import { useChess } from '../../../PgnBoard';

export enum InsightType {
    Annotations = 'annotations',
    SquareControl = 'square control',
    Opening = 'opening',
}

const insightTabKey = 'insightTab';

enum HeatLevel {
    Hot = 'hot',
    Warm = 'warm',
    Neutral = 'neutral',
    Cool = 'cool',
    Cold = 'cold',
}

const HeatLevelBreakpoints = {
    [HeatLevel.Hot]: -2,
    [HeatLevel.Warm]: -1,
    [HeatLevel.Neutral]: 0,
    [HeatLevel.Cool]: 1,
    [HeatLevel.Cold]: 100,
};

const HeatColors: Record<string, string | null> = {
    [HeatLevel.Hot]: red[500],
    [HeatLevel.Warm]: red[300],
    [HeatLevel.Neutral]: null,
    [HeatLevel.Cool]: blue[300],
    [HeatLevel.Cold]: blue[500],
};

function AnnotationFeedback() {
    return <AnnotationWarnings inplace={true} />;
}

function getHeatColor(value: number): string | null {
    for (const [level, bp] of Object.entries(HeatLevelBreakpoints)) {
        if (value <= bp) {
            return HeatColors[level];
        }
    }
    const level = Object.entries(HeatLevelBreakpoints).find(([, bp]) => value <= bp)?.[0];
    if (level === undefined) {
        return null;
    }

    return HeatColors[level];
}

type SquareControlData = Record<Square, number>;

function SquareControl() {
    const { chess, gameOrientation } = useChess();
    const [labels, setLabels] = useState<DrawShape[]>([]);
    const [fen, setFen] = useState(chess?.fen());

    useEffect(() => {
        if (!chess) {
            return;
        }

        const observer = {
            types: [
                EventType.LegalMove,
                EventType.NewVariation,
                EventType.DeleteMove,
                EventType.PromoteVariation,
            ],
            handler: () => {
                // We partly do this to force a re-render
                setFen(chess.fen());
            },
        };
        chess.addObserver(observer);
        return () => chess.removeObserver(observer);
    }, [chess, setFen]);

    useEffect(() => {
        if (!chess) {
            return;
        }

        const chessjs = new ChessJS(fen);
        const rows = [8, 7, 6, 5, 4, 3, 2, 1];
        const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const squares = rows.flatMap((row) =>
            cols.flatMap((col) => `${col}${row}`),
        ) as Square[];

        let us = Color.white;
        let them = Color.black;

        if (gameOrientation === 'black') {
            us = Color.black;
            them = Color.white;
        }

        const data: SquareControlData = Object.fromEntries(
            squares.map((square) => {
                return [
                    square,
                    chessjs.attackers(square, us).length -
                        chessjs.attackers(square, them).length,
                ];
            }),
        ) as SquareControlData;

        setLabels(
            Object.entries(data).flatMap(([square, value]) => {
                if (!value) {
                    return [];
                }

                const heatColor = getHeatColor(value);
                if (heatColor === null) {
                    return [];
                }

                return {
                    orig: square as Key,
                    customSvg: {
                        html: getNagGlyph({
                            color: heatColor ?? undefined,
                            label: (value > 0 ? '+' : '') + value.toString(),
                            description: (value > 0 ? '+' : '') + value.toString(),
                        }),
                    },
                };
            }),
        );
    }, [chess, gameOrientation, fen]);

    const opponentDisplay = gameOrientation === 'white' ? 'Black' : 'White';

    return (
        <Stack spacing={2}>
            <Typography variant='body1'>
                A view of square control from the perspective of {gameOrientation}.
                Absolute pins and bad ideas do not effect the calculated value.
            </Typography>
            <Box display='flex' alignItems='center' justifyContent='center'>
                <Box sx={{ width: '336px', aspectRatio: 1 }}>
                    <Board
                        config={{
                            viewOnly: true,
                            drawable: {
                                shapes: labels,
                                eraseOnClick: false,
                            },
                        }}
                    />
                </Box>
            </Box>
            <Stack spacing={0.25} display='flex' flexWrap='wrap'>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: HeatColors[HeatLevel.Cold] }} />
                    <Box>2 more eyes on square than {opponentDisplay}</Box>
                </Box>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: HeatColors[HeatLevel.Cool] }} />
                    <Box>1 more eye on square than {opponentDisplay}</Box>
                </Box>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: HeatColors[HeatLevel.Warm] }} />
                    <Box>1 less eye on square than {opponentDisplay}</Box>
                </Box>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: HeatColors[HeatLevel.Hot] }} />
                    <Box>2 less eyes on square than {opponentDisplay}</Box>
                </Box>
            </Stack>
        </Stack>
    );
}

export default function Insights() {
    const { chess } = useChess();
    const { game } = useGame();
    const [tab, setTab] = useLocalStorage(insightTabKey, InsightType.Annotations);

    if (!game || !chess) {
        return null;
    }

    return (
        <CardContent>
            <TabContext value={tab}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={tab}
                        onChange={(_, val: InsightType) => setTab(val)}
                        aria-label='Insight type'
                        variant='scrollable'
                    >
                        <Tab
                            label='Annotations'
                            value={InsightType.Annotations}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                            data-cy='insight-tab-annotations'
                        />
                        <Tab
                            label='Square Control'
                            value={InsightType.SquareControl}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                            data-cy='insight-tab-square-control'
                        />
                    </Tabs>
                </Box>
                <Box p={4}>
                    {tab === InsightType.Annotations ? (
                        <AnnotationFeedback />
                    ) : tab === InsightType.SquareControl ? (
                        <SquareControl />
                    ) : tab === InsightType.Opening ? (
                        <></>
                    ) : (
                        <></>
                    )}
                </Box>
            </TabContext>
        </CardContent>
    );
}
