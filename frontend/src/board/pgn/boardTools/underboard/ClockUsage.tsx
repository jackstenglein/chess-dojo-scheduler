import { Box, CardContent, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import { Pgn, TAGS } from '@jackstenglein/chess';
import { AxisOptions, Chart } from 'react-charts';

import { useChess } from '../../PgnBoard';
import { useLightMode } from '../../../../ThemeProvider';

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

function formatTime(value: number): string {
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

function getInitialClock(pgn?: Pgn): number {
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

function getIncrement(pgn?: Pgn): number {
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

function convertClockToSeconds(clk?: string): number {
    if (!clk) {
        return 0;
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
        return 0;
    }

    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
        return 0;
    }

    return hours * 3600 + minutes * 60 + seconds;
}

const ClockUsage = () => {
    const { chess } = useChess();
    const light = useLightMode();

    const data = useMemo(() => {
        if (!chess) {
            return [];
        }

        const initialClock = getInitialClock(chess.pgn);
        const increment = getIncrement(chess.pgn);

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
                    firstTime >= 0
                        ? firstTime
                        : whiteLineData[whiteLineData.length - 1].seconds,
            });

            const secondTime = convertClockToSeconds(moves[i + 1]?.commentDiag?.clk);
            blackLineData.push({
                move: i / 2 + 1,
                seconds:
                    secondTime >= 0
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
    }, [chess]);

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

                <Stack flexGrow={1} justifyContent='end'>
                    <Typography
                        variant='caption'
                        color='text.secondary'
                        textAlign='center'
                    >
                        Graphs are generated using the %clk annotation in the PGN, which
                        can be set in the PGN editor. %emt format is currently not
                        supported but will be added soon. Initial time is taken from the
                        TimeControl header, which can be set in the tags.
                    </Typography>
                </Stack>
            </Stack>
        </CardContent>
    );
};

export default ClockUsage;
