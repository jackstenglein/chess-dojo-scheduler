import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import { Stack, Typography } from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid-pro';
import { useLightMode } from '../../ThemeProvider';
import { GameInfo, GameResult } from '../../database/game';

interface RenderPlayersProps {
    white: string;
    whiteElo?: string;
    black: string;
    blackElo?: string;
}

export function RenderPlayersCell(params: GridRenderCellParams<GameInfo>) {
    const headers = params.row.headers;

    return (
        <RenderPlayers
            white={headers.White}
            black={headers.Black}
            whiteElo={headers.WhiteElo}
            blackElo={headers.BlackElo}
        />
    );
}

export function RenderPlayers({ white, whiteElo, black, blackElo }: RenderPlayersProps) {
    const light = useLightMode();
    const whiteStr = `${white} (${whiteElo ?? '??'})`;
    const blackStr = `${black} (${blackElo ?? '??'})`;

    return (
        <Stack>
            <Stack direction='row' spacing={1} alignItems='center'>
                {light ? (
                    <CircleOutlinedIcon
                        sx={{ fontSize: { xs: '0.75rem', sm: 'initial' } }}
                    />
                ) : (
                    <CircleIcon
                        sx={{
                            fontSize: { xs: '0.75rem', sm: 'initial' },
                            color: 'white',
                        }}
                    />
                )}
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                    {whiteStr}
                </Typography>
            </Stack>

            <Stack direction='row' spacing={1} alignItems='center'>
                <CircleIcon
                    sx={{
                        fontSize: { xs: '0.75rem', sm: 'initial' },
                        color: 'grey.800',
                    }}
                />
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                    {blackStr}
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
