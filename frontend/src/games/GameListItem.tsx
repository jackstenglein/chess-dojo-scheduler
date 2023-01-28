import { Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';

import { GameResult } from '../database/game';
import { GridRenderCellParams } from '@mui/x-data-grid';

export function RenderPlayers(params: GridRenderCellParams) {
    return (
        <Stack>
            <Stack direction='row' spacing={1}>
                <CircleOutlinedIcon />
                <Typography>{params.value.white}</Typography>
            </Stack>

            <Stack direction='row' spacing={1}>
                <CircleIcon htmlColor='black' />
                <Typography>{params.value.black}</Typography>
            </Stack>
        </Stack>
    );
}

export function RenderResult(params: GridRenderCellParams) {
    return (
        <Stack alignItems='center'>
            <Typography>
                {params.value === GameResult.White && '1'}
                {params.value === GameResult.Black && '0'}
                {params.value === GameResult.Draw && '½'}
            </Typography>
            <Typography>
                {params.value === GameResult.White && '0'}
                {params.value === GameResult.Black && '1'}
                {params.value === GameResult.Draw && '½'}
            </Typography>
        </Stack>
    );
}
