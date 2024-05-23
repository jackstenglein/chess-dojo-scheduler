import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import {
    LichessGame,
    LichessPerfType,
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
import { ImportButton } from './ImportButton';
import { ImportDialogProps } from './ImportWizard';

import { SiLichess } from 'react-icons/si';
import { RequestSnackbar } from '../../api/Request';
import { useAuth } from '../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../calendar/displayDate';
import LoadingPage from '../../loading/LoadingPage';
import { RenderPlayers } from '../list/GameListItem';
import { OrDivider } from './OrDivider';

// Type union of supported game objects.
type RecentGame = LichessGame;

const RecentGameCell = ({
    game,
    onClick,
}: {
    game: RecentGame;
    onClick: (game: RecentGame) => void;
}) => {
    const auth = useAuth();

    const createdAt = new Date(game.createdAt);
    const dateStr = toDojoDateString(createdAt, auth.user?.timezoneOverride);
    const timeStr = toDojoTimeString(
        createdAt,
        auth.user?.timezoneOverride,
        auth.user?.timeFormat,
    );

    return (
        <Card sx={{ height: 1 }}>
            <CardActionArea
                sx={{ height: 1 }}
                onClick={() => {
                    onClick(game);
                }}
            >
                <CardContent>
                    <Stack
                        spacing={1.125}
                        sx={{ borderColor: 'primary.main' }}
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
                                <SiLichess />
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
        <Grid container spacing={{ xs: 1, sm: 3 }}>
            {games.map((game) => (
                <Grid item xs={12} sm={6} key={game.id}>
                    <RecentGameCell onClick={onClickGame} game={game} />
                </Grid>
            ))}
        </Grid>
    );
};

export const OnlineGameForm = ({ loading, onSubmit, onClose }: ImportDialogProps) => {
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lichessGames, requestLichessGames, lichessRequest] = useLichessUserGames();

    const lichessUsername = user?.ratings.LICHESS?.username;

    const handleSubmit = () => {
        if (url.trim() === '') {
            setError('URL is required');
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
                    {lichessUsername && (
                        <>
                            <OrDivider />
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
                                <RecentGameGrid
                                    games={lichessGames}
                                    onClickGame={onClickGame}
                                />
                            )}
                        </>
                    )}
                </Stack>
                <RequestSnackbar
                    showError={true}
                    showSuccess={false}
                    request={lichessRequest}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <ImportButton loading={loading} onClick={handleSubmit} />
            </DialogActions>
        </>
    );
};
