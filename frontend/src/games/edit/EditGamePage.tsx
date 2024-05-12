import { useNavigate, useParams } from 'react-router-dom';

import { Box, Container, Stack, Typography } from '@mui/material';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { RemoteGame, UpdateGameRequest, isGame } from '../../api/gameApi';
import ImportWizard from '../import/ImportWizard';

const EditGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const { cohort, id } = useParams();
    const navigate = useNavigate();

    const loading = request.isLoading();

    const onEdit = (remoteGame: RemoteGame) => {
        if (!cohort || !id) {
            return;
        }

        const req: UpdateGameRequest = {
            ...remoteGame,
            unlisted: true,
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
                    request.onSuccess();
                }
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <RequestSnackbar request={request} showSuccess />
            <Container maxWidth='md' sx={{ py: 5 }}>
                <Stack spacing={2}>
                    <Typography variant='h6'>Replace Game's PGN</Typography>
                    <Typography variant='body1'>
                        Overwrite this game's PGN data? Any comments will remain. Your
                        game will return to unlisted if it is published.
                        {/* TODO before merge include a Cancel link */}
                    </Typography>
                    <Box sx={{ typography: 'body1' }}>
                        <ImportWizard onSubmit={onEdit} loading={loading} />
                    </Box>
                </Stack>
            </Container>
        </>
    );
};

export default EditGamePage;
