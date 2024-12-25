import { isChesscomGameURL, isLichessGameURL } from '@/api/gameApi';
import {
    getChesscomGame,
    getLichessGame,
} from '@/app/(scoreboard)/games/analysis/server';
import { useAuth } from '@/auth/Auth';
import useSaveGame from '@/hooks/useSaveGame';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Chess } from '@jackstenglein/chess';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { Biotech } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
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
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SiChessdotcom, SiLichess } from 'react-icons/si';
import { useLocalStorage } from 'usehooks-ts';
import GameModal from './GameModal';
import { ROUND_ROBIN_COHORT_KEY } from './PairingPage';
import { cohorts, fetchTournamentData, TournamentId } from './roundRobinApi';
import { TournamentEntry } from './TournamentEntry';
/**
 * handles the viewer for game submission
 * @returns the UI for game submission
 */
export const GameSubmission = () => {
    const [isGameModalOpen, setGameModalOpen] = useState(false);
    const handleOpenGameModal = () => setGameModalOpen(true);
    const handleCloseGameModal = () => setGameModalOpen(false);
    const [analyzingSubmission, setAnalyzingSubmission] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const { setStagedGame, createGame, request } = useSaveGame();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTournamentGames, setSelectedTournamentGames] = useState<string[]>([]);

    const { user } = useAuth();

    if (!user) {
        return null;
    }

    const onCreate = async (req: CreateGameRequest) => {
        if (searchParams.has('directory') && searchParams.has('directoryOwner')) {
            req.directory = {
                owner: searchParams.get('directoryOwner') || '',
                id: searchParams.get('directory') || '',
            };
        }

        if (req.pgnText || req.type === 'startingPosition') {
            try {
                new Chess({ pgn: req.pgnText });
                setStagedGame(req);
                window.location.href = '/games/analysis';
            } catch (err) {
                console.error('setStagedGame: ', err);
                request.onFailure({ message: 'Invalid PGN' });
            }
        } else {
            await createGame(req);
        }
    };

    const handleAnalyze = async (submission: string) => {
        try {
            setAnalyzingSubmission(submission); // Start loading
            let pgnText = '';
            if (isLichessGameURL(submission)) {
                const response = await getLichessGame(submission);
                pgnText = response?.data ?? '';
            } else if (isChesscomGameURL(submission)) {
                const response = await getChesscomGame(submission);
                pgnText = response?.data ?? '';
            }

            if (!pgnText) {
                request.onFailure({ message: 'Failed to retrieve game data' });
                return;
            }

            onCreate({ pgnText, type: 'manual' });
        } catch (error) {
            console.error('Error analyzing game:', error);
            request.onFailure({ message: 'Unexpected error occurred' });
        } finally {
            setAnalyzingSubmission(null); // Stop loading
        }
    };

    const handleViewMore = (games: string[]) => {
        setSelectedTournamentGames(games);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

    const [selectedCohort, setSelectedCohort] = useLocalStorage<number>(
        ROUND_ROBIN_COHORT_KEY,
        0,
    );

    const [tournamentData, setTournamentData] = useState<TournamentId>();
    const [loading, setLoading] = useState<boolean>(false);
    const displayIcon =
        selectedCohort !== 0 ? `${selectedCohort}-${selectedCohort + 100}` : '0-300';

    const handleCohortChange = (event: SelectChangeEvent<number>) => {
        setSelectedCohort(Number(event.target.value));
    };

    useEffect(() => {
        if (selectedCohort !== 0) {
            setLoading(true);
            fetchTournamentData(selectedCohort)
                .then(setTournamentData)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [selectedCohort]);

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
            ) : tournamentData?.tournaments !== undefined ? (
                <Box sx={{ mb: 3 }}>
                    {tournamentData?.tournaments.map((tournament, idx) => (
                        <TableContainer sx={{ mt: 2 }} component={Card} key={idx}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>
                                            <TournamentEntry
                                                cohort={displayIcon}
                                                waiting={tournament.waiting}
                                                startdate={tournament.startdate}
                                                enddate={tournament.enddate}
                                                entryName={tournament.name}
                                                pannelName='Games'
                                                playerCount={tournament.players.length}
                                                gameCount={tournament.gameSub.length}
                                                tc={tournament.tc}
                                                inc={tournament.inc}
                                            />
                                            <Box textAlign='right'>
                                                {!tournament.waiting &&
                                                tournament.players.includes(
                                                    user?.displayName,
                                                ) ? (
                                                    <Button
                                                        sx={{ ml: 1 }}
                                                        variant='contained'
                                                        color='success'
                                                        onClick={handleOpenGameModal}
                                                    >
                                                        Submit Game
                                                    </Button>
                                                ) : (
                                                    <Box />
                                                )}
                                            </Box>
                                            <GameModal
                                                open={isGameModalOpen}
                                                onClose={handleCloseGameModal}
                                                user={user}
                                            />
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tournament.gameSub &&
                                    tournament.gameSub.length > 0 ? (
                                        <>
                                            {tournament.gameSub
                                                .slice(0, 4)
                                                .map((submission, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent:
                                                                        'space-between',
                                                                }}
                                                            >
                                                                <Typography
                                                                    textAlign={'center'}
                                                                    sx={{
                                                                        flexGrow: 1,
                                                                        textAlign:
                                                                            'center',
                                                                    }}
                                                                >
                                                                    <Link
                                                                        href={submission}
                                                                        target='_blank'
                                                                        rel='noopener'
                                                                    >
                                                                        {renderIcon(
                                                                            submission,
                                                                        )}
                                                                        {submission}
                                                                    </Link>
                                                                </Typography>

                                                                <Button
                                                                    size='small'
                                                                    onClick={() =>
                                                                        handleAnalyze(
                                                                            submission,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        analyzingSubmission ===
                                                                        submission
                                                                    }
                                                                    startIcon={
                                                                        analyzingSubmission ===
                                                                        submission ? (
                                                                            <CircularProgress
                                                                                size={20}
                                                                                color='inherit'
                                                                            />
                                                                        ) : (
                                                                            <Biotech />
                                                                        )
                                                                    }
                                                                    sx={{ ml: 2 }}
                                                                >
                                                                    {analyzingSubmission ===
                                                                    submission
                                                                        ? 'Importing...'
                                                                        : 'Analyze'}
                                                                </Button>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}

                                            {tournament.gameSub.length > 4 && (
                                                <TableRow>
                                                    <TableCell colSpan={2} align='center'>
                                                        <Button
                                                            onClick={() =>
                                                                handleViewMore(
                                                                    tournament.gameSub,
                                                                )
                                                            }
                                                            variant='outlined'
                                                        >
                                                            View More
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </>
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

            {/* Dialog for Viewing More Games */}
            <Dialog
                open={openDialog}
                onClose={handleCloseDialog}
                maxWidth='md'
                fullWidth
                PaperProps={{
                    style: {
                        backgroundColor: 'black',
                    },
                }}
            >
                <DialogTitle>All Games</DialogTitle>
                <DialogContent>
                    <Table>
                        <TableBody>
                            {selectedTournamentGames.map((submission, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Typography
                                                textAlign={'center'}
                                                sx={{ flexGrow: 1, textAlign: 'center' }}
                                            >
                                                <Link
                                                    href={submission}
                                                    target='_blank'
                                                    rel='noopener'
                                                >
                                                    {renderIcon(submission)}
                                                    {submission}
                                                </Link>
                                            </Typography>

                                            <Button
                                                size='small'
                                                onClick={() => handleAnalyze(submission)}
                                                disabled={
                                                    analyzingSubmission === submission
                                                }
                                                startIcon={
                                                    analyzingSubmission === submission ? (
                                                        <CircularProgress
                                                            size={20}
                                                            color='inherit'
                                                        />
                                                    ) : (
                                                        <Biotech />
                                                    )
                                                }
                                                sx={{ ml: 2 }}
                                            >
                                                {analyzingSubmission === submission
                                                    ? 'Importing...'
                                                    : 'Analyze'}
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color='primary'>
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};
