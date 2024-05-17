import { Box, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EventType, trackEvent } from '../../analytics/events';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { CreateGameRequest, isGame } from '../../api/gameApi';
import ImportWizard from './ImportWizard';

const ImportGamePage = () => {
    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();

    const onCreate = (req: CreateGameRequest) => {
        request.onStart();
        api.createGame(req)
            .then((response) => {
                if (isGame(response.data)) {
                    const game = response.data;
                    trackEvent(EventType.SubmitGame, {
                        count: 1,
                        // TODO: before merge, be more fine grained than this, now that starting position etc. is Manual
                        source: req.type,
                    });
                    navigate(
                        `../${game.cohort.replaceAll('+', '%2B')}/${game.id.replaceAll(
                            '?',
                            '%3F',
                        )}`,
                    );
                } else {
                    const count = response.data.count;
                    trackEvent(EventType.SubmitGame, {
                        count: count,
                        source: req.type,
                    });
                    request.onSuccess(`Created ${count} games`);
                    navigate('/profile?view=games');
                }
            })
            .catch((err) => {
                console.error('CreateGame ', err);
                request.onFailure(err);
            });
    };

    return (
        <>
            <RequestSnackbar request={request} showSuccess />
            <Container maxWidth='md' sx={{ py: 5 }}>
                <Stack spacing={2}>
                    <Typography variant='h6'>Import Game</Typography>
                    <Typography variant='body1'>
                        Specify a source of the game, study, or annotations you would like
                        to import. After importing, you can publish them to make them
                        public. Before then, you can still share a link to them so others
                        can view and comment.
                    </Typography>
                    <Box sx={{ typography: 'body1' }}>
                        <ImportWizard onSubmit={onCreate} loading={request.isLoading()} />
                    </Box>
                </Stack>
            </Container>
        </>
    );
};

export default ImportGamePage;
