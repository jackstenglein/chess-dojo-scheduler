import { Link } from '@/components/navigation/Link';
import { WavingHand } from '@mui/icons-material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import PeopleIcon from '@mui/icons-material/People';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Button,
    Container,
    Stack,
    Typography,
} from '@mui/material';
import { PawnIcon } from '@/style/ChessIcons';
import PublishIcon from '@mui/icons-material/Publish';

export default function InfoPage() {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Typography variant='h4' align='center' gutterBottom>
                    Welcome to Dojo Open Classical!
                    <WavingHand
                        fontSize='large'
                        sx={{ verticalAlign: 'middle', ml: 1 }}
                        color='dojoOrange'
                    />
                </Typography>

                <Typography variant='body1' align='center' color='text.secondary'>
                    A 7-week classical chess tournament. For everyone to enjoy!
                </Typography>

                <Stack spacing={3}>
                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id='tournament-info'
                        >
                            <Typography variant='h6' color='text.secondary'>
                                <InfoIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Tournament Overview
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                This is a 7-round tournament run over 7 weeks, with one
                                round per week. Because this is a short tournament, we ask
                                that you only register if you anticipate that you will be
                                able to play most of the rounds. If you do require a bye
                                in a particular round, you will be able to submit your bye
                                requests when registering. Please submit all of your bye
                                requests when you register. Players are limited to 2 bye
                                requests per tournament. A new 7-round tournament will
                                start again approximately one week after the last one
                                ends.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id='tournament-director'
                        >
                            <Typography variant='h6' color='text.secondary'>
                                <PersonIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Tournament Director
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Alex Dodd (alexdodd on Discord) is the tournament
                                director. Feel free to reach out for assistance.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id='registering'
                        >
                            <Typography variant='h6' color='text.secondary'>
                                <EventAvailableIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Registering
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Click on register button to complete the form with all
                                relevant information. Please ensure your form has been
                                submitted successfully. We cannot accept late
                                registrations. If you miss the registration window, you
                                will have to wait until the next tournament starts to sign
                                up.
                            </Typography>
                            <Stack
                                direction='row'
                                spacing={2}
                                justifyContent='center'
                                sx={{ mt: 3 }}
                            >
                                <Button
                                    variant='contained'
                                    color='success'
                                    component={Link}
                                    href='/tournaments/open-classical/register'
                                >
                                    Register
                                </Button>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} id='pairings'>
                            <Typography variant='h6' color='text.secondary'>
                                <PeopleIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Pairings
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Click the view button below to view Weekly pairings which are posted
                                by Tuesday, 12:00am EST. The pairings will include your
                                and your partner's Lichess and Discord usernames so that
                                you can contact each other to schedule your game. It is up
                                to you and your pairing partner to schedule a time to play
                                your game each week.
                            </Typography>
                            <Stack
                                direction='row'
                                spacing={2}
                                justifyContent='center'
                                sx={{ mt: 3 }}
                            >
                                <Button
                                    variant='contained'
                                    color='success'
                                    component={Link}
                                    href='/tournaments/open-classical'
                                >
                                    View Pairings
                                </Button>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id='playing-games'
                        >
                            <Typography variant='h6' color='text.secondary'>
                                <PawnIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Playing Games
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                The preferred time control for this tournament is as
                                follows:
                            </Typography>
                            <ul>
                                <li>Open: 90+30</li>
                                <li>U1800: 60+30</li>
                            </ul>
                            <Typography>
                                Players may opt to play a different time control than the
                                preferred one only if both players agree. If a time
                                control is not agreed upon, the preferred time control
                                will be used. If one player cannot agree to play the
                                preferred time control they will forfeit the game.
                                Similarly, rated games are preferred, but unrated games
                                are allowed if both players agree. If one player cannot
                                agree to play a rated game they will forfeit the game.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            id='submitting-results'
                        >
                            <Typography variant='h6' color='text.secondary'>
                                <PublishIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Submitting Results
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                Once you've completed your game, the winner takes
                                responsibility for submitting the game result. In the case
                                of a draw, you'll have to decide which one of you will
                                submit the game. Please do not submit the game twice.
                                Navigate to the
                                and fill in all relevant information. Please ensure your
                                form submission has been submitted successfully.
                            </Typography>
                            <Typography>Please note:</Typography>
                            <ul>
                                <li>
                                    Games must be submitted no later than Sunday at
                                    midnight EST.
                                </li>
                                <li>We cannot accept late game submissions.</li>
                                <li>
                                    Not submitting your games in time will result in a
                                    forfeit loss for both players (0 - 0).
                                </li>
                            </ul>
                            <Stack
                                direction='row'
                                spacing={2}
                                justifyContent='center'
                                sx={{ mt: 3 }}
                            >
                                <Button
                                    variant='contained'
                                    color='success'
                                    component={Link}
                                    href='/tournaments/open-classical/submit-results'
                                >
                                    Submit Results
                                </Button>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} id='disputes'>
                            <Typography variant='h6' color='text.secondary'>
                                <ReportProblemIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Disputes
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>If a player's opponent:</Typography>
                            <ul>
                                <li>
                                    Is unresponsive within 48 hours of you reaching out to
                                    them to schedule your game
                                </li>
                                <li>
                                    Does not make a concerted effort to schedule a game in
                                    a round
                                </li>
                                <li>
                                    Does not show up within 30 minutes of an agreed upon
                                    time to play
                                </li>
                            </ul>
                            <Typography>That player can:</Typography>
                            <ul>
                                <li>Submit the game as a forfeit win for themselves</li>
                                <li>
                                    Report their opponent, which alerts the TD that the
                                    player in question should be considered for removal
                                    from this and future tournaments
                                </li>
                                <li>
                                    DM the TD on Discord with screenshots of your attempts
                                    to reach out to your opponent
                                </li>
                            </ul>
                            <Typography>
                                A concerted effort consists of either reaching out first
                                or responding to an initial contact within 48 hours; and
                                offering at least 3 different times, on at least 2
                                separate days, that you are available to play that week.
                                If both players make a concerted effort to schedule a game
                                and are still unable to find a time to play, the game can
                                be submitted as a draw (1/2-1/2). In case of a dispute,
                                please contact the TD on Discord.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} id='standings'>
                            <Typography variant='h6' color='text.secondary'>
                                <EmojiEventsIcon
                                    sx={{ mr: 1, verticalAlign: 'middle' }}
                                    color='dojoOrange'
                                />
                                Standings and Winners
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography>
                                View standings on the{' '}
                                <Link href='/tournaments/open-classical'>
                                    Tournament Page
                                </Link>
                                . Winners are announced at the end of 7 rounds.
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Stack>
            </Stack>
        </Container>
    );
}
