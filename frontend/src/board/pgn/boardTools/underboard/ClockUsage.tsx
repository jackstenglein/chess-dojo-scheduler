import { Box, CardContent, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { EventType, Pgn, TAGS, Event, Chess } from '@jackstenglein/chess';
import { AxisOptions, Chart } from 'react-charts';

import { useChess } from '../../PgnBoard';
import { useLightMode } from '../../../../ThemeProvider';
import ClockEditor from './ClockEditor';

interface Datum {
    move: number;
    seconds: number;
}

const primaryAxis: AxisOptions<Datum> = {
    getValue: (datum) => datum.move,
    scaleType: 'linear',
    formatters: {
        scale: (value) => (value % 1 === 0 ? `${value}` : ''),
        tooltip: (value) => (value % 1 === 0 ? `Move ${value}` : ''),
    },
};

const secondaryAxes: Array<AxisOptions<Datum>> = [
    {
        getValue: (datum) => datum.seconds,
        min: 0,
        formatters: {
            scale: formatTime,
        },
    },
];

const barAxis: AxisOptions<Datum> = {
    getValue: (datum) => datum.move,
    scaleType: 'band',
    position: 'left',
    formatters: {
        tooltip: (value) => `Move ${value}`,
    },
};

const secondaryBarAxis: Array<AxisOptions<Datum>> = [
    {
        ...secondaryAxes[0],
        position: 'bottom',
    },
];

export function formatTime(value: number): string {
    let result = '';
    const hours = Math.floor(value / 3600);
    if (hours > 0) {
        result = `${hours}:`;
    }

    const minutes = Math.floor((value % 3600) / 60);
    result += `${minutes.toLocaleString(undefined, { minimumIntegerDigits: 2 })}:`;

    const seconds = (value % 3600) % 60;
    result += `${seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
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
    const increment = parseInt(time?.split('+').slice(-1)[0]);
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

interface ClockUsageProps {
    showEditor?: boolean;
}

const ClockUsage: React.FC<ClockUsageProps> = ({ showEditor }) => {
    const { chess } = useChess();
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
            return [];
        }

        const whiteLineData: Datum[] = [
            {
                move: 0,
                seconds: initialClock,
            },
        ];
        const blackLineData: Datum[] = [
            {
                move: 0,
                seconds: initialClock,
            },
        ];

        const whiteBarData: Datum[] = [];
        const blackBarData: Datum[] = [];

        const moves = chess.history();
        for (let i = 0; i < moves.length; i += 2) {
            const firstTime = convertClockToSeconds(moves[i]?.commentDiag?.clk);
            whiteLineData.push({
                move: i / 2 + 1,
                seconds:
                    firstTime !== undefined
                        ? firstTime
                        : whiteLineData[whiteLineData.length - 1].seconds,
            });

            const secondTime = convertClockToSeconds(moves[i + 1]?.commentDiag?.clk);
            blackLineData.push({
                move: i / 2 + 1,
                seconds:
                    secondTime !== undefined
                        ? secondTime
                        : blackLineData[blackLineData.length - 1].seconds,
            });

            whiteBarData.push({
                move: i / 2 + 1,
                seconds:
                    whiteLineData[whiteLineData.length - 2].seconds -
                    whiteLineData[whiteLineData.length - 1].seconds +
                    increment,
            });
            blackBarData.push({
                move: i / 2 + 1,
                seconds:
                    blackLineData[blackLineData.length - 2].seconds -
                    blackLineData[blackLineData.length - 1].seconds +
                    increment,
            });
        }

        return [
            [
                { label: 'White', data: whiteLineData },
                { label: 'Black', data: blackLineData },
            ],
            [
                { label: 'White', data: whiteBarData.reverse() },
                { label: 'Black', data: blackBarData.reverse() },
            ],
        ];
    }, [chess, increment, initialClock, forceRender]);

    if (!chess) {
        return null;
    }

    return (
        <CardContent sx={{ height: 1 }}>
            <Stack height={1} spacing={4}>
                <Stack spacing={0.5} alignItems='center'>
                    <Typography variant='caption' color='text.secondary'>
                        Remaining Clock Time by Move
                    </Typography>
                    <Box width={1} height={300}>
                        <Chart
                            options={{
                                data: data[0],
                                primaryAxis,
                                secondaryAxes,
                                dark: !light,
                            }}
                        />
                    </Box>
                </Stack>

                <Stack spacing={0.5} alignItems='center'>
                    <Typography variant='caption' color='text.secondary'>
                        Time Used Per Move
                    </Typography>
                    <Box width={1} height={15 * Math.ceil(chess.plyCount() / 2) + 10}>
                        <Chart
                            options={{
                                data: data[1],
                                primaryAxis: barAxis,
                                secondaryAxes: secondaryBarAxis,
                                dark: !light,
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
