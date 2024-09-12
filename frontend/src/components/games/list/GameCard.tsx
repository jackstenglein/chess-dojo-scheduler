import {
    RenderOwner,
    RenderPlayers,
    RenderResult,
} from '@/components/games/list/GameListItem';
import { GameInfo } from '@/database/game';
import { Stack, Typography } from '@mui/material';

export default function GameCard({
    date,
    cohort,
    headers,
    owner,
    ownerDisplayName,
}: GameInfo) {
    return (
        <Stack>
            <Stack direction='row'>
                <RenderPlayers
                    fullHeight
                    direction='row'
                    white={headers.White}
                    black={headers.Black}
                    whiteElo={headers.WhiteElo}
                    blackElo={headers.BlackElo}
                />
                <RenderResult result={headers.Result} />
            </Stack>
            <Typography variant='subtitle1' color='text.secondary' lineHeight='1.3'>
                <RenderOwner owner={owner} ownerDisplayName={ownerDisplayName} />
            </Typography>
        </Stack>
    );
}
