import { useReconcile } from '@/board/Board';
import { useChess } from '@/board/pgn/PgnBoard';
import { useLightMode } from '@/style/useLightMode';
import { Chess, Event, EventType, Move } from '@jackstenglein/chess';
import { clockToSeconds } from '@jackstenglein/chess-dojo-common/src/pgn/clock';
import { Edit } from '@mui/icons-material';
import { Box, CardContent, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { pink } from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';
import { AxisOptions, Chart, Datum as ChartDatum, Series } from 'react-charts';
import { TimeControlEditor } from '../tags/TimeControlEditor';
import ClockEditor from './ClockEditor';
import { TimeControlDescription } from './TimeControlDescription';

interface Datum {
    label?: string;
    moveNumber: number;
    seconds: number;
    move: Move | null;
}

const primaryAxis: AxisOptions<Datum> = {
    getValue: (datum) => datum.moveNumber,
    scaleType: 'linear',
    formatters: {
        scale: (value) => (value % 1 === 0 ? `${value}` : ''),
        tooltip: (value) => (value % 1 === 0 ? `Move ${value}` : ''),
    },
};

const secondaryAxes: AxisOptions<Datum>[] = [
    {
        getValue: (datum) => datum.seconds,
        min: 0,
        formatters: {
            scale: formatTime,
        },
    },
];

const barAxis: AxisOptions<Datum> = {
    getValue: (datum) => datum.moveNumber,
    scaleType: 'band',
    position: 'left',
    formatters: {
        tooltip: (value) => `Move ${value?.toString()}`,
    },
};

const secondaryBarAxis: AxisOptions<Datum>[] = [
    {
        ...secondaryAxes[0],
        position: 'bottom',
    },
];

const totalTimePrimaryAxis: AxisOptions<Datum> = {
    getValue: (datum) => datum.label,
    position: 'left',
};

export function formatTime(value: number): string {
    let result = '';
    if (value < 0) {
        result = '-';
        value = Math.abs(value);
    }

    const hours = Math.floor(value / 3600);
    if (hours > 0) {
        result = `${hours}:`;
    }

    const minutes = Math.floor((value % 3600) / 60);
    result += `${minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:`;

    const seconds = (value % 3600) % 60;
    result += seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 });
    return result;
}

export function getInitialClock(timeControl?: string): number {
    if (!timeControl) {
        return 0;
    }

    const descriptor = timeControl.split(':')[0];
    const time = descriptor.split('/').slice(-1)[0];
    const startTime = parseInt(time?.split('+')[0]);
    if (isNaN(startTime) || startTime <= 0) {
        return 0;
    }

    return startTime;
}

export function getIncrement(timeControl?: string): number {
    if (!timeControl) {
        return 0;
    }

    const descriptor = timeControl.split(':')[0];
    const time = descriptor.split('/').slice(-1)[0];
    if (!time) {
        return 0;
    }

    const tokens = time.split('+');
    if (tokens.length < 2) {
        return 0;
    }
    const increment = parseInt(tokens[1]);
    if (!increment || isNaN(increment) || increment <= 0) {
        return 0;
    }
    return increment;
}

function shouldRerender(chess: Chess, event: Event): boolean {
    if (event.type === EventType.UpdateCommand) {
        return event.commandName === 'clk';
    }
    if (event.type === EventType.UpdateHeader) {
        return event.headerName === 'TimeControl';
    }
    if (event.type === EventType.LegalMove) {
        return chess.lastMove() === event.move;
    }
    if (event.type === EventType.DeleteMove) {
        return !event.mainlineMove;
    }
    if (event.type === EventType.DeleteBeforeMove) {
        return true;
    }
    if (event.type === EventType.PromoteVariation) {
        return chess.isInMainline(event.variantRoot);
    }
    return false;
}

function getSeriesStyle(series: Series<Datum>, light: boolean) {
    if (series.label === 'White') {
        if (light) {
            return { fill: pink[200], stroke: pink[200] };
        }
        return { fill: 'white', stroke: 'white' };
    }

    if (light) {
        return { fill: '#212121', stroke: '#212121' };
    }
    return { fill: 'rgb(15, 131, 171)', stroke: 'rgb(15, 131, 171)' };
}

