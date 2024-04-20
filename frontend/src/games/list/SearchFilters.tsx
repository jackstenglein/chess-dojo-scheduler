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
    Link,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import {
    URLSearchParamsInit,
    useSearchParams,
    Link as RouterLink,
} from 'react-router-dom';

import { dojoCohorts } from '../../database/user';
import { useAuth, useFreeTier } from '../../auth/Auth';
import { useApi } from '../../api/Api';
import { SearchFunc } from './pagination';
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
        <Stack data-cy='search-by-cohort' spacing={2}>
            <FormControl>
                <InputLabel>Cohort</InputLabel>
                <Select
                    data-cy='cohort-select'
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
                            slotProps={{
                                textField: { id: 'cohort-start-date', fullWidth: true },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{
                                textField: { id: 'cohort-end-date', fullWidth: true },
                            }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton
                data-cy='cohort-search-button'
                variant='outlined'
                loading={isLoading}
                onClick={onSearch}
            >
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
        <Stack data-cy='search-by-owner' spacing={2}>
            <Typography data-cy='owner-search-description' gutterBottom>
                Find games that you have uploaded to the Dojo Database. Note that games
                uploaded previously through Dojo 1.0's Google Form submission will not be
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
                            slotProps={{
                                textField: { id: 'owner-start-date', fullWidth: true },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{
                                textField: { id: 'owner-end-date', fullWidth: true },
                            }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton
                data-cy='owner-search-button'
                variant='outlined'
                loading={isLoading}
                onClick={onSearch}
            >
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
    const isFreeTier = useFreeTier();
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
        <Stack data-cy='search-by-player' spacing={2}>
            <Typography gutterBottom>
                Find games based on player name. Note this is the name as it was recorded
                in the PGN file.
            </Typography>
            <TextField
                data-cy='player-name'
                label='Player Name'
                value={player}
                onChange={(e) => setPlayer(e.target.value)}
                error={!!errors.player}
                helperText={errors.player}
            />

            <Select
                data-cy='color'
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
                            slotProps={{
                                textField: { id: 'player-start-date', fullWidth: true },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{
                                textField: { id: 'player-end-date', fullWidth: true },
                            }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton
                data-cy='player-search-button'
                variant='outlined'
                loading={isLoading}
                onClick={handleSearch}
                disabled={isFreeTier}
            >
                Search
            </LoadingButton>
            {isFreeTier && (
                <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: '0 !important', alignSelf: 'center' }}
                >
                    Free-tier users are not able to search by player name
                </Typography>
            )}
        </Stack>
    );
};

type SearchByOpeningProps = BaseFilterProps & {
    eco: string;
    setEco: React.Dispatch<React.SetStateAction<string>>;
};

const SearchByOpening: React.FC<SearchByOpeningProps> = ({
    eco,
    startDate,
    endDate,
    isLoading,
    setEco,
    setStartDate,
    setEndDate,
    onSearch,
}) => {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSearch = () => {
        const errors: Record<string, string> = {};
        if (eco === '') {
            errors.eco = 'This field is required';
        }
        setErrors(errors);

        if (Object.entries(errors).length > 0) {
            return;
        }

        onSearch();
    };

    return (
        <Stack data-cy='search-by-opening' spacing={2}>
            <FormControl>
                <TextField
                    data-cy='opening-eco'
                    value={eco}
                    label='Opening ECO'
                    onChange={(e) => setEco(e.target.value)}
                    error={!!errors.eco}
                    helperText={errors.eco}
                />
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
                            slotProps={{
                                textField: { id: 'opening-start-date', fullWidth: true },
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            slotProps={{
                                textField: { id: 'opening-end-date', fullWidth: true },
                            }}
                        />
                    </Grid>
                </Grid>
            </LocalizationProvider>

            <LoadingButton
                data-cy='opening-search-button'
                variant='outlined'
                loading={isLoading}
                onClick={handleSearch}
            >
                Search
            </LoadingButton>
        </Stack>
    );
};

type SearchByPositionProps = BaseFilterProps & {
    fen: string;
    setFen: React.Dispatch<React.SetStateAction<string>>;
};

const SearchByPosition: React.FC<SearchByPositionProps> = ({
    fen,
    isLoading,
    setFen,
    onSearch,
}) => {
    const isFreeTier = useFreeTier();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSearch = () => {
        const errors: Record<string, string> = {};
        if (fen === '') {
            errors.fen = 'This field is required';
        }
        setErrors(errors);

        if (Object.entries(errors).length > 0) {
            return;
        }

        onSearch();
    };

    return (
        <Stack data-cy='search-by-position' spacing={2}>
            <FormControl>
                <TextField
                    data-cy='fen'
                    value={fen}
                    label='FEN'
                    onChange={(e) => setFen(e.target.value)}
                    error={!!errors.fen}
                    helperText={errors.fen}
                />
            </FormControl>

            <LoadingButton
                data-cy='fen-search-button'
                variant='outlined'
                loading={isLoading}
                onClick={handleSearch}
                disabled={isFreeTier}
            >
                Search
            </LoadingButton>

            {isFreeTier ? (
                <Typography
                    variant='caption'
                    color='text.secondary'
                    sx={{ mt: '0 !important', alignSelf: 'center' }}
                >
                    Free-tier users are not able to search by position
                </Typography>
            ) : (
                <Link
                    component={RouterLink}
                    to={`/games/explorer?fen=${fen}`}
                    sx={{ alignSelf: 'center' }}
                >
                    View in Explorer
                </Link>
            )}
        </Stack>
    );
};

enum SearchType {
    Cohort = 'cohort',
    Player = 'player',
    Owner = 'owner',
    Opening = 'opening',
    Position = 'position',
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
        eco: '',
        fen: '',
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
    const [editEco, setEditEco] = useState(searchParams.get('eco') || '');
    const [editFen, setEditFen] = useState(searchParams.get('fen') || '');

    const paramsStartDate = searchParams.get('startDate');
    const paramsEndDate = searchParams.get('endDate');

    const [editStartDate, setStartDate] = useState<Date | null>(
        paramsStartDate ? new Date(paramsStartDate) : null
    );
    const [editEndDate, setEndDate] = useState<Date | null>(
        paramsEndDate ? new Date(paramsEndDate) : null
    );

    // Submitted variables that should be searched on
    const type = searchParams.get('type') || SearchType.Cohort;
    const cohort = searchParams.get('cohort') || user.dojoCohort;
    const player = searchParams.get('player') || '';
    const color = searchParams.get('color') || 'either';
    const eco = searchParams.get('eco') || '';
    const fen = searchParams.get('fen') || '';
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

    const searchByOpening = useCallback(
        (startKey: string) =>
            api.listGamesByOpening(eco, startKey, startDateStr, endDateStr),
        [api, eco, startDateStr, endDateStr]
    );

    const searchByPosition = useCallback(
        (startKey: string) => api.listGamesByPosition(fen, startKey),
        [api, fen]
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
                onSearch(searchByCohort);
                break;

            case SearchType.Opening:
                onSearch(searchByOpening);
                break;

            case SearchType.Position:
                onSearch(searchByPosition);
                break;
        }
    }, [
        type,
        onSearch,
        searchByOwner,
        searchByPlayer,
        searchByCohort,
        searchByOpening,
        searchByPosition,
    ]);

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

    const onSearchByOpening = () => {
        onSetSearchParams({
            type: SearchType.Opening,
            eco: editEco,
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

    const onSearchByPosition = () => {
        onSetSearchParams({
            type: SearchType.Position,
            fen: editFen,
        });
    };

    return (
        <Stack spacing={0}>
            <Accordion
                id='search-by-cohort'
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
                id='search-by-player'
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
                id='search-by-opening'
                expanded={expanded === SearchType.Opening}
                onChange={onChangePanel(SearchType.Opening)}
            >
                <AccordionSummary>
                    <Typography>Search By ECO</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByOpening
                        eco={editEco}
                        setEco={setEditEco}
                        startDate={editStartDate}
                        setStartDate={setStartDate}
                        endDate={editEndDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByOpening}
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion
                id='search-by-position'
                expanded={expanded === SearchType.Position}
                onChange={onChangePanel(SearchType.Position)}
            >
                <AccordionSummary>
                    <Typography>Search By Position</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByPosition
                        fen={editFen}
                        setFen={setEditFen}
                        startDate={editStartDate}
                        setStartDate={setStartDate}
                        endDate={editEndDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByPosition}
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
