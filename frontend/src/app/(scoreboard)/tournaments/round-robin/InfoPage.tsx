import TimeControlTable from '@/components/tournaments/round-robin/TimeControlTable';
import { PawnIcon } from '@/style/ChessIcons';
import Icon from '@/style/Icon';
import { CalendarMonth, EmojiEvents, HelpOutline, MonetizationOn } from '@mui/icons-material';
import GroupIcon from '@mui/icons-material/Group';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import WavingHandIcon from '@mui/icons-material/WavingHand';
import {
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';

const faqs = [
    {
        question: 'Is there a registration period for Dojo Round robins?',
        answer: "No, you can join the waitlist at any time. Once 10 players have joined the waitlist for your cohort's round robin, the tournament will automatically start. To prevent indefinite waiting, if nobody has joined the waitlist in 10 days and there are at least 4 players on the waitlist, the tournament will start.",
    },
    {
        question: 'How do I register for the Dojo Round Robin?',
        answer: 'Go to the tournaments tab and click the Register button on the waitlist. You can register for your cohort, as well as one cohort above and below.',
    },
    {
        question: 'When do the tournaments start?',
        answer: 'As soon as 10 players have joined the waitlist, or if there are at least 4 players on the waitlist and the waitlist has not updated in 10 days.',
    },
    {
        question: 'How do I know when the tournament has started?',
        answer: 'By default, you will be notified on this site, as well as on Discord and via email. You can disable the Discord and email notifications in your settings.',
    },
    {
        question: 'What are the time controls for different cohorts?',
        answer: 'Minimum time controls are based on your cohort: Under 800: 30+0, 800-1200: 30+30, 1200+: 45+30, 1600+: 60+30, 2000+: 90+30. If both players agree, you can play a longer time control.',
    },
    {
        question: 'How do I schedule the games?',
        answer: 'Use the players tab on the tournament to find the Chess.com, Lichess and/or Discord username of your opponent. Message them on those platforms to schedule the game. You can also search for scheduling threads in Dojo Discord in the #round-robin-chat to connect with players.',
    },
    {
        question: 'How do I submit my games?',
        answer: 'Click the submit game button on the tournament and enter the Chess.com or Lichess URL.',
    },
    {
        question: 'Should games be rated or unrated?',
        answer: 'Games should be rated, but if both you and your opponent agree, you can play an unrated game.',
    },
    {
        question: 'What if I want to withdraw from the tournament?',
        answer: 'Click the withdraw button on the tournament. All your matches will be forfeited, including games you have already played.',
    },
    {
        question: 'What happens if I suspect someone of cheating?',
        answer: 'Report it immediately. Cheating is taken very seriously, and players caught cheating will be banned.',
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
 * Renders the Round Robin info page.
 */
export const InfoPage = () => {
    return (
        <Stack>
            <Typography variant='h5' textAlign='center' color='text.secondary' sx={{ mt: 2 }}>
                Welcome to the Dojo Round Robin!
                <WavingHandIcon sx={{ verticalAlign: 'middle', ml: 1 }} color='dojoOrange' />
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <MilitaryTechIcon sx={{ verticalAlign: 'middle', mr: 1 }} color='dojoOrange' />
                Overview
            </Typography>
            <List>
                <ListItem>
                    <ListItemIcon>
                        <GroupIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Play other members of your cohort' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <PawnIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Play on either on Chess.com or Lichess' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <CalendarMonth sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Schedule games at your own pace, with 3 months to complete all 9 games' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <Icon name='Classical' sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Play rated, classical time control games for your cohort, as recommended by the training program. If both players agree, you can play a longer time control.' />
                </ListItem>
            </List>
            <TimeControlTable />
            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <EmojiEvents sx={{ verticalAlign: 'middle', mr: 1 }} color='dojoOrange' />
                ChessDojo Champions Circuit
            </Typography>

            <Typography sx={{ mt: 2 }}>
                The first 20 Round Robin winners (starting March 20, 2025) will receive a free year
                membership to the Dojo training plan as well as an invitation to the Champions'
                tournament in January 2026. Players who win multiple round robins will receive only
                one prize. After the first 20 winners, additional winners will receive an invitation
                to the Champions' tournament.
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <MonetizationOn sx={{ verticalAlign: 'middle', mr: 1 }} color='dojoOrange' />
                Entrance Fee
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='The entrance fee is $2 per tournament. The fee is waived for subscribers to the training program.' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='You will be charged when the tournament begins. If you withdraw from the waitlist before the tournament begins, you will not be charged.' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='After the tournament begins, no refunds will be provided for withdrawals.' />
                </ListItem>
            </List>

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <LeaderboardIcon sx={{ verticalAlign: 'middle', mr: 1 }} color='dojoOrange' />
                Leaderboard
            </Typography>

            <Typography sx={{ mt: 2, mb: 1 }}>
                The point system follows the FIDE round robin format:
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='You get 1 point for a win, 0.5 for a draw and 0 for a loss' />
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

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <NotInterestedIcon sx={{ verticalAlign: 'middle', mr: 1 }} color='dojoOrange' />
                Anti-cheat Info
            </Typography>

            <Typography sx={{ mt: 2, mb: 1 }}>
                The Dojo takes cheating very seriously and has the following anti-cheat policies:
            </Typography>

            <List>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary="If a player's account gets closed for cheating/fair play violations on Chess.com/Lichess, they are subject to being banned from ChessDojo's tournaments and Discord server." />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='If a player is caught cheating but immediately admits wrongdoing and apologizes, based on the severity of their actions they may be given a second chance. However, they will still be prohibited from playing in Dojo tournaments for at least 3 months' />
                </ListItem>
                <ListItem>
                    <ListItemIcon>
                        <RadioButtonCheckedIcon sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <ListItemText primary='Cheaters are tracked by the system automatically and are evicted from the leaderboards immediately.' />
                </ListItem>
            </List>

            <Divider sx={{ my: 4 }} />

            <FAQSection />
        </Stack>
    );
};
