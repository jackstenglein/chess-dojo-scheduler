import { Box } from '@mui/material';
import NewGameBoard from './NewGameBoard';

export default function Page() {
    return (
        <Box
            sx={{
                pt: 4,
                pb: 4,
                px: 0,
            }}
        >
            <NewGameBoard />
        </Box>
    );
}
