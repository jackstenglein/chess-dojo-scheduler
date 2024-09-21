import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/calendar/displayDate';
import { RenderPlayers, RenderTimeControl } from '@/components/games/list/GameListItem';
import { GameInfo } from '@/database/game';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';

export default function GameCard({
    headers,
    updatedAt,
    unlisted,
    ownerDisplayName,
    cohort,
}: GameInfo) {
    const { user } = useAuth();

    let dateStr = '';
    let timeStr = '';

    if (updatedAt) {
        const date = new Date(updatedAt);
        dateStr = toDojoDateString(date, user?.timezoneOverride);
        timeStr = toDojoTimeString(date, user?.timezoneOverride, user?.timeFormat);
    }

    return (
        <Stack spacing={1.125}>
            <Stack
                direction='row'
                spacing={1}
                alignItems='center'
                flexWrap='wrap'
                justifyContent='space-between'
            >
                <Stack direction='row' alignItems='center' spacing={1}>
                    {unlisted ? <VisibilityOff /> : <Visibility />}
                    <Typography variant='body2'>
                        {dateStr} {timeStr}
                    </Typography>
                </Stack>
                <Typography variant='body2'>
                    <RenderTimeControl timeControl={headers.TimeControl} />
                </Typography>
            </Stack>
            <Stack>
                <RenderPlayers
                    white={headers.White}
                    whiteElo={headers.WhiteElo}
                    black={headers.Black}
                    blackElo={headers.BlackElo}
                    result={headers.Result}
                />
            </Stack>
            <Stack direction='row' alignItems='center' spacing={1.125}>
                <CohortIcon sx={{ height: '0.875rem', width: 'auto' }} cohort={cohort} />
                <Typography variant='body2'>{ownerDisplayName || cohort}</Typography>
            </Stack>
        </Stack>
    );
}
