import {
    GameInfo,
    GameResult,
    MastersCohort,
    MastersOwnerDisplayName,
} from '@/database/game';
import { dojoCohorts } from '@/database/user';
import Avatar from '@/profile/Avatar';
import CohortIcon from '@/scoreboard/CohortIcon';
import { useLightMode } from '@/style/useLightMode';
import CircleIcon from '@mui/icons-material/Circle';
import CircleOutlinedIcon from '@mui/icons-material/CircleOutlined';
import { Link, Stack, Typography } from '@mui/material';
import { GridRenderCellParams } from '@mui/x-data-grid-pro';
import { Link as RouterLink, useLocation } from 'react-router-dom';

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
    const location = useLocation();
    const whiteStr = getPlayerName(white, whiteElo, whiteProvisional);
    const blackStr = getPlayerName(black, blackElo, blackProvisional);

    let blackIconColor = 'grey.800';
    if (!light && location.pathname.match(/games\/.+/)) {
        blackIconColor = 'common.black';
    }

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
                        color: blackIconColor,
                    }}
                />
                <Typography sx={{ fontSize: { xs: '0.875rem', sm: 'initial' } }}>
                    {blackStr}
                </Typography>
            </Stack>
        </Stack>
    );
}

export function RenderCohort({ cohort }: { cohort: string }) {
    let display = cohort;
    if (cohort && cohort !== dojoCohorts[0] && cohort !== dojoCohorts.slice(-1)[0]) {
        display = cohort.replace('00', '');
    }

    return (
        <Stack sx={{ height: 1 }} alignItems='center' justifyContent='center'>
            <CohortIcon cohort={cohort} tooltip={cohort} size={30} />
            <Typography variant='caption' sx={{ fontSize: '0.65rem' }}>
                {display === MastersCohort ? 'masters' : display}
            </Typography>
        </Stack>
    );
}

export function RenderOwner({
    ownerDisplayName,
    owner,
}: {
    ownerDisplayName: GameInfo['ownerDisplayName'];
    owner: GameInfo['owner'];
}) {
    if (ownerDisplayName === '' || ownerDisplayName === MastersOwnerDisplayName) {
        return '';
    }

    return (
        <Stack
            direction='row'
            spacing={1}
            alignItems='center'
            onClick={(e) => e.stopPropagation()}
        >
            <Avatar username={owner} displayName={ownerDisplayName} size={32} />
            <Link component={RouterLink} to={`/profile/${owner}`}>
                {ownerDisplayName}
            </Link>
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

export function formatPublishedAt(value: string) {
    return value.split('T')[0].replaceAll('-', '.');
}

export function formatMoves(ply?: string) {
    return ply ? Math.ceil(parseInt(ply) / 2) : '?';
}

export function getPublishedAt(game: GameInfo) {
    return game.publishedAt || game.createdAt || game.id.split('_')[0];
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
