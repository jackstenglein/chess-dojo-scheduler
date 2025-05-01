import {
    Checkbox,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormLabel,
    Radio,
    RadioGroup,
    Slider,
    Stack,
} from '@mui/material';
import { DateRangePicker, SingleInputDateRangeField } from '@mui/x-date-pickers-pro';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import {
    Color,
    GameFilters,
    MAX_DOWNLOAD_LIMIT,
    MAX_PLY_COUNT,
    MIN_DOWNLOAD_LIMIT,
    MIN_PLY_COUNT,
    PlayerSource,
} from './PlayerSource';

export interface EditableGameFilters {
    color: Color;
    setColor: (color: Color) => void;
    rated: boolean;
    setRated: (rated: boolean) => void;
    casual: boolean;
    setCasual: (casual: boolean) => void;
    bullet: boolean;
    setBullet: (bullet: boolean) => void;
    blitz: boolean;
    setBlitz: (blitz: boolean) => void;
    rapid: boolean;
    setRapid: (rapid: boolean) => void;
    classical: boolean;
    setClassical: (classical: boolean) => void;
    daily: boolean;
    setDaily: (daily: boolean) => void;
    opponentRating: [number, number];
    setOpponentRating: (opponentRating: [number, number]) => void;
    downloadLimit: number;
    setDownloadLimit: (downloadLimit: number) => void;
    dateRange: [DateTime | null, DateTime | null];
    setDateRange: (dateRange: [DateTime | null, DateTime | null]) => void;
    plyCount: [number, number];
    setPlyCount: (plyCount: [number, number]) => void;
}

export function useGameFilters(sources: PlayerSource[]): [EditableGameFilters, GameFilters] {
    const [color, setColor] = useState<Color>(Color.White);
    const [rated, setRated] = useState(true);
    const [casual, setCasual] = useState(true);
    const [bullet, setBullet] = useState(true);
    const [blitz, setBlitz] = useState(true);
    const [rapid, setRapid] = useState(true);
    const [classical, setClassical] = useState(true);
    const [daily, setDaily] = useState(true);
    const [opponentRating, setOpponentRating] = useState<[number, number]>([0, 3500]);
    const [downloadLimit, setDownloadLimit] = useState(MAX_DOWNLOAD_LIMIT);
    const [dateRange, setDateRange] = useState<[DateTime | null, DateTime | null]>([null, null]);
    const [plyCount, setPlyCount] = useState<[number, number]>([MIN_PLY_COUNT, MAX_PLY_COUNT]);

    const readonlyFilters: GameFilters = useMemo(() => {
        return {
            color,
            rated,
            casual,
            bullet,
            blitz,
            rapid,
            classical,
            daily,
            opponentRating,
            downloadLimit,
            dateRange: [
                dateRange[0]?.toISO()?.replaceAll('-', '.') ?? '',
                dateRange[1]?.toISO()?.replaceAll('-', '.') ?? '',
            ],
            plyCount,
            hiddenSources: sources
                .filter((s) => s.hidden)
                .map((s) => ({ ...s, username: s.username.trim().toLowerCase() })),
        };
    }, [
        color,
        rated,
        casual,
        bullet,
        blitz,
        rapid,
        classical,
        daily,
        opponentRating,
        downloadLimit,
        dateRange,
        plyCount,
        sources,
    ]);

    return [
        {
            color,
            setColor,
            rated,
            setRated,
            casual,
            setCasual,
            bullet,
            setBullet,
            blitz,
            setBlitz,
            rapid,
            setRapid,
            classical,
            setClassical,
            daily,
            setDaily,
            opponentRating,
            setOpponentRating,
            downloadLimit,
            setDownloadLimit,
            dateRange,
            setDateRange,
            plyCount,
            setPlyCount,
        },
        readonlyFilters,
    ];
}

