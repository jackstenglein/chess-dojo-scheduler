import React, { useCallback, useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { LoadingButton } from '@mui/lab';
import {
    Stack,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    TextField,
    Accordion as MuiAccordion,
    AccordionProps,
    AccordionSummary as MuiAccordionSummary,
    AccordionSummaryProps,
    AccordionDetails as MuiAccordionDetails,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';

import { dojoCohorts } from '../../database/user';
import { useAuth } from '../../auth/Auth';
import { useApi } from '../../api/Api';
import { SearchFunc } from './pagination';
import { URLSearchParamsInit, useSearchParams } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: 0,
    },
    '&:before': {
        display: 'none',
    },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
        {...props}
    />
))(({ theme }) => ({
    backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1),
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

interface BaseFilterProps {
    startDate: Date | null;
    endDate: Date | null;
    isLoading: boolean;
    setStartDate: React.Dispatch<React.SetStateAction<Date | null>>;
    setEndDate: React.Dispatch<React.SetStateAction<Date | null>>;
    onSearch: () => void;
}

type SearchByCohortProps = BaseFilterProps & {
    cohort: string;
    setCohort: (cohort: string) => void;
};

export const SearchByCohort: React.FC<SearchByCohortProps> = ({
    cohort,
    startDate,
    endDate,
    isLoading,
    setCohort,
    setStartDate,
    setEndDate,
    onSearch,
}) => {
    return (
        <Stack spacing={2}>
            <FormControl>
                <InputLabel>Cohort</InputLabel>
                <Select
                    value={cohort}
                    label='Cohort'
                    onChange={(e) => setCohort(e.target.value)}
                >
                    {dojoCohorts.map((c) => (
                        <MenuItem key={c} value={c}>
                            {c}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container rowGap={1} columnGap={{ md: 0, lg: 1 }}>
                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='Start Date'
                            value={startDate}
                            onChange={(newValue) => {
                                setStartDate(newValue);
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton variant='outlined' loading={isLoading} onClick={onSearch}>
                Search
            </LoadingButton>
        </Stack>
    );
};

const SearchByOwner: React.FC<BaseFilterProps> = ({
    startDate,
    endDate,
    isLoading,
    setStartDate,
    setEndDate,
    onSearch,
}) => {
    return (
        <Stack spacing={2}>
            <Typography gutterBottom>
                Find games that you have uploaded through Chess Dojo Scheduler. Note that
                games uploaded previously through the Google Form submission will not be
                matched.
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container rowGap={1} columnGap={{ md: 0, lg: 1 }}>
                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='Start Date'
                            value={startDate}
                            onChange={(newValue) => {
                                setStartDate(newValue);
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton variant='outlined' loading={isLoading} onClick={onSearch}>
                Search
            </LoadingButton>
        </Stack>
    );
};

type SearchByPlayerProps = BaseFilterProps & {
    player: string;
    color: string;
    setPlayer: React.Dispatch<React.SetStateAction<string>>;
    setColor: React.Dispatch<React.SetStateAction<string>>;
};

const SearchByPlayer: React.FC<SearchByPlayerProps> = ({
    player,
    color,
    startDate,
    endDate,
    isLoading,
    setPlayer,
    setColor,
    setStartDate,
    setEndDate,
    onSearch,
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSearch = () => {
        const errors: Record<string, string> = {};
        if (player === '') {
            errors.player = 'This field is required';
        }
        setErrors(errors);

        if (Object.entries(errors).length > 0) {
            return;
        }

        onSearch();
    };

    return (
        <Stack spacing={2}>
            <Typography gutterBottom>
                Find games based on player name. Note this is the name as it was recorded
                in the PGN file.
            </Typography>
            <TextField
                label='Player Name'
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                error={!!errors.player}
                helperText={errors.player}
            />

            <Select
                value={color}
                label='Color'
                onChange={(e) => setColor(e.target.value)}
            >
                <MenuItem value='either'>Either</MenuItem>
                <MenuItem value='white'>White</MenuItem>
                <MenuItem value='black'>Black</MenuItem>
            </Select>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Grid container rowGap={1} columnGap={{ md: 0, lg: 1 }}>
                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='Start Date'
                            value={startDate}
                            onChange={(newValue) => {
                                setStartDate(newValue);
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{ textField: { fullWidth: true } }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton variant='outlined' loading={isLoading} onClick={handleSearch}>
                Search
            </LoadingButton>
        </Stack>
    );
};

enum SearchType {
    Cohort = 'cohort',
    Player = 'player',
    Owner = 'owner',
}

function isValid(d: Date | null): boolean {
    return d instanceof Date && !isNaN(d.getTime());
}

interface SearchFiltersProps {
    isLoading: boolean;
    onSearch: (searchFunc: SearchFunc) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ isLoading, onSearch }) => {
    const user = useAuth().user!;
    const api = useApi();

    const [searchParams, setSearchParams] = useSearchParams({
        cohort: user.dojoCohort,
        player: '',
        color: 'either',
        type: SearchType.Cohort,
    });

    const [expanded, setExpanded] = useState<string | false>(searchParams.get('type')!);
    const onChangePanel =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
        };

    // State variables for editing the form before clicking search
    const [editCohort, setCohort] = useState(
        (searchParams.get('cohort') || '').replaceAll('%2B', '+')
    );
    const [editPlayer, setPlayer] = useState(searchParams.get('player') || '');
    const [editColor, setColor] = useState(searchParams.get('color') || '');

    const paramsStartDate = searchParams.get('startDate');
    const paramsEndDate = searchParams.get('endDate');

    const [editStartDate, setStartDate] = useState<Date | null>(
        paramsStartDate ? new Date(paramsStartDate) : null
    );
    const [editEndDate, setEndDate] = useState<Date | null>(
        paramsEndDate ? new Date(paramsEndDate) : null
    );

    // Submitted variables that should be searched on
    const type = searchParams.get('type');
    const cohort = searchParams.get('cohort');
    const player = searchParams.get('player');
    const color = searchParams.get('color');
    let startDateStr: string | undefined = undefined;
    let endDateStr: string | undefined = undefined;
    if (isValid(new Date(paramsStartDate || ''))) {
        startDateStr = new Date(paramsStartDate || '')
            ?.toISOString()
            .substring(0, 10)
            .replaceAll('-', '.');
    }
    if (isValid(new Date(paramsEndDate || ''))) {
        endDateStr = new Date(paramsEndDate || '')
            .toISOString()
            .substring(0, 10)
            .replaceAll('-', '.');
    }

    // Functions that actually perform the search
    const searchByCohort = useCallback(
        (startKey: string) =>
            api.listGamesByCohort(cohort!, startKey, startDateStr, endDateStr),
        [cohort, api, startDateStr, endDateStr]
    );

    const searchByPlayer = useCallback(
        (startKey: string) =>
            api.listGamesByOwner(
                undefined,
                startKey,
                startDateStr,
                endDateStr,
                player!,
                color!
            ),
        [api, startDateStr, endDateStr, player, color]
    );

    const searchByOwner = useCallback(
        (startKey: string) =>
            api.listGamesByOwner(user.username, startKey, startDateStr, endDateStr),
        [api, user.username, startDateStr, endDateStr]
    );

    // Search is called every time the above functions change, which should
    // happen only when the searchParams change
    useEffect(() => {
        switch (type) {
            case SearchType.Owner:
                onSearch(searchByOwner);
                break;

            case SearchType.Player:
                onSearch(searchByPlayer);
                break;

            case SearchType.Cohort:
            default:
                onSearch(searchByCohort);
                break;
        }
    }, [type, onSearch, searchByOwner, searchByPlayer, searchByCohort]);

    // Functions that change the search params
    const onSetSearchParams = (params: URLSearchParamsInit) => {
        trackEvent(EventType.SearchGames, params);
        setSearchParams(params);
    };

    const onSearchByCohort = () => {
        onSetSearchParams({
            type: SearchType.Cohort,
            cohort: editCohort,
            startDate: isValid(editStartDate) ? editStartDate!.toISOString() : '',
            endDate: isValid(editEndDate) ? editEndDate!.toISOString() : '',
        });
    };

    const onSearchByPlayer = () => {
        onSetSearchParams({
            type: SearchType.Player,
            player: editPlayer,
            color: editColor,
            startDate: isValid(editStartDate) ? editStartDate!.toISOString() : '',
            endDate: isValid(editEndDate) ? editEndDate!.toISOString() : '',
        });
    };

    const onSearchByOwner = () => {
        onSetSearchParams({
            type: SearchType.Owner,
            startDate: isValid(editStartDate) ? editStartDate!.toISOString() : '',
            endDate: isValid(editEndDate) ? editEndDate!.toISOString() : '',
        });
    };

    return (
        <Stack spacing={0}>
            <Accordion
                expanded={expanded === SearchType.Cohort}
                onChange={onChangePanel(SearchType.Cohort)}
            >
                <AccordionSummary>
                    <Typography>Search By Cohort</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByCohort
                        cohort={editCohort}
                        setCohort={setCohort}
                        startDate={editStartDate}
                        setStartDate={setStartDate}
                        endDate={editEndDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByCohort}
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion
                expanded={expanded === SearchType.Player}
                onChange={onChangePanel(SearchType.Player)}
            >
                <AccordionSummary>
                    <Typography>Search By Player</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByPlayer
                        player={editPlayer}
                        setPlayer={setPlayer}
                        color={editColor}
                        setColor={setColor}
                        startDate={editStartDate}
                        setStartDate={setStartDate}
                        endDate={editEndDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByPlayer}
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion
                expanded={expanded === SearchType.Owner}
                onChange={onChangePanel(SearchType.Owner)}
            >
                <AccordionSummary>
                    <Typography>Search My Uploads</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByOwner
                        startDate={editStartDate}
                        setStartDate={setStartDate}
                        endDate={editEndDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByOwner}
                    />
                </AccordionDetails>
            </Accordion>
        </Stack>
    );
};

export default SearchFilters;
