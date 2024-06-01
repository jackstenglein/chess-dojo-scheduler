import { Box, Container, Stack, Typography } from '@mui/material';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CreateGameRequest, GameHeader, UpdateGameRequest } from '../../api/gameApi';
import { Game } from '../../database/game';
import ImportWizard from '../import/ImportWizard';

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
            unlisted: game?.unlisted,
            headers,
        };

        request.onStart();
        api.updateGame(cohort, id, req)
            .then(() => {
                trackEvent(EventType.UpdateGame, {
                    method: req.type,
                    dojo_cohort: cohort,
                });
                navigate(`/games/${cohort}/${id}?firstLoad=true`);
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
        </Container>
    );
};

export default EditGamePage;
