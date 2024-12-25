'use client';

import { useRouter } from '@/hooks/useRouter';
import {
    CreateGameRequest,
    GameHeader,
    UpdateGameRequest,
} from '@jackstenglein/chess-dojo-common/src/database/game';
import { Box, Container, Stack, Typography } from '@mui/material';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import ImportWizard from '../import/ImportWizard';

interface PreflightData {
    req: CreateGameRequest;
    headers: GameHeader;
}

const EditGamePage = ({ cohort, id }: { cohort: string; id: string }) => {
    const api = useApi();
    const request = useRequest<PreflightData>();
    const router = useRouter();

    const onEdit = (remoteGame?: CreateGameRequest, headers?: GameHeader) => {
        if (!cohort || !id || !remoteGame) {
            return;
        }

        const req: UpdateGameRequest = {
            ...remoteGame,
            cohort,
            id,
            headers,
        };

        request.onStart();
        api.updateGame(cohort, id, req)
            .then(() => {
                trackEvent(EventType.UpdateGame, {
                    method: req.type,
                    dojo_cohort: cohort,
                });
                router.push(`/games/${cohort}/${id}?firstLoad=true`);
            })
            .catch((err) => {
                console.error('updateGame: ', err);
                request.onFailure(err);
            });
    };

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
