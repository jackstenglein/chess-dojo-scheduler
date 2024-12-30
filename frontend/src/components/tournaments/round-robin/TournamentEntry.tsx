import { useAuth } from '@/auth/Auth';
import { toDojoDateString } from '@/calendar/displayDate';
import CohortIcon from '@/scoreboard/CohortIcon';
import { RoundRobin } from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { CalendarMonth } from '@mui/icons-material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import { Chip, Stack, Typography } from '@mui/material';

/**
 * Renders the information for the given Round Robin tournament.
 * @param tournament The tournament to render the information for.
 */
export function TournamentInfo({ tournament }: { tournament: RoundRobin }) {
    const { user } = useAuth();

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

            {/* {tournament.waiting && <Chip label='Waiting' icon={<HourglassEmpty />} />} */}

            <Chip
                label={`${Object.values(tournament.players).length} players`}
                icon={<PeopleAltIcon />}
                color='secondary'
            />

            {/* <Chip
                label={`${tournament.tc}+${tournament.inc} min time control`}
                icon={<Icon name='Classical' />}
                color='secondary'
            />

            <Chip
                label={`${tournament.gameSub.length}/${(tournament.players.length * (tournament.players.length - 1)) / 2} games played`}
                icon={<PawnIcon />}
                color='secondary'
            /> */}

            <Chip
                label={`${toDojoDateString(new Date(tournament.startDate), user?.timezoneOverride)} - ${toDojoDateString(new Date(tournament.endDate), user?.timezoneOverride)}`}
                icon={<CalendarMonth />}
                color='secondary'
            />
        </Stack>
    );
}
