import {
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material';

import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupIcon from '@mui/icons-material/Group';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import { SiChessdotcom, SiDiscord, SiLichess } from 'react-icons/si';

/**
 * Handles the info page
 * @returns the info page
 */
export const InfoPage = () => {
    return (
        <Stack spacing={2}>
            <Typography variant='h5' textAlign='center' color='text.secondary'>
                Welcome to the Dojo Round Robin!
                <WavingHandIcon
                    sx={{ verticalAlign: 'middle', ml: 1 }}
                    color='dojoOrange'
                />
            </Typography>

            <Divider />

            <Typography variant='h6' color='text.secondary'>
                <MilitaryTechIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
                Dojo Round Robin Info
            </Typography>
            <List>
                <ListItem>
                    <ListItemIcon>
                        <GroupIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Play your fellow Dojoers in your own cohort' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <AllInclusiveIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Play on either on Chess.com or Lichess' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <EmojiEventsIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Schedule games at your own pace, with 3 months to complete the round games' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <NotInterestedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Strict anti-cheat measures in place to allow players to learn and grow in the game they love.' />
                </ListItem>
            </List>

            <Typography variant='h6' color='text.secondary'>
                <HelpCenterIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
                Registration Info
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <SiLichess fontSize={25} />
                    </ListItemIcon>
                    <ListItemText primary='Connect your Lichess account to your Discord in the training program Discord with /verify' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <SiChessdotcom fontSize={25} style={{ color: '#81b64c' }} />
                    </ListItemIcon>
                    <ListItemText primary='Connect your Chess.com account to your Discord in the training program Discord with /verifychesscom' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <SiDiscord fontSize={25} style={{ color: '#5865f2' }} />
                    </ListItemIcon>
                    <ListItemText primary='Run /register to automatically get placed in your own cohort Dojo round robin tournament!' />
                </ListItem>
            </List>

            <Divider />

            <Typography variant='h6' color='text.secondary'>
                <LeaderboardIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
                Leaderboard Info
            </Typography>

            <Typography>The point system follows FIDE round robin format</Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='You get 1 point for a win, 0.5 for draw and 0 for a loss' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Forced byes for odd number of players receive 1 point' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary="When a player withdraws from a tournament, everyone else in the tournament receives 1 point, and the withdrawing player's scores are not counted" />
                </ListItem>
            </List>

            <Typography variant='h6' color='text.secondary'>
                <NotInterestedIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
                Anti-cheat Info
            </Typography>

            <Typography>
                The Dojo takes cheating very seriously and has the following anti-cheat
                policies:
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary="If a player's account gets closed for cheating/fair play violations on Chess.com/Lichess, they are subject to being banned from ChessDojo's Discord server." />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='If a player is caught cheating but immediately admits wrongdoing and apologizes, based on the severity of their actions they may be given a second chance. However, they will still be prohibited from playing in DojoLiga for at least 3 months' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Cheaters are tracked by the system automatically and are evicted from the leaderboards immediately.' />
                </ListItem>
            </List>

            <Divider />

            <Typography variant='h6' color='text.secondary'>
                <SiDiscord
                    style={{ verticalAlign: 'middle', marginRight: 9, color: '#5865f2' }}
                />
                Discord Info
            </Typography>

            <Typography>
                The registration for Dojo Round Robin is only available in the Dojo
                Training Program Discord
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableBody>
                        <TableRow>
                            <TableCell>/verify</TableCell>
                            <TableCell>Connect your Discord to Lichess account</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>/verifychesscom</TableCell>
                            <TableCell>
                                Connect your Discord to Chess.com account
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>/register</TableCell>
                            <TableCell>
                                Register for upcoming round robin tournament in your
                                cohort
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>/withdraw</TableCell>
                            <TableCell> Withdraw from running round robin </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};
