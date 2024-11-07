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

import { AccessTime, HelpOutline } from '@mui/icons-material';
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

const faqs = [
    {
        question: 'Is there a registration period for Dojo Round robins?',
        answer: 'yes, the registration for the tournament started at Nov/2/2024 and it last a week long, but players are welcome to join to fill up remaining tournaments',
    },
    {
        question: 'How do I register for the Dojo Round Robin?',
        answer: 'Use the /register command in the Dojo Training Program Discord to join the tournament in your cohort.',
    },
    {
        question: 'I just graduated from my cohort, can I play 1 level up?',
        answer: 'Yes players are allowed to play 1 level down and 1 level up so even if you graduate you can stay in the tournament cohort when you registered. This can be done by changing cohort roles in training program Discord in #roles channel',
    },
    {
        question: 'What are the time controls for different cohorts?',
        answer: 'Time controls are based on your rating: Under 800: 30+0, 800-1200: 30+30, 1200+: 45+30, 1600+: 60+30, 2000+: 90+30.',
    },
    {
        question: 'When do the tournaments start?',
        answer: "The tournaments start after registration period ends, and when there are atleast 8-10 players, if 10 players can't be found the tournaments may begin. Look out for offical annoucement from @Alex Dodd on Discord about tournaments starting.",
    },
    {
        question:
            'My cohort tournament pairings and crosstable are not showing, why is that?',
        answer: "There are less than 5 players so the tournament pairings can't be generated, please invite your friends or ask around so more people can sign up and the tournament can start!",
    },
    {
        question:
            "When I register for the tournaments the bot doesn't allow me, why is that?",
        answer: 'Make sure you have verified either of Lichess/Chess.com accounts with /verify or /verifychesscom, also make sure to pick your cohort role in #roles, if an issue still persists contact @Noobmaster or create tech ticket',
    },
    {
        question: 'What if I want to withdraw from the tournament?',
        answer: "You can withdraw from the tournament with /withdraw BUT you can't join back after withdrawing",
    },
    {
        question: 'How do I schedule the round games?',
        answer: 'You can schedule the round games from #round-robin-find-games, you can use either Lichess/Chess.com or OTB',
    },
    {
        question: 'I just played a game, do I have to submit the game somewhere?',
        answer: 'No! The system will automatically find your games and track the crosstables, however if you suspect your game scores are not up to date, or there is wrong game URL in game panel please contact @Alex Dodd or @Noobmaster',
    },
    {
        question: 'I played a game but I do not see scores coming in why is that?',
        answer: 'The scores take time to be calculated usually occur end of day, there can be also a problem with account verification, if you and your opponent played on Chess.com but you only connected your account with Lichess using /verify the scores would be neglected as you did not connect your Chess.com account. So always connect the account you and your opponent are playing on.',
    },
    {
        question: 'What happens if I suspect someone of cheating?',
        answer: 'Report it immediately. Cheating is taken very seriously, and players caught cheating will be banned from the server.',
    },
    {
        question: 'I have other question which is not here, where should I ask?',
        answer: 'No worries! You can ask them in #round-robin-player-chat or create a training prgram ticket',
    },
];

const FAQSection = () => (
    <Stack spacing={2}>
        <Typography variant='h6' color='text.secondary'>
            <HelpOutline sx={{ verticalAlign: 'middle', mr: 1 }} color='dojoOrange' />
            Frequently Asked Questions
        </Typography>
        <List>
            {faqs.map((faq, index) => (
                <ListItem key={index}>
                    <ListItemText primary={faq.question} secondary={faq.answer} />
                </ListItem>
            ))}
        </List>
    </Stack>
);

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
                    <ListItemText primary='Schedule games at your own pace, with 3 months to complete the 9 round games' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <AccessTime sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText
                        primary='Play classical time control games recommended by Training program for your cohort: Under 800: 30+0
800-1200: 30+30
1200+: 45+30
1600+: 60+30
2000+: 90+30'
                    />
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
                    <ListItemText primary='Head over to #roles and pick round robin role, then go to #round-robin-player-commands channel to register via /register to automatically get placed in your own cohort Dojo round robin tournament!' />
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

            <FAQSection />

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
            <Divider />
        </Stack>
    );
};
