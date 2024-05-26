import {
    Backdrop,
    Button,
    Card,
    CardActionArea,
    CardContent,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useState } from 'react';
import { SiLichess } from 'react-icons/si';
import { Link } from 'react-router-dom';
import { RequestSnackbar } from '../../api/Request';
import {
    LichessGame,
    LichessPerfType,
    getLichessGameResult,
    getLichessWinner,
    useLichessUserGames,
} from '../../api/external/lichess';
import {
    GameSubmissionType,
    isChesscomAnalysisURL,
    isChesscomGameURL,
    isLichessChapterURL,
    isLichessGameURL,
    isLichessStudyURL,
} from '../../api/gameApi';
import { useAuth } from '../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../calendar/displayDate';
import { RatingSystem } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import { RenderPlayers } from '../list/GameListItem';
import { ImportButton } from './ImportButton';
import { ImportDialogProps } from './ImportWizard';
import { OrDivider } from './OrDivider';

type RecentGame = LichessGame;

const GameResult = ({ game }: { game: RecentGame }) => {
    const result = getLichessGameResult(game);

    return <Typography variant='body2'>{result}</Typography>;
};

const RecentGameCell = ({
    game,
    onClick,
}: {
    game: RecentGame;
    onClick: (game: RecentGame) => void;
}) => {
    const { user } = useAuth();
    const lichessUsername = user?.ratings?.[RatingSystem.Lichess]?.username;

    const createdAt = new Date(game.createdAt);
    const dateStr = toDojoDateString(createdAt, user?.timezoneOverride);
    const timeStr = toDojoTimeString(createdAt, user?.timezoneOverride, user?.timeFormat);

    const userWon =
        getLichessWinner(game)?.user.name.toLowerCase() ===
        lichessUsername?.toLowerCase().trim();

    return (
        <Card>
            <CardActionArea
                onClick={() => {
                    onClick(game);
                }}
            >
                <CardContent>
                    <Stack
                        spacing={1.125}
                        onClick={() => {
                            onClick(game);
                        }}
                    >
                        <Stack
                            direction='row'
                            spacing={1}
                            alignItems='center'
                            flexWrap='wrap'
                            justifyContent='space-between'
                        >
                            <Stack direction='row' alignItems='center' spacing={1}>
                                <SiLichess color={userWon ? 'orange' : undefined} />
                                <Typography variant='body2'>
                                    {dateStr} {timeStr}
                                </Typography>
                            </Stack>

                            <Typography variant='body2'>
                                ({game.clock.initial / 60} | {game.clock.increment})
                            </Typography>
                        </Stack>
                        <Stack>
                            <RenderPlayers
                                white={game.players.white.user.name}
                                whiteElo={game.players.white.rating?.toString()}
                                black={game.players.black.user.name}
                                blackElo={game.players.black.rating?.toString()}
                            />
                        </Stack>
                        <GameResult game={game} />
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

const RecentGameGrid = ({
    games,
    onClickGame,
}: {
    games: RecentGame[];
    onClickGame: (game: RecentGame) => void;
}) => {
    return (
        <Grid2 container spacing={{ xs: 1, sm: 3 }}>
            {games.map((game) => (
                <Grid2 xs={12} sm={6} key={game.id}>
                    <RecentGameCell onClick={onClickGame} game={game} />
                </Grid2>
            ))}
        </Grid2>
    );
};

export const OnlineGameForm = ({ loading, onSubmit, onClose }: ImportDialogProps) => {
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lichessGames, requestLichessGames, lichessRequest] = useLichessUserGames();

    const lichessUsername = user?.ratings?.[RatingSystem.Lichess]?.username;

    const handleSubmit = () => {
        if (url.trim() === '') {
            let err = 'URL is required';
            if (lichessGames !== undefined) {
                err += ' or select a game below';
            }

            setError(err);
            return;
        }

        const urlCheckers: [GameSubmissionType, (url: string) => boolean][] = [
            [GameSubmissionType.LichessChapter, isLichessChapterURL],
            [GameSubmissionType.LichessStudy, isLichessStudyURL],
            [GameSubmissionType.LichessGame, isLichessGameURL],
            [GameSubmissionType.ChesscomGame, isChesscomGameURL],
            [GameSubmissionType.ChesscomAnalysis, isChesscomAnalysisURL],
        ];

        let submissionType: GameSubmissionType | null = null;
        for (const [candidate, matcher] of urlCheckers) {
            if (matcher(url)) {
                submissionType = candidate;
                break;
            }
        }

        if (submissionType !== null) {
            onSubmit({ url, type: submissionType });
            return;
        }

        setError('The provided URL is unsupported. Please make sure it is correct.');
    };

    const onClickGame = (game: RecentGame) => {
        onSubmit({ pgnText: game.pgn, type: GameSubmissionType.Manual });
    };

    const onLoadLichessGames = () => {
        if (!lichessUsername) {
            return;
        }

        requestLichessGames({
            username: lichessUsername,
            max: 20,
            perfType: [LichessPerfType.Rapid, LichessPerfType.Classical].join(','),
        });
    };

    return (
        <>
            <DialogTitle>Import Online Game</DialogTitle>
            <DialogContent>
                <Stack>
                    <TextField
                        data-cy='online-game-url'
                        label='Lichess or Chess.com URL'
                        placeholder='https://lichess.org/study/abcd1234/abcd1234'
                        value={url}
                        onChange={(e) => {
                            setUrl(e.target.value);
                        }}
                        error={!!error}
                        helperText={error}
                        fullWidth
                        sx={{ mt: 0.8 }}
                    />
                    <OrDivider />
                    {lichessUsername ? (
                        <>
                            {!lichessGames &&
                                (lichessRequest.isLoading() ? (
                                    <LoadingPage />
                                ) : (
                                    <Button
                                        onClick={() => {
                                            onLoadLichessGames();
                                        }}
                                    >
                                        Load Lichess Games
                                    </Button>
                                ))}
                            {lichessGames && (
                                <>
                                    <Backdrop
                                        open={loading}
                                        sx={{
                                            color: '#fff',
                                            zIndex: (theme) => theme.zIndex.tooltip + 1,
                                        }}
                                    >
                                        <LoadingPage />
                                    </Backdrop>
                                    <RecentGameGrid
                                        games={lichessGames}
                                        onClickGame={onClickGame}
                                    />
                                </>
                            )}
                        </>
                    ) : (
                        <Typography variant='body2'>
                            To list recent games, add your Lichess username to the{' '}
                            <Link to='/profile/edit#ratings'>Ratings section</Link> of
                            your profile settings then scroll to the topand save.
                        </Typography>
                    )}
                </Stack>
                <RequestSnackbar
                    showError={true}
                    showSuccess={false}
                    request={lichessRequest}
                />
            </DialogContent>
            <DialogActions>
                <Button disabled={loading} onClick={onClose}>
                    Cancel
                </Button>
                <ImportButton loading={loading} onClick={handleSubmit} />
            </DialogActions>
        </>
    );
};
