import { useLightMode } from '@/style/useLightMode';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import { Stack, Typography } from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid-pro';
import { GameInfo, GameResult } from '../../database/game';

interface RenderPlayersProps {
    white: string;
    whiteElo?: string | number;
    whiteProvisional?: boolean;
    black: string;
    blackElo?: string | number;
    blackProvisional?: boolean;
    fullHeight?: boolean;
}

export function RenderPlayersCell(params: GridRenderCellParams<GameInfo>) {
    const headers = params.row.headers;

    return (
        <RenderPlayers
            fullHeight
            white={headers.White}
            black={headers.Black}
            whiteElo={headers.WhiteElo}
            blackElo={headers.BlackElo}
        />
    );
}

export function RenderPlayers({
    white,
    whiteElo,
    whiteProvisional,
    black,
    blackElo,
    blackProvisional,
    fullHeight,
}: RenderPlayersProps) {
    const light = useLightMode();
    const whiteStr = getPlayerName(white, whiteElo, whiteProvisional);
    const blackStr = getPlayerName(black, blackElo, blackProvisional);

    return (
        <Stack height={fullHeight ? 1 : undefined} justifyContent='center'>
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
    if (!params.value) {
        return '?';
    }
    return (
        <Stack height={1} justifyContent='center' alignItems='center'>
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

function getPlayerName(
    username: string,
    rating?: string | number,
    provisional?: boolean,
): string {
    let str = username;
    if (rating === undefined) {
        str += ' (??)';
    } else if (rating) {
        str += ` (${rating}`;
        if (provisional) {
            str += `?`;
        }
        str += ')';
    }
    return str;
}
