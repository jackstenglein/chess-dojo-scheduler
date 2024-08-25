import CohortIcon from '@/scoreboard/CohortIcon';
import {
    Box,
    Card,
    CircularProgress,
    Container,
    FormControl,
    InputLabel,
    Link,
    MenuItem,
    Select,
    SelectChangeEvent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { SiChessdotcom, SiLichess } from 'react-icons/si';
import {
    cohorts,
    fetchTournamentData,
    fetchTournamentIds,
    TournamentData,
} from './roundRobinApi';

/**
 * handles the viewer for game submission
 * @returns the UI for game submission
 */

const GameSubmission = () => {
    const [selectedCohort, setSelectedCohort] = useState<number>(0);
    const [tournamentIds, setTournamentIds] = useState<string[]>([]);
    const [tournamentData, setTournamentData] = useState<TournamentData[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const displayIcon =
        selectedCohort !== 0 ? `${selectedCohort}-${selectedCohort + 100}` : '0-300';

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    useEffect(() => {
        if (selectedCohort !== 0) {
            setLoading(true);
            fetchTournamentIds(selectedCohort)
                .then(setTournamentIds)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedCohort]);

    useEffect(() => {
        if (tournamentIds.length > 0) {
            setLoading(true);
            setTournamentData([]);
            Promise.all(tournamentIds.map((id) => fetchTournamentData(id)))
                .then((data) => {
                    console.log('Fetched Tournament Data:', data);
                    setTournamentData((prevData) => [...prevData, ...data]);
                })
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [tournamentIds]);

    const renderIcon = (url: string) => {
        if (url.includes('lichess')) {
            return (
                <SiLichess
                    fontSize={25}
                    style={{ marginRight: 9, verticalAlign: 'middle', color: 'white' }}
                />
            );
        } else {
            return (
                <SiChessdotcom
                    fontSize={25}
                    style={{ marginRight: 9, color: '#81b64c', verticalAlign: 'middle' }}
                />
            );
        }
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl fullWidth>
                    <InputLabel id='cohort-selector-label'>Select Cohort</InputLabel>
                    <Select
                        labelId='cohort-selector-label'
                        value={selectedCohort}
                        onChange={handleCohortChange}
                        label='Select Cohort'
                    >
                        {cohorts.map((cohort) => (
                            <MenuItem key={cohort.value} value={cohort.value}>
                                <CohortIcon
                                    cohort={cohort.label}
                                    sx={{ marginRight: '0.6em', verticalAlign: 'middle' }}
                                    tooltip=''
                                    size={25}
                                />{' '}
                                {cohort.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {loading ? (
                <Box display='flex' justifyContent='center' alignItems='center'>
                    <CircularProgress />
                </Box>
            ) : tournamentData.length > 0 ? (
                <Box sx={{ mb: 3 }}>
                    {tournamentData.map((tournament, idx) => (
                        <TableContainer sx={{ mt: 2 }} component={Card} key={idx}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <Typography variant='h6' textAlign={'center'}>
                                                <CohortIcon
                                                    cohort={displayIcon}
                                                    sx={{
                                                        marginRight: '0.6em',
                                                        verticalAlign: 'middle',
                                                    }}
                                                    tooltip=''
                                                    size={25}
                                                />{' '}
                                                {tournament.tournamentname} Game
                                                Submissions
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tournament.gameSub &&
                                    tournament.gameSub.length > 0 ? (
                                        tournament.gameSub.map((submission, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Typography textAlign={'center'}>
                                                        <Link
                                                            href={submission}
                                                            target='_blank'
                                                            rel='noopener'
                                                        >
                                                            {renderIcon(submission)}
                                                            {submission}
                                                        </Link>
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={2}>
                                                <Typography textAlign={'center'}>
                                                    No game submissions available.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ))}
                </Box>
            ) : (
                <Typography variant='h6' textAlign={'center'}>
                    No tournament data available.
                </Typography>
            )}
        </Container>
    );
};

export default GameSubmission;