export function Filters({ filters }: { filters: EditableGameFilters }) {
    return (
        <Stack spacing={2} mt={2}>
            <FormControl>
                <FormLabel>Color</FormLabel>
                <RadioGroup
                    row
                    value={filters.color}
                    onChange={(e) => filters.setColor(e.target.value as Color)}
                >
                    <FormControlLabel control={<Radio />} label='White' value={Color.White} />
                    <FormControlLabel control={<Radio />} label='Black' value={Color.Black} />
                    <FormControlLabel control={<Radio />} label='Both' value={Color.Both} />
                </RadioGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Mode</FormLabel>
                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.rated}
                                onChange={(e) => filters.setRated(e.target.checked)}
                            />
                        }
                        label='Rated'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.casual}
                                onChange={(e) => filters.setCasual(e.target.checked)}
                            />
                        }
                        label='Casual'
                    />
                </FormGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Time Control</FormLabel>
                <FormGroup row>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.bullet}
                                onChange={(e) => filters.setBullet(e.target.checked)}
                            />
                        }
                        label='Bullet'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.blitz}
                                onChange={(e) => filters.setBlitz(e.target.checked)}
                            />
                        }
                        label='Blitz'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.rapid}
                                onChange={(e) => filters.setRapid(e.target.checked)}
                            />
                        }
                        label='Rapid'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.classical}
                                onChange={(e) => filters.setClassical(e.target.checked)}
                            />
                        }
                        label='Classical'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={filters.daily}
                                onChange={(e) => filters.setDaily(e.target.checked)}
                            />
                        }
                        label='Daily'
                    />
                </FormGroup>
            </FormControl>

            <DateRangePicker
                value={filters.dateRange}
                onChange={(v) => filters.setDateRange(v)}
                localeText={{ start: 'Start', end: 'End' }}
                calendars={1}
                slots={{ field: SingleInputDateRangeField }}
                slotProps={{
                    textField: { size: 'small' },
                }}
                disableFuture
                label='Date Range'
                minDate={DateTime.fromISO('2007-01-01')}
            />

            <FormControl sx={{ pt: 1, px: 1 }}>
                <FormLabel>
                    Opponent Rating ({filters.opponentRating[0]} - {filters.opponentRating[1]})
                </FormLabel>
                <Slider
                    value={filters.opponentRating}
                    onChange={(_, v) => filters.setOpponentRating(v as [number, number])}
                    valueLabelDisplay='auto'
                    min={0}
                    max={3500}
                    step={100}
                    shiftStep={100}
                />
            </FormControl>

            <FormControl sx={{ pt: 1, px: 1 }}>
                <FormLabel>
                    Number of Moves (
                    {`${filters.plyCount[0] / 2}${filters.plyCount[1] === MAX_PLY_COUNT ? '+' : ` - ${filters.plyCount[1] / 2}`}`}
                    )
                </FormLabel>
                <Slider
                    value={filters.plyCount}
                    onChange={(_, v) => filters.setPlyCount(v as [number, number])}
                    valueLabelDisplay='auto'
                    valueLabelFormat={(value) => (value === MAX_PLY_COUNT ? 'All' : value / 2)}
                    min={MIN_PLY_COUNT}
                    max={MAX_PLY_COUNT}
                    step={2}
                    shiftStep={2}
                />
            </FormControl>

            <FormControl sx={{ px: 1 }}>
                <FormLabel>
                    {filters.downloadLimit === MAX_DOWNLOAD_LIMIT
                        ? 'All Games'
                        : `${filters.downloadLimit} Most Recent Games`}
                </FormLabel>
                <Slider
                    value={filters.downloadLimit}
                    onChange={(_, v) => filters.setDownloadLimit(v as number)}
                    min={MIN_DOWNLOAD_LIMIT}
                    max={MAX_DOWNLOAD_LIMIT}
                    step={100}
                    shiftStep={100}
                    valueLabelDisplay='auto'
                    valueLabelFormat={(value) => (value === MAX_DOWNLOAD_LIMIT ? 'All' : value)}
                />
            </FormControl>
        </Stack>
    );
}
