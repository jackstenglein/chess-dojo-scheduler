import { PawnIcon } from '@/style/ChessIcons';
import Icon from '@/style/Icon';
import { CalendarMonth, HelpOutline } from '@mui/icons-material';
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
import TimeControlTable from '../../../../components/tournaments/round-robin/TimeControlTable';

const faqs = [
    {
        question: 'Is there a registration period for Dojo Round robins?',
        answer: "No, you can register at any time. Once 10 players have registered for your cohort's round robin, the tournament will automatically start.",
    },
    {
        question: 'How do I register for the Dojo Round Robin?',
        answer: 'You can go to the pairings tab and hit register.',
    },
    {
        question: 'I just graduated from my cohort, can I play 1 level up?',
        answer: 'Yes, system will take care of that automatically',
    },
    {
        question: 'What are the time controls for different cohorts?',
        answer: 'Time controls are based on your rating: Under 800: 30+0, 800-1200: 30+30, 1200+: 45+30, 1600+: 60+30, 2000+: 90+30.',
    },
    {
        question: 'When do the tournaments start?',
        answer: 'As soon as 10 players have joined',
    },
    {
        question:
            'My cohort tournament pairings and crosstable are not showing, why is that?',
        answer: 'The tournament is waiting for at least 10 players to join, when its active it will be in active state',
    },
    {
        question: 'What if I want to withdraw from the tournament?',
        answer: "You can easily withdraw when tournament didn't start yet, when its started and you have to withdraw your scores will not count",
    },
    {
        question: 'How do I schedule the round games?',
        answer: 'You can schedule the round games from #round-robin-find-games, you can use either Lichess/Chess.com or OTB',
    },
    {
        question: 'I just played a game, do I have to submit the game somewhere?',
        answer: 'You can submit the game by hitting the submit game button under games tab',
    },
    {
        question: 'I played a game but I do not see scores coming in why is that?',
        answer: 'Usually scores show automatically show up, if there is error please ping @Jalp',
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
 * Renders the Round Robin info page.
 */
export const InfoPage = () => {
    return (
        <Stack>
            <Typography
                variant='h5'
                textAlign='center'
                color='text.secondary'
                sx={{ mt: 2 }}
            >
                Welcome to the Dojo Round Robin!
                <WavingHandIcon
                    sx={{ verticalAlign: 'middle', ml: 1 }}
                    color='dojoOrange'
                />
            </Typography>

            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <MilitaryTechIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
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
                    <ListItemText primary='Play classical time control games for your cohort, as recommended by the training program:' />
                </ListItem>
            </List>
            <TimeControlTable />
            <Divider sx={{ my: 4 }} />

            <Typography variant='h6' color='text.secondary'>
                <LeaderboardIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
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
                <NotInterestedIcon
                    sx={{ verticalAlign: 'middle', mr: 1 }}
                    color='dojoOrange'
                />
                Anti-cheat Info
            </Typography>

            <Typography sx={{ mt: 2, mb: 1 }}>
                The Dojo takes cheating very seriously and has the following anti-cheat
                policies:
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
