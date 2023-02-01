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

import { dojoCohorts } from '../database/user';
import { useAuth } from '../auth/Auth';
import { useApi } from '../api/Api';
import { SearchFunc } from './pagination';

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
    setCohort: React.Dispatch<React.SetStateAction<string>>;
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
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            renderInput={(params) => <TextField {...params} fullWidth />}
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
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            renderInput={(params) => <TextField {...params} fullWidth />}
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
                            renderInput={(params) => <TextField {...params} fullWidth />}
                        />
                    </Grid>

                    <Grid item xs={12} md={12} lg>
                        <DatePicker
                            label='End Date'
                            value={endDate}
                            onChange={(newValue) => {
                                setEndDate(newValue);
                            }}
                            renderInput={(params) => <TextField {...params} fullWidth />}
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

interface SearchFiltersProps {
    isLoading: boolean;
    onSearch: (searchFunc: SearchFunc) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({ isLoading, onSearch }) => {
    const [expanded, setExpanded] = useState<string | false>('searchByCohort');
    const onChangePanel =
        (panel: string) => (event: React.SyntheticEvent, newExpanded: boolean) => {
            setExpanded(newExpanded ? panel : false);
        };

    const api = useApi();
    const user = useAuth().user!;
    const [cohort, setCohort] = useState(user.dojoCohort);
    const [player, setPlayer] = useState('');
    const [color, setColor] = useState('either');
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [firstSearch, setFirstSearch] = useState(false);

    const startDateStr = startDate?.toISOString().substring(0, 10).replaceAll('-', '.');
    const endDateStr = endDate?.toISOString().substring(0, 10).replaceAll('-', '.');

    const searchByCohort = useCallback(
        (startKey: string) =>
            api.listGamesByCohort(cohort, startKey, startDateStr, endDateStr),
        [cohort, api, startDateStr, endDateStr]
    );

    const searchByOwner = useCallback(
        (startKey: string) => api.listGamesByOwner(startKey, startDateStr, endDateStr),
        [api, startDateStr, endDateStr]
    );

    const searchByPlayer = useCallback(
        (startKey: string) =>
            api.listGamesByOwner(startKey, startDateStr, endDateStr, player, color),
        [api, startDateStr, endDateStr, player, color]
    );

    useEffect(() => {
        if (!firstSearch) {
            setFirstSearch(true);
            onSearch(searchByCohort);
        }
    }, [firstSearch, setFirstSearch, onSearch, searchByCohort]);

    const onSearchByCohort = () => {
        onSearch(searchByCohort);
    };

    const onSearchByOwner = () => {
        onSearch(searchByOwner);
    };

    const onSearchByPlayer = () => {
        onSearch(searchByPlayer);
    };

    return (
        <Stack spacing={0}>
            <Accordion
                expanded={expanded === 'searchByCohort'}
                onChange={onChangePanel('searchByCohort')}
            >
                <AccordionSummary>
                    <Typography>Search by Cohort</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByCohort
                        cohort={cohort}
                        setCohort={setCohort}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByCohort}
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion
                expanded={expanded === 'searchByPlayer'}
                onChange={onChangePanel('searchByPlayer')}
            >
                <AccordionSummary>
                    <Typography>Search by Player</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByPlayer
                        player={player}
                        setPlayer={setPlayer}
                        color={color}
                        setColor={setColor}
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
                        setEndDate={setEndDate}
                        isLoading={isLoading}
                        onSearch={onSearchByPlayer}
                    />
                </AccordionDetails>
            </Accordion>
            <Accordion
                expanded={expanded === 'searchByOwner'}
                onChange={onChangePanel('searchByOwner')}
            >
                <AccordionSummary>
                    <Typography>Search My Uploads</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchByOwner
                        startDate={startDate}
                        setStartDate={setStartDate}
                        endDate={endDate}
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
