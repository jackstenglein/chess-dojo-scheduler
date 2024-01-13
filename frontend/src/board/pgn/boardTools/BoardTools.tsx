import { Move } from '@jackstenglein/chess';
import { Stack, Paper, useMediaQuery } from '@mui/material';

import { Game } from '../../../database/game';
import { useLightMode } from '../../../ThemeProvider';
import StartButtons from './boardButtons/StartButtons';
import ControlButtons from './boardButtons/ControlButtons';
import StatusIcon from './boardButtons/StatusIcon';

interface BoardToolsProps {
    onClickMove: (move: Move | null) => void;

    showSave?: boolean;
    game?: Game;
}

const BoardTools: React.FC<BoardToolsProps> = ({ onClickMove, showSave, game }) => {
    const light = useLightMode();
    const isMedium = useMediaQuery((theme: any) => theme.breakpoints.up('sm'));

    return (
        <>
            <Paper
                elevation={3}
                variant={light ? 'outlined' : 'elevation'}
                sx={{
                    mt: { xs: 0.5, md: 1 },
                    mb: { xs: 0.5, md: 1, xl: 0 },
                    gridArea: 'boardButtons',
                    boxShadow: 'none',
                }}
            >
                <Stack
                    direction='row'
                    justifyContent={isMedium ? 'center' : 'end'}
                    alignItems='center'
                    flexWrap='wrap'
                    position='relative'
                >
                    <StartButtons />
                    <ControlButtons onClickMove={onClickMove} />
                    {showSave && game && <StatusIcon game={game} hidden={!isMedium} />}
                </Stack>
            </Paper>
        </>
    );
};

export default BoardTools;
