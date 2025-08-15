import { OnlineGame, OnlineGamePlayer, useOnlineGames } from '@/api/external/onlineGame';
import {
    isChesscomAnalysisURL,
    isChesscomEventsUrl,
    isChesscomGameURL,
    isLichessChapterURL,
    isLichessGameURL,
    isLichessStudyURL,
} from '@/api/gameApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import {
    getChesscomAnalysis,
    getChesscomEvent,
    getChesscomGame,
    getLichessChapter,
    getLichessGame,
    PgnImportResult,
} from '@/app/(scoreboard)/games/analysis/server';
import { useAuth } from '@/auth/Auth';
import { toDojoDateString } from '@/components/calendar/displayDate';
import GameTable, { gameTableColumns } from '@/components/games/list/GameTable';
import { Link } from '@/components/navigation/Link';
import { RatingSystem } from '@/database/user';
import LoadingPage from '@/loading/LoadingPage';
import {
    GameImportTypes,
    GameInfo,
    OnlineGameImportType,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import {
    Backdrop,
    Button,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { ImportButton } from './ImportButton';
import { ImportDialogProps } from './ImportWizard';
import { OrDivider } from './OrDivider';

function makeRatingString(p: OnlineGamePlayer): string {
    if (typeof p.rating === 'number') {
        return String(p.rating) + (p.provisional ? '?' : '');
    }
    return '';
}

// converting for consumption by GameTable
// at the moment we don't worry about populating fields in GameInfo that we
// don't need for this form
function onlineGameToGameInfo(og: OnlineGame): GameInfo {
    return {
        id: og.id,
        date: toDojoDateString(new Date(og.endTime), undefined),
        owner: '',
        ownerDisplayName: '',
        ownerPreviousCohort: '',
        headers: {
            White: og.white.username,
            WhiteElo: makeRatingString(og.white),
            Black: og.black.username,
            BlackElo: makeRatingString(og.black),
            Date: '',
            Site: '',
            Result: og.result,
            TimeControl: `${og.timeControl.initialSeconds} + ${og.timeControl.incrementSeconds}`,
        },
        createdAt: '',
        pgn: og.pgn,
        source: og.source,
        url: og.url,
    };
}

const RecentGameGrid = ({
    games,
    request,
    onClickGame,
}: {
    games: OnlineGame[];
    Request;
    onClickGame: (game: OnlineGame) => void;
}) => {
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const pagination = {
        page: page,
        setPage: setPage,
        pageSize: pageSize,
        setPageSize: setPageSize,
        data: games.map(onlineGameToGameInfo),
        request: request,
        rowCount: games.length,
        hasMore: false,
        setGames: () => {},
        onSearch: () => {},
        onDelete: () => {},
    };
    // either unimportant or not meaningful in this context
    // the pop-up is small so we try to save space
    const columns = gameTableColumns.filter(
        (col) =>
            ![
                'cohort',
                'owner',
                'moves',
                'whiteRating',
                'blackRating',
                'publishedAt',
                'updatedAt',
                'unlisted',
            ].includes(col.field),
    );
    return (
        <GameTable
            namespace='import-form'
            pagination={pagination}
            columns={columns}
            onRowClick={onClickGame}
        />
    );
};

export const OnlineGameForm = ({ loading, onSubmit, onClose }: ImportDialogProps) => {
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const request = useRequest();

    const lichessUsername = user?.ratings?.[RatingSystem.Lichess]?.username;
    const chesscomUsername = user?.ratings?.[RatingSystem.Chesscom]?.username;
    const fetchGames = Boolean(lichessUsername || chesscomUsername);

    const {
        games,
        requests: { lichess, chesscom },
    } = useOnlineGames({ lichess: lichessUsername, chesscom: chesscomUsername });

    const handleSubmit = () => {
        if (url.trim() === '') {
            let err = 'URL is required';
            if (games.length > 0) {
                err += ' or select a game below';
            }

            setError(err);
            return;
        }

        const importMethods: [
            OnlineGameImportType,
            (url: string) => boolean,
            ((url: string) => Promise<PgnImportResult<string>>) | null,
        ][] = [
            [GameImportTypes.lichessChapter, isLichessChapterURL, getLichessChapter],
            [
                GameImportTypes.lichessStudy,
                isLichessStudyURL,
                null, // TODO, handle this case
            ],
            [GameImportTypes.lichessGame, isLichessGameURL, getLichessGame],
            [GameImportTypes.chesscomGame, isChesscomGameURL, getChesscomGame],
            [GameImportTypes.chesscomAnalysis, isChesscomAnalysisURL, getChesscomAnalysis],
            [GameImportTypes.chesscomGame, isChesscomEventsUrl, getChesscomEvent],
        ];

        // Import
        for (const [submissionType, match, importPgn] of importMethods) {
            if (!match(url)) {
                continue;
            }

            if (importPgn === null) {
                onSubmit({ url, type: submissionType });
            } else {
                importPgn(url)
                    .then(({ data: pgnText, error }) => {
                        if (error) {
                            console.error(error.privateMessage);
                            request.onFailure(error.publicMessage);
                            return;
                        }
                        onSubmit({ pgnText: pgnText ?? '', type: 'manual' });
                    })
                    .catch(() => request.onFailure('Unexpected server error'));
            }

            return;
        }

        setError('The provided URL is unsupported. Please make sure it is correct.');
    };

    const onClickGame = (params: GridRowParams) => {
        onSubmit({
            pgnText: params.row.pgn,
            type: params.row.source,
            url: params.row.url,
        });
    };

    return (
        <>
            <DialogTitle>Import Online Game</DialogTitle>
            <DialogContent sx={{ height: fetchGames ? '75vh' : undefined }}>
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
                    <Stack
                        alignSelf='flex-end'
                        direction='row'
                        spacing={1}
                        paddingRight={1}
                        paddingTop={1}
                    >
                        <Button disabled={loading || request.isLoading()} onClick={onClose}>
                            Cancel
                        </Button>
                        <ImportButton
                            loading={loading || request.isLoading()}
                            onClick={handleSubmit}
                        />
                    </Stack>
                    <OrDivider header='Recent Games' />
                    {fetchGames ? (
                        loading ||
                        request.isLoading() ||
                        chesscom.isLoading() ||
                        lichess.isLoading() ? (
                            <LoadingPage />
                        ) : (
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
                                    games={games}
                                    onClickGame={onClickGame}
                                    request={request}
                                />
                            </>
                        )
                    ) : (
                        <Typography variant='body2'>
                            To list recent games, add your Chess.com or Lichess username to your{' '}
                            <Link href='/profile/edit#ratings'>profile</Link>.
                        </Typography>
                    )}
                </Stack>
            </DialogContent>
            <RequestSnackbar request={request} />
        </>
    );
};
