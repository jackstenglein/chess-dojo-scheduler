import { isChesscomGameURL, isLichessGameURL } from '@/api/gameApi';
import {
    getChesscomGame,
    getLichessGame,
} from '@/app/(scoreboard)/games/analysis/server';
import useSaveGame from '@/hooks/useSaveGame';
import { Chess } from '@jackstenglein/chess';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { Biotech } from '@mui/icons-material';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Link,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { SiChessdotcom, SiLichess } from 'react-icons/si';
import { RoundRobinModel } from '../../../app/(scoreboard)/tournaments/round-robin/roundRobinApi';

/**
 * Renders the games for the given Round Robin tournament.
 * @param tournament The tournament to render the games for.
 */
export function Games({ tournament }: { tournament: RoundRobinModel }) {
    const [analyzingSubmission, setAnalyzingSubmission] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const { setStagedGame, createGame, request } = useSaveGame();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedTournamentGames, setSelectedTournamentGames] = useState<string[]>([]);

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
            <Box sx={{ mb: 3 }}>
                <TableContainer sx={{ mt: 2 }}>
                    <Table>
                        <TableBody>
                            {tournament.gameSub && tournament.gameSub.length > 0 ? (
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
                                                                textAlign: 'center',
                                                            }}
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
                                                            onClick={() =>
                                                                handleAnalyze(submission)
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
                                                        handleViewMore(tournament.gameSub)
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
            </Box>

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
}
