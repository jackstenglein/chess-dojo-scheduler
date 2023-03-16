import { Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';

import { GameResult } from '../database/game';
import { GridRenderCellParams } from '@mui/x-data-grid';

export function RenderPlayers(params: GridRenderCellParams) {
    return (
        <Stack>
            <Stack direction='row' spacing={1} alignItems='center'>
                <CircleOutlinedIcon sx={{ fontSize: { xs: '0.75rem', sm: 'initial' } }} />
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                    {params.value.white}
                </Typography>
            </Stack>

            <Stack direction='row' spacing={1} alignItems='center'>
                <CircleIcon
                    htmlColor='black'
                    sx={{ fontSize: { xs: '0.75rem', sm: 'initial' } }}
                />
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                    {params.value.black}
                </Typography>
            </Stack>
        </Stack>
    );
}

export function RenderResult(params: GridRenderCellParams) {
    return (
        <Stack alignItems='center'>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                {params.value === GameResult.White && '1'}
                {params.value === GameResult.Black && '0'}
                {params.value === GameResult.Draw && '½'}
            </Typography>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                {params.value === GameResult.White && '0'}
                {params.value === GameResult.Black && '1'}
                {params.value === GameResult.Draw && '½'}
            </Typography>
        </Stack>
    );
}
