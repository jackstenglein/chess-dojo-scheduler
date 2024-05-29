import { Box, Container, Stack, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import {
    CreateGameRequest,
    GameHeader,
    UpdateGameRequest,
    isGame,
} from '../../api/gameApi';
import { Game } from '../../database/game';
import ImportWizard from '../import/ImportWizard';
import { PublishGamePreflight } from './MissingGameDataPreflight';

interface PreflightData {
    req: CreateGameRequest;
    headers: GameHeader;
}

const EditGamePage = () => {
    const api = useApi();
    const request = useRequest<PreflightData>();
    const { cohort, id } = useParams();
    const navigate = useNavigate();
    const game: Game | undefined = useLocation().state?.game;

    const onEdit = (remoteGame?: CreateGameRequest, headers?: GameHeader) => {
        if (!cohort || !id || !remoteGame) {
            return;
        }

        const req: UpdateGameRequest = {
            ...remoteGame,
            unlisted: game?.unlisted ?? true,
            headers,
        };

        request.onStart();
        api.updateGame(cohort, id, req)
            .then((response) => {
                if (isGame(response.data)) {
                    trackEvent(EventType.UpdateGame, {
                        method: req.type,
                        dojo_cohort: cohort,
                    });
                    navigate(`/games/${cohort}/${id}`);
                } else if (response.data.headers) {
                    request.onSuccess({
                        req: remoteGame,
                        headers: response.data.headers[0],
                    });
                }
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

    if (!game) {
        return <Navigate to='..' replace />;
    }

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={2}>
                <Typography variant='h6'>Replace PGN</Typography>
                <Typography variant='body1'>
                    Overwrite this game's PGN data? Any comments will remain.
                </Typography>
                <Box sx={{ typography: 'body1' }}>
                    <ImportWizard onSubmit={onEdit} loading={request.isLoading()} />
                </Box>
            </Stack>

            <PublishGamePreflight
                open={Boolean(request.data)}
                onClose={request.reset}
                initHeaders={request.data?.headers}
                onSubmit={(headers) => onEdit(request.data?.req, headers)}
                loading={request.isLoading()}
            />
        </Container>
    );
};

export default EditGamePage;