function getDatumStyle(datum: ChartDatum<Datum>, light: boolean) {
    if (datum.originalDatum.label === 'White') {
        if (light) {
            return { fill: pink[200] };
        }
        return { fill: 'white' };
    }

    if (light) {
        return { fill: '#212121' };
    }
    return { fill: 'rgb(15, 131, 171)' };
}

interface ClockUsageProps {
    showEditor?: boolean;
}

const ClockUsage: React.FC<ClockUsageProps> = ({ showEditor }) => {
    const { chess } = useChess();
    const light = useLightMode();
    const [forceRender, setForceRender] = useState(0);
    const reconcile = useReconcile();
    const [showTimeControlEditor, setShowTimeControlEditor] = useState(false);

    const timeControls = chess?.header().tags.TimeControl?.items;

    useEffect(() => {
        if (chess && showEditor) {
            const observer = {
                types: [
                    EventType.UpdateCommand,
                    EventType.UpdateHeader,
                    EventType.LegalMove,
                    EventType.DeleteMove,
                    EventType.DeleteBeforeMove,
                    EventType.PromoteVariation,
                ],
                handler: (event: Event) => {
                    if (shouldRerender(chess, event)) {
                        setForceRender((v) => v + 1);
                    }
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess, setForceRender, showEditor]);

    const data = useMemo(() => {
        if (!chess || forceRender < 0) {
            return {
                total: [],
                remainingPerMove: [],
                usedPerMove: [],
            };
        }

        let timeControl = timeControls?.[0] ?? {};
        let timeControlIdx = 0;
        let pliesSinceTimeControl = 0;

        const whiteClockDisplay: Datum[] = [
            {
                moveNumber: 0,
                seconds: timeControl.seconds || 0,
                move: null,
            },
        ];
        const blackClockDisplay: Datum[] = [
            {
                moveNumber: 0,
                seconds: timeControl.seconds || 0,
                move: null,
            },
        ];

        const whiteTimePerMove: Datum[] = [];
        const blackTimePerMove: Datum[] = [];

        let whiteSecTotal = 0;
        let blackSecTotal = 0;

        const moves = chess.history();
        for (let i = 0; i < moves.length; i += 2) {
            const bonus = Math.max(0, timeControl.increment || timeControl.delay || 0);
            let additionalTime = 0;

            if (
                timeControl.moves &&
                pliesSinceTimeControl / 2 === timeControl.moves - 1
            ) {
                if (timeControlIdx + 1 < (timeControls?.length ?? 0)) {
                    timeControlIdx++;
                }
                timeControl = timeControls?.[timeControlIdx] || {};
                additionalTime = Math.max(0, timeControl.seconds || 0);
                pliesSinceTimeControl = 0;
            } else {
                pliesSinceTimeControl += 2;
            }

            const firstTime = clockToSeconds(moves[i]?.commentDiag?.clk);
            whiteClockDisplay.push({
                moveNumber: i / 2 + 1,
                seconds:
                    firstTime !== undefined
                        ? firstTime
                        : whiteClockDisplay[whiteClockDisplay.length - 1].seconds,
                move: moves[i],
            });

            const secondTime = clockToSeconds(moves[i + 1]?.commentDiag?.clk);
            blackClockDisplay.push({
                moveNumber: i / 2 + 1,
                seconds:
                    secondTime !== undefined
                        ? secondTime
                        : blackClockDisplay[blackClockDisplay.length - 1].seconds,
                move: moves[i + 1] ? moves[i + 1] : moves[i],
            });

            whiteTimePerMove.push({
                moveNumber: i / 2 + 1,
                seconds:
                    whiteClockDisplay[whiteClockDisplay.length - 2].seconds -
                    whiteClockDisplay[whiteClockDisplay.length - 1].seconds +
                    additionalTime +
                    bonus,
                move: moves[i],
            });
            blackTimePerMove.push({
                moveNumber: i / 2 + 1,
                seconds: !moves[i + 1]
                    ? 0
                    : blackClockDisplay[blackClockDisplay.length - 2].seconds -
                      blackClockDisplay[blackClockDisplay.length - 1].seconds +
                      additionalTime +
                      bonus,
                move: moves[i + 1] ? moves[i + 1] : moves[i],
            });

            whiteSecTotal += whiteTimePerMove[whiteTimePerMove.length - 1].seconds;
            blackSecTotal += blackTimePerMove[blackTimePerMove.length - 1].seconds;
        }

        if (whiteTimePerMove.length === 0) {
            whiteTimePerMove.push({
                moveNumber: 0,
                seconds: 0,
                move: null,
            });
        }
        if (blackTimePerMove.length === 0) {
            blackTimePerMove.push({
                moveNumber: 0,
                seconds: 0,
                move: null,
            });
        }

        return {
            total: [
                {
                    label: 'Total Time',
                    data: [
                        {
                            label: 'Black',
                            seconds: blackSecTotal,
                            move: null,
                            moveNumber: 0,
                        },
                        {
                            label: 'White',
                            seconds: whiteSecTotal,
                            move: null,
                            moveNumber: 0,
                        },
                    ],
                },
            ],
            remainingPerMove: [
                { label: 'White', data: whiteClockDisplay },
                { label: 'Black', data: blackClockDisplay },
            ],
            usedPerMove: [
                { label: 'White', data: whiteTimePerMove.reverse() },
                { label: 'Black', data: blackTimePerMove.reverse() },
            ],
        };
    }, [chess, timeControls, forceRender]);

    if (!chess) {
        return null;
    }

    const onClickDatum = (datum: ChartDatum<Datum> | null) => {
        if (datum) {
            chess.seek(datum.originalDatum.move);
            reconcile();
        }
    };

    const onUpdateTimeControl = (value: string) => {
        chess.setHeader('TimeControl', value);
        setShowTimeControlEditor(false);
    };

    return (
        <CardContent sx={{ height: 1 }}>
            <Stack height={1} spacing={4}>
                <Stack>
                    <Stack direction='row' alignItems='center' spacing={0.5}>
                        <Typography variant='subtitle1'>Time Control</Typography>

                        {showEditor && (
                            <Tooltip title='Edit time control'>
                                <IconButton
                                    size='small'
                                    sx={{ position: 'relative', top: '-2px' }}
                                    onClick={() => setShowTimeControlEditor(true)}
                                >
                                    <Edit fontSize='inherit' />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                    <TimeControlDescription timeControls={timeControls || []} />
                </Stack>

                <Stack spacing={0.5} alignItems='center'>
                    <Typography variant='caption' color='text.secondary'>
                        Total Time Used
                    </Typography>
                    <Box width={1} height={120}>
                        <Chart
                            options={{
                                data: data.total,
                                primaryAxis: totalTimePrimaryAxis,
                                secondaryAxes: secondaryBarAxis,
                                dark: !light,
                                getDatumStyle: (datum) => getDatumStyle(datum, light),
                            }}
                        />
                    </Box>
                </Stack>

                <Stack spacing={0.5} alignItems='center'>
                    <Typography variant='caption' color='text.secondary'>
                        Remaining Clock Time by Move
                    </Typography>
                    <Box width={1} height={300}>
                        <Chart
                            options={{
                                data: data.remainingPerMove,
                                primaryAxis,
                                secondaryAxes,
                                dark: !light,
                                onClickDatum,
                                getSeriesStyle: (series) => getSeriesStyle(series, light),
                            }}
                        />
                    </Box>
                </Stack>

                <Stack spacing={0.5} alignItems='center'>
                    <Typography variant='caption' color='text.secondary'>
                        Time Used Per Move
                    </Typography>
                    <Box
                        width={1}
                        height={20 * Math.ceil(chess.plyCount() / 2) + 10}
                        minHeight={70}
                    >
                        <Chart
                            options={{
                                data: data.usedPerMove,
                                primaryAxis: barAxis,
                                secondaryAxes: secondaryBarAxis,
                                dark: !light,
                                onClickDatum,
                                getSeriesStyle: (series) => getSeriesStyle(series, light),
                            }}
                        />
                    </Box>
                </Stack>

                {showEditor && (
                    <ClockEditor setShowTimeControlEditor={setShowTimeControlEditor} />
                )}

                {showTimeControlEditor && (
                    <TimeControlEditor
                        open={showTimeControlEditor}
                        initialItems={chess.header().tags.TimeControl?.items}
                        onCancel={() => setShowTimeControlEditor(false)}
                        onSuccess={onUpdateTimeControl}
                    />
                )}
            </Stack>
        </CardContent>
    );
};

export default ClockUsage;
