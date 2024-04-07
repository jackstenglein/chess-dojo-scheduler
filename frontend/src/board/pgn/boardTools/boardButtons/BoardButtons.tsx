import { Move } from '@jackstenglein/chess';
import { Box, Paper, Stack } from '@mui/material';
import { useGame } from '../../../../games/view/GamePage';
import { useLightMode } from '../../../../ThemeProvider';
import { useChess } from '../../PgnBoard';
import ControlButtons from './ControlButtons';
import StartButtons from './StartButtons';
import StatusIcon from './StatusIcon';

interface BoardButtonsProps {
    onClickMove: (move: Move | null) => void;
}

const BoardButtons: React.FC<BoardButtonsProps> = ({ onClickMove }) => {
    const light = useLightMode();
    const { game, isOwner: isGameOwner } = useGame();
    const { chess } = useChess();

    return (
        <Paper
            elevation={3}
            variant={light ? 'outlined' : 'elevation'}
            sx={{
                mt: { xs: 0.5, md: 1 },
                mb: { xs: 0.5, md: 1, xl: 0 },
                gridArea: 'boardButtons',
                boxShadow: 'none',
                visibility: chess ? undefined : 'hidden',
            }}
        >
            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                position='relative'
            >
                <StartButtons />
                <ControlButtons onClickMove={onClickMove} />
                {game && isGameOwner ? (
                    <StatusIcon game={game} />
                ) : (
                    <Box sx={{ width: '40px' }}></Box>
                )}
            </Stack>
        </Paper>
    );
};

export default BoardButtons;
