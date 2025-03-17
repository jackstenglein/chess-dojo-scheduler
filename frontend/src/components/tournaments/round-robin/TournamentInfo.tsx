import { useAuth } from '@/auth/Auth';
import { toDojoDateString } from '@/components/calendar/displayDate';
import { Link } from '@/components/navigation/Link';
import { PawnIcon } from '@/style/ChessIcons';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { CalendarMonth, EmojiEvents } from '@mui/icons-material';
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
                {tournament.name}
            </Typography>

            {tournament.winners?.map((winner) => (
                <Chip
                    key={winner}
                    color='success'
                    icon={<EmojiEvents />}
                    label={
                        <Link href={`/profile/${winner}`} sx={{ color: 'inherit' }}>
                            {tournament.players[winner].displayName}
                        </Link>
                    }
                />
            ))}

            <Chip label={`${numPlayers} players`} icon={<PeopleAltIcon />} color='secondary' />

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
