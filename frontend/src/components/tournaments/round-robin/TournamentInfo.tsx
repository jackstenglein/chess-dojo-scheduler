import { useAuth } from '@/auth/Auth';
import { toDojoDateString } from '@/calendar/displayDate';
import CohortIcon from '@/scoreboard/CohortIcon';
import { PawnIcon } from '@/style/ChessIcons';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { CalendarMonth } from '@mui/icons-material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Chip, Stack, Typography } from '@mui/material';
import { countActivePlayers, countCompletedGames } from './Stats';
import { TimeControlChip } from './TimeControlChip';

/**
 * Renders the information for the given Round Robin tournament.
 * @param tournament The tournament to render the information for.
 */
export function TournamentInfo({ tournament }: { tournament: RoundRobin }) {
    const { user } = useAuth();

    const numPlayers = countActivePlayers(tournament);
    const gamesPlayed = countCompletedGames(tournament);

    return (
        <Stack direction='row' flexWrap='wrap' gap={1} alignItems='center'>
            <Typography variant='h4' textAlign='center'>
                <CohortIcon
                    cohort={tournament.cohort}
                    sx={{
                        marginRight: '0.6em',
                        verticalAlign: 'middle',
                    }}
                    tooltip=''
                    size={25}
                />{' '}
                {tournament.name}
            </Typography>

            <Chip
                label={`${numPlayers} players`}
                icon={<PeopleAltIcon />}
                color='secondary'
            />

            <TimeControlChip cohort={tournament.cohort} />

            <Chip
                label={`${gamesPlayed}/${(numPlayers * (numPlayers - 1)) / 2} games played`}
                icon={<PawnIcon />}
                color='secondary'
            />

            <Chip
                label={`${toDojoDateString(new Date(tournament.startDate), user?.timezoneOverride)} - ${toDojoDateString(new Date(tournament.endDate), user?.timezoneOverride)}`}
                icon={<CalendarMonth />}
                color='secondary'
            />
        </Stack>
    );
}
