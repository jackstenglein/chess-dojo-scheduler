import { Stack, Typography, Link } from '@mui/material';

const InfoTab = () => {
    return (
        <Stack>
            <Typography variant='h5'>Welcome to the DojoLiga!</Typography>

            <Typography mt={2}>
                The DojoLiga is ChessDojo's blitz, rapid and classical league. It is open
                to all players worldwide.
            </Typography>

            <Typography variant='h6' mt={4}>
                How to Join
            </Typography>

            <Typography>
                <ol>
                    <li>
                        Join{' '}
                        <Link
                            data-cy='lichess-team-link'
                            href='https://lichess.org/team/chessdojo'
                            target='_blank'
                            rel='noreferrer'
                        >
                            ChessDojo's Team
                        </Link>{' '}
                        on Lichess. A team admin will approve your entry.
                    </li>
                    <li>
                        Participate in any league tournaments. All players will be
                        automatically tracked on the leaderboard.
                    </li>
                </ol>
            </Typography>

            <Typography mt={1}>
                The league will consist of both arena and swiss tournaments with various
                time controls - blitz, rapid and classical. Check the ARENAS / SWISS tabs
                for links to upcoming events.
            </Typography>

            <Typography mt={2}>
                At the end of each year, the top players on the leaderboard will be
                invited to the annual Dojo Championship. More info to be announced in
                September.
            </Typography>

            <Typography variant='h6' mt={4}>
                Leaderboard Info
            </Typography>

            <Typography mt={1}>
                The points scored from each arena and swiss are tracked to formulate the
                leaderboard for the various categories - blitz arenas, blitz swisses,
                rapid arenas, etc. The Grand Prix leaderboard tracks the total number of
                Top 10 finishes in all events of a particular time control, with 10 points
                awarded for a 1st place finish, 9 points for 2nd, 8 points for 3rd, etc.,
                down to 1 point for 10th place.
            </Typography>

            <Typography mt={1}>
                <ul>
                    <li>
                        Blitz/Rapid/Classical Arena - The total points scored per
                        individual in all league arenas.
                    </li>
                    <li>
                        Blitz/Rapid/Classical Swiss - The total points scored per
                        individual in all league swisses.
                    </li>
                    <li>
                        Blitz/Rapid/Classical Grand Prix - The total points earned via
                        top-10 finishes, with 10 points awarded for 1st place, 9 points
                        for 2nd, ..., 1 point for 10th.
                    </li>
                    <li>
                        Middlegame Sparring - The total points scored in middlegame
                        sparring tournaments.
                    </li>
                    <li>
                        Endgame Sparring - The total points scored in endgame sparring
                        tournaments.
                    </li>
                </ul>
            </Typography>
        </Stack>
    );
};

export default InfoTab;
