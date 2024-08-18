import { Stack, Typography, Link, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import EventIcon from '@mui/icons-material/Event';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import StarIcon from '@mui/icons-material/Star';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';


const InfoTab = () => {
    return (
        <Stack spacing={2}>
            <Typography variant="h5" color="primary">
                <WavingHandIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Welcome to the DojoLiga!
            </Typography>

            <Typography>
                The DojoLiga is ChessDojo's blitz, rapid, and classical league. It is open
                to all players worldwide.
            </Typography>

            <Divider />

            <Typography variant="h6" color="primary">
                <EventIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                How to Join?
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <GroupIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <>
                                Join{' '}
                                <Link
                                    data-cy="lichess-team-link"
                                    href="https://lichess.org/team/chessdojo"
                                    target="_blank"
                                    rel="noreferrer"
                                    color="secondary"
                                >
                                    ChessDojo's Team
                                </Link>{' '}
                                on Lichess. A team admin will approve your entry.
                            </>
                        }
                    />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <EmojiEventsIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Participate in any league tournaments. All players will be automatically tracked on the leaderboard." />
                </ListItem>
            </List>

            <Typography>
                The league consists of both arena and swiss tournaments with various
                time controls: blitz, rapid, and classical. Check the ARENAS / SWISS tabs
                for links to upcoming events.
            </Typography>

            <Typography>
                At the end of each year, the top players on the leaderboard will be
                invited to the annual Dojo Championship. More info to be announced in
                September.
            </Typography>

            <Divider />

            <Typography variant="h6" color="primary">
                <LeaderboardIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Leaderboard Info
            </Typography>

            <Typography>
                The points scored from each arena and swiss tournament are tracked to formulate the leaderboard for various categories. The Grand Prix leaderboard tracks the total number of Top 10 finishes in all events of a particular time control, with points awarded as follows:
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Blitz/Rapid/Classical Arena - Total points scored per individual in all league arenas." />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Blitz/Rapid/Classical Swiss - Total points scored per individual in all league swisses." />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Blitz/Rapid/Classical Grand Prix - Total points earned via top-10 finishes, with 10 points for 1st place, 9 for 2nd, ..., 1 point for 10th." />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Middlegame Sparring - Total points scored in middlegame sparring tournaments." />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="Endgame Sparring - Total points scored in endgame sparring tournaments." />
                </ListItem>
            </List>
        </Stack>
    );
};

export default InfoTab;



