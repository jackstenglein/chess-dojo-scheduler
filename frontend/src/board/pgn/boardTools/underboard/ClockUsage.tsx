import { Chess, Event, EventType, Move, Pgn, TAGS } from '@jackstenglein/chess';
import { Box, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AxisOptions, Chart, Datum as ChartDatum } from 'react-charts';
import { useLightMode } from '../../../../ThemeProvider';
import { reconcile } from '../../../Board';
import { useChess } from '../../PgnBoard';
import ClockEditor from './ClockEditor';

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
        tooltip: (value) => `Move ${value}`,
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

export function getInitialClock(pgn?: Pgn): number {
    if (!pgn) {
        return 0;
    }

    const timeControl = pgn.header.tags[TAGS.TimeControl];
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

export function getIncrement(pgn?: Pgn): number {
    if (!pgn) {
        return 0;
    }

    const timeControl = pgn.header.tags[TAGS.TimeControl];
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

export function convertClockToSeconds(clk?: string): number | undefined {
    if (!clk) {
        return undefined;
    }

    const tokens = clk.split(':');
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if (tokens.length === 3) {
        hours = parseInt(tokens[0]);
        minutes = parseInt(tokens[1]);
        seconds = parseInt(tokens[2]);
    } else if (tokens.length === 2) {
        minutes = parseInt(tokens[0]);
        seconds = parseInt(tokens[1]);
    } else {
        return undefined;
    }

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        return undefined;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

function shouldRerender(chess: Chess, event: Event): boolean {
    if (event.type === EventType.UpdateCommand) {
        return event.commandName === 'clk';
    }
    if (event.type === EventType.UpdateHeader) {
        return event.headerName === TAGS.TimeControl;
    }
    if (event.type === EventType.LegalMove) {
        return chess.lastMove() === event.move;
    }
    if (event.type === EventType.DeleteMove) {
        return !event.mainlineMove;
    }
    if (event.type === EventType.PromoteVariation) {
        return chess.isInMainline(event.variantRoot);
    }
    return false;
}

function getSeriesStyle(series: any) {
    return {
        fill: series.label === 'White' ? 'rgb(250, 164, 58)' : 'rgb(15, 131, 171)',
        stroke: series.label === 'White' ? 'rgb(250, 164, 58)' : 'rgb(15, 131, 171)',
    };
}

function getDatumStyle(datum: any) {
    return {
        fill:
            datum.originalDatum.label === 'White'
                ? 'rgb(250, 164, 58)'
                : 'rgb(15, 131, 171)',
    };
}

interface ClockUsageProps {
    showEditor?: boolean;
}

const ClockUsage: React.FC<ClockUsageProps> = ({ showEditor }) => {
    const { chess, board } = useChess();
    const light = useLightMode();
    const [forceRender, setForceRender] = useState(0);

    const initialClock = getInitialClock(chess?.pgn);
    const increment = getIncrement(chess?.pgn);

    useEffect(() => {
        if (chess && showEditor) {
            const observer = {
                types: [
                    EventType.UpdateCommand,
                    EventType.UpdateHeader,
                    EventType.LegalMove,
                    EventType.DeleteMove,
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

        const whiteLineData: Datum[] = [
            {
                moveNumber: 0,
                seconds: initialClock,
                move: null,
            },
        ];
        const blackLineData: Datum[] = [
            {
                moveNumber: 0,
                seconds: initialClock,
                move: null,
            },
        ];

        const whiteBarData: Datum[] = [];
        const blackBarData: Datum[] = [];

        let whiteSecTotal = 0;
        let blackSecTotal = 0;

        const moves = chess.history();
        for (let i = 0; i < moves.length; i += 2) {
            const firstTime = convertClockToSeconds(moves[i]?.commentDiag?.clk);
            whiteLineData.push({
                moveNumber: i / 2 + 1,
                seconds:
                    firstTime !== undefined
                        ? firstTime
                        : whiteLineData[whiteLineData.length - 1].seconds,
                move: moves[i],
            });

            const secondTime = convertClockToSeconds(moves[i + 1]?.commentDiag?.clk);
            blackLineData.push({
                moveNumber: i / 2 + 1,
                seconds:
                    secondTime !== undefined
                        ? secondTime
                        : blackLineData[blackLineData.length - 1].seconds,
                move: moves[i + 1] ? moves[i + 1] : moves[i],
            });

            whiteBarData.push({
                moveNumber: i / 2 + 1,
                seconds:
                    whiteLineData[whiteLineData.length - 2].seconds -
                    whiteLineData[whiteLineData.length - 1].seconds +
                    increment,
                move: moves[i],
            });
            blackBarData.push({
                moveNumber: i / 2 + 1,
                seconds:
                    blackLineData[blackLineData.length - 2].seconds -
                    blackLineData[blackLineData.length - 1].seconds +
                    increment,
                move: moves[i + 1] ? moves[i + 1] : moves[i],
            });

            whiteSecTotal += whiteBarData[whiteBarData.length - 1].seconds;
            blackSecTotal += blackBarData[blackBarData.length - 1].seconds;
        }

        if (whiteBarData.length === 0) {
            whiteBarData.push({
                moveNumber: 0,
                seconds: 0,
                move: null,
            });
        }
        if (blackBarData.length === 0) {
            blackBarData.push({
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
                { label: 'White', data: whiteLineData },
                { label: 'Black', data: blackLineData },
            ],
            usedPerMove: [
                { label: 'White', data: whiteBarData.reverse() },
                { label: 'Black', data: blackBarData.reverse() },
            ],
        };
    }, [chess, increment, initialClock, forceRender]);

    if (!chess) {
        return null;
    }

    const onClickDatum = (datum: ChartDatum<Datum> | null) => {
        if (datum) {
            chess.seek(datum.originalDatum.move);
            reconcile(chess, board);
        }
    };

    return (
        <CardContent sx={{ height: 1 }}>
            <Stack height={1} spacing={4}>
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
                                getDatumStyle,
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
                                getSeriesStyle,
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
                                getSeriesStyle,
                            }}
                        />
                    </Box>
                </Stack>

                {showEditor && <ClockEditor />}
            </Stack>
        </CardContent>
    );
};

export default ClockUsage;
