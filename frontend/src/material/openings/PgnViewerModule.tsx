import { Stack, Typography } from '@mui/material';

import { ModuleProps } from './Module';
import PgnBoard from '../../board/pgn/PgnBoard';

const PgnViewerModule: React.FC<ModuleProps> = ({ module }) => {
    if (!module.pgn) {
        return null;
    }

    return (
        <Stack>
            <Typography variant='h6'>{module.name}</Typography>
            <Typography>{module.description}</Typography>

            <PgnBoard pgn={module.pgn} showPlayerHeaders={false} />
        </Stack>
    );
};

export default PgnViewerModule;
