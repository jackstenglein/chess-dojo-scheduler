import {
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useEffect, useState } from 'react';
import { RequestSnackbar, useRequest } from '../../api/Request';
import {
    LichessExportGamesResponse,
    LichessGame,
    LichessPerfType,
    useLichessApi,
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
import { useAuth } from '../../auth/Auth';
import { toDojoDateString, toDojoTimeString } from '../../calendar/displayDate';
import { OrDivider } from './OrDivider';

// Type union of supported game objects.
type RecentGame = LichessGame;

const RecentGamesList = () => {
    const auth = useAuth();
    const request = useRequest<LichessExportGamesResponse>();
    const lichessApi = useLichessApi();
    const [games, setGames] = useState<LichessGame[]>();

    const columns: GridColDef<RecentGame>[] = [
        {
            field: 'createdAt',
            headerName: 'Date Played',
            flex: 1,
            renderCell: (params: GridRenderCellParams<RecentGame>) => {
                const createdAt = new Date(params.row.createdAt);

                const dateStr = toDojoDateString(createdAt, auth.user?.timezoneOverride);

                const timeStr = toDojoTimeString(
                    createdAt,
                    auth.user?.timezoneOverride,
                    auth.user?.timeFormat,
                );

                return (
                    <Stack direction='row' spacing={1} alignItems='center'>
                        <SiLichess />
                        <Typography variant='body2'>
                            {dateStr} {timeStr}
                        </Typography>
                    </Stack>
                );
            },
        },
        {
            field: 'players',
            headerName: 'Players',
            sortable: false,
            flex: 1,
            renderCell: (params: GridRenderCellParams<RecentGame, string>) => {
                const PlayerRow = ({ color }: { color: 'white' | 'black' }) => {
                    const player = params.row.players[color];
                    return (
                        <Stack direction='row' spacing={1}>
                            <Typography variant='body2' fontWeight='bold'>
                                {player.user.name}
                            </Typography>
                            <Typography variant='body2'>({player.rating})</Typography>
                        </Stack>
                    );
                };
                return (
                    <Stack>
                        <PlayerRow color='white' />
                        <PlayerRow color='black' />
                    </Stack>
                );
            },
        },
    ];

    useEffect(() => {
        console.log(request.isLoading());
        if (request.isLoading() || request.data !== undefined || games !== undefined) {
            return;
        }

        request.onStart();

        lichessApi
            .exportGames({
                // TODO: before merge, param this
                username: 'bestieboots',
                max: 20,
                perfType: [LichessPerfType.Rapid, LichessPerfType.Classical].join(','),
            })
            .then((resp) => {
                request.onSuccess();
                setGames(resp.data);
            })
            .catch((err: unknown) => {
                request.onFailure(err);
                console.error(err);
            });
    }, [lichessApi, request, games]);

    const onClickGame = (params: GridRowParams<LichessGame>) => {
        console.log(params.row);
    };

    if (request.isLoading()) {
        return 'Loading';
    }

    return (
        <Stack>
            <DataGridPro
                data-cy='recent-games-table'
                columns={columns}
                rows={games ?? []}
                loading={request.isLoading()}
                onRowClick={onClickGame}
                initialState={{
                    sorting: {
                        sortModel: [
                            {
                                field: 'createdAt',
                                sort: 'desc',
                            },
                        ],
                    },
                }}
                hideFooter
            />
            <RequestSnackbar request={request} showError={true} />
        </Stack>
    );
};

export const OnlineGameForm = ({ loading, onSubmit, onClose }: ImportDialogProps) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);

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
                    <RecentGamesList />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <ImportButton loading={loading} onClick={handleSubmit} />
            </DialogActions>
        </>
    );
};
