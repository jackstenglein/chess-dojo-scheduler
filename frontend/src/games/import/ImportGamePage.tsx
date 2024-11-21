import { EventType, trackEvent } from '@/analytics/events';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { isGame } from '@/api/gameApi';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { Container } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import ImportWizard from './ImportWizard';

const ImportGamePage = () => {
    const api = useApi();
    const request = useRequest<string>();
    const searchParams = useSearchParams();
    const router = useRouter();

    const onCreate = (req: CreateGameRequest) => {
        if (searchParams.has('directory') && searchParams.has('directoryOwner')) {
            req.directory = {
                owner: searchParams.get('directoryOwner') || '',
                id: searchParams.get('directory') || '',
            };
        }

        request.onStart();
        api.createGame(req)
            .then((response) => {
                if (isGame(response.data)) {
                    const game = response.data;
                    trackEvent(EventType.SubmitGame, {
                        count: 1,
                        method: req.type,
                    });

                    let newUrl = `../${game.cohort.replaceAll('+', '%2B')}/${game.id.replaceAll(
                        '?',
                        '%3F',
                    )}?firstLoad=true`;

                    if (req.directory) {
                        newUrl += `&directory=${req.directory.id}&directoryOwner=${req.directory.owner}`;
                    }

                    router.push(newUrl);
                } else {
                    const count = response.data.count;
                    trackEvent(EventType.SubmitGame, {
                        count: count,
                        method: req.type,
                    });
                    request.onSuccess(`Created ${count} games`);
                    router.push('/profile?view=games');
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
            <Container maxWidth='lg' sx={{ py: 5 }}>
                <ImportWizard onSubmit={onCreate} loading={request.isLoading()} />
            </Container>
        </>
    );
};

export default ImportGamePage;
