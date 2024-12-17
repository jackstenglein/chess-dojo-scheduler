'use client';

import { RequestSnackbar } from '@/api/Request';
import useSaveGame from '@/hooks/useSaveGame';
import { Chess } from '@jackstenglein/chess';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { Container } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import ImportWizard from './ImportWizard';

const ImportGamePage = () => {
    const searchParams = useSearchParams();
    const { setStagedGame, createGame, request } = useSaveGame();

    const onCreate = async (req: CreateGameRequest) => {
        if (searchParams.has('directory') && searchParams.has('directoryOwner')) {
            req.directory = {
                owner: searchParams.get('directoryOwner') || '',
                id: searchParams.get('directory') || '',
            };
        }

        if (req.pgnText || req.type === 'startingPosition') {
            try {
                new Chess({ pgn: req.pgnText });
                setStagedGame(req);
                window.location.href = '/games/analysis';
            } catch (err) {
                console.error('setStagedGame: ', err);
                request.onFailure({ message: 'Invalid PGN' });
            }
        } else {
            await createGame(req);
        }
    };

    return (
        <Container maxWidth='lg' sx={{ py: 5 }}>
            <ImportWizard onSubmit={onCreate} loading={request.isLoading()} />
            <RequestSnackbar request={request} />
        </Container>
    );
};

export default ImportGamePage;
