import useSaveGame from '@/hooks/useSaveGame';
import { CreateGameRequest } from '@jackstenglein/chess-dojo-common/src/database/game';
import { Container } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import ImportWizard from './ImportWizard';

const ImportGamePage = () => {
    const searchParams = useSearchParams();
    const { stageCreateGame, request } = useSaveGame();

    const onCreate = (req: CreateGameRequest) => {
        if (searchParams.has('directory') && searchParams.has('directoryOwner')) {
            req.directory = {
                owner: searchParams.get('directoryOwner') || '',
                id: searchParams.get('directory') || '',
            };
        }

        stageCreateGame(req);

        window.location.href = '/games/new';
    };

    return (
        <>
            <Container maxWidth='lg' sx={{ py: 5 }}>
                <ImportWizard onSubmit={onCreate} loading={request.isLoading()} />
            </Container>
        </>
    );
};

export default ImportGamePage;
