import Board from '@/board/Board';
import AnnotationWarnings from '@/board/pgn/annotations/AnnotationWarnings';
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

const HOT = red[500];
const WARM = red[200];
const NEUTRAL = undefined;
const COOL = blue[200];
const COLD = blue[500];

const heatColors: [number, string | undefined][] = [
    [-2, HOT],
    [-1, WARM],
    [0, NEUTRAL],
    [1, COOL],
    [Infinity, COLD],
];

function AnnotationFeedback() {
    return <AnnotationWarnings inplace={true} />;
}

function getHeatColor(value: number): string | undefined {
    return heatColors.find(([bp]) => value <= bp)?.[1];
}

type SquareControlData = Record<Square, number>;

function SquareControl() {
    const { chess, gameOrientation } = useChess();
    const [labels, setLabels] = useState<DrawShape[]>([]);

    const currentMove = chess?.currentMove();

    useEffect(() => {
        if (!chess) {
            return;
        }

        const chessjs = new ChessJS(chess.fen(currentMove));
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
            squares.map((square) => [
                square,
                chessjs.attackers(square, us).length -
                    chessjs.attackers(square, them).length,
            ]),
        ) as SquareControlData;

        setLabels(
            Object.entries(data).flatMap(([square, value]) => {
                const heatCol = getHeatColor(value);
                if (!heatCol) {
                    return [];
                }

                return {
                    orig: square as Key,
                    label: {
                        text: '',
                        fill: heatCol,
                    },
                };
            }),
        );
    }, [chess, gameOrientation, currentMove]);

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
                            },
                        }}
                    />
                </Box>
            </Box>
            <Stack spacing={0.25} display='flex' flexWrap='wrap'>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: COLD }} />
                    <Box>2 more eyes on square than Black</Box>
                </Box>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: COOL }} />
                    <Box>1 more eye on square than Black</Box>
                </Box>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: WARM }} />
                    <Box>1 less eye on square than Black</Box>
                </Box>
                <Box display='flex' gap='0.25rem'>
                    <Circle sx={{ color: HOT }} />
                    <Box>2 less eyes on square than Black</Box>
                </Box>
            </Stack>
        </Stack>
    );
}

export default function Insights() {
    const { chess } = useChess();
    const [, setForceRender] = useState(0);
    const { game } = useGame();
    const [tab, setTab] = useLocalStorage(insightTabKey, InsightType.Annotations);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [
                    EventType.LegalMove,
                    EventType.NewVariation,
                    EventType.DeleteMove,
                    EventType.PromoteVariation,
                ],
                handler: () => {
                    setForceRender((v) => v + 1);
                },
            };
            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender]);

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
                        <Tab
                            label='Openings'
                            value={InsightType.Opening}
                            iconPosition='start'
                            sx={{ minHeight: '48px' }}
                            data-cy='insight-tab-openings'
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
