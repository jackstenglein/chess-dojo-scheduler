import { Stack, Tooltip, IconButton, Paper } from '@mui/material';
import FlipIcon from '@mui/icons-material/WifiProtectedSetup';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LastPageIcon from '@mui/icons-material/LastPage';

interface ToolsProps {
    onFirstMove: () => void;
    onPreviousMove: () => void;
    onNextMove: () => void;
    onLastMove: () => void;
    toggleOrientation: () => void;
}

const Tools: React.FC<ToolsProps> = ({
    onFirstMove,
    onPreviousMove,
    onNextMove,
    onLastMove,
    toggleOrientation,
}) => {
    return (
        <Paper elevation={3} sx={{ mt: 1, boxShadow: 'none' }}>
            <Stack direction='row' justifyContent='center'>
                <Tooltip title='First Move'>
                    <IconButton aria-label='first move' onClick={onFirstMove}>
                        <FirstPageIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title='Previous Move'>
                    <IconButton aria-label='previous move' onClick={onPreviousMove}>
                        <ChevronLeftIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title='Next Move'>
                    <IconButton aria-label='next move' onClick={onNextMove}>
                        <ChevronRightIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title='Last Move'>
                    <IconButton aria-label='last move' onClick={onLastMove}>
                        <LastPageIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>

                <Tooltip title='Flip Board'>
                    <IconButton aria-label='flip board' onClick={toggleOrientation}>
                        <FlipIcon sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};

export default Tools;
