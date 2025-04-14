'use client';

import { RequestSnackbar } from '@/api/Request';
import useSaveGame from '@/hooks/useSaveGame';
import { Chess } from '@jackstenglein/chess';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { cleanupPgn, splitPgns } from '@jackstenglein/chess-dojo-common/src/pgn/pgn';
import { Container } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import ImportWizard from './ImportWizard';

const ImportGamePage = () => {
    const searchParams = useSearchParams();
    const { setStagedGame, createGame, request } = useSaveGame();
    const router = useRouter();

    const onCreate = async (req: CreateGameRequest) => {
        if (searchParams.has('directory') && searchParams.has('directoryOwner')) {
            req.directory = {
                owner: searchParams.get('directoryOwner') || '',
                id: searchParams.get('directory') || '',
            };
        }

        if (
            req.type === 'startingPosition' ||
            (req.pgnText && splitPgns(req.pgnText).length === 1)
        ) {
            try {
                req.pgnText = cleanupPgn(req.pgnText ?? '');
                new Chess({ pgn: req.pgnText });
                setStagedGame(req);
                router.push('/games/analysis');
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
            <RequestSnackbar request={request} showSuccess />
        </Container>
    );
};

export default ImportGamePage;
