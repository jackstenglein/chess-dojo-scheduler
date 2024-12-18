import { Container, Divider, Link, Stack, Typography } from '@mui/material';
import NextLink from 'next/link';

export default function InfoPage() {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Stack spacing={2}>
                    <Typography variant='h5'>
                        Welcome to the new Dojo Open Classical!
                    </Typography>

                    <Typography>
                        This is a 7-round tournament run over 7 weeks, with one round per
                        week. Because this is a short tournament, we ask that you only
                        register if you anticipate that you will be able to play most of
                        the rounds. If you do require a bye in a particular round, you
                        will be able to submit your bye requests when registering. Please
                        submit all of your bye requests when you register. Players are
                        limited to 2 bye requests per tournament.
                    </Typography>

                    <Typography>
                        A new 7-round tournament will start again approximately one week
                        after the last one ends.
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Tournament Director</Typography>
                    <Typography>Alex Dodd (alexdodd on Discord)</Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Registering</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>
                        If the tournament is accepting registrations, then the{' '}
                        <Link component={NextLink} href='/tournaments/open-classical'>
                            Tournament Page
                        </Link>{' '}
                        will contain a register button. Complete the form with all
                        relevant information. Please ensure your form has been submitted
                        successfully. We cannot accept late registrations. If you miss the
                        registration window, you will have to wait until the next
                        tournament starts to sign up.
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Pairings</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>
                        Once the tournament begins, pairings will be posted on the{' '}
                        <Link component={NextLink} href='/tournaments/open-classical'>
                            Tournament Page
                        </Link>{' '}
                        every week, no later than Tuesday at 12:00am EST. The pairings
                        will include your and your partner's Lichess and Discord usernames
                        so that you can contact each other to schedule your game. It is up
                        to you and your pairing partner to schedule a time to play your
                        game each week.
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Playing Games</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>
                        The preferred time control for this tournament is as follows:
                    </Typography>
                    <ul>
                        <li>Open: 90+30</li>
                        <li>U1800: 60+30</li>
                    </ul>
                    <Typography>
                        Players may opt to play a different time control than the
                        preferred one only if both players agree. If a time control is not
                        agreed upon, the preferred time control will be used. If one
                        player cannot agree to play the preferred time control they will
                        forfeit the game.
                    </Typography>
                    <Typography>
                        Similarly, rated games are preferred, but unrated games are
                        allowed if both players agree. If one player cannot agree to play
                        a rated game they will forfeit the game.
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Submitting Results</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>
                        Once you've completed your game, the winner takes responsibility
                        for submitting the game result. In the case of a draw, you'll have
                        to decide which one of you will submit the game. Please do not
                        submit the game twice. Navigate to the{' '}
                        <Link
                            component={NextLink}
                            href='/tournaments/open-classical/submit-results'
                        >
                            Result Submission Page
                        </Link>{' '}
                        and fill in all relevant information. Please ensure your form
                        submission has been submitted successfully. Please note: Games
                        must be submitted no later than Sunday at midnight EST. We cannot
                        accept late game submissions. Not submitting your games in time
                        will result in a forfeit loss for both players (0 - 0).
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Disputes</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography component='div'>
                        If a player's opponent 1. is unresponsive within 48 hours of you
                        reaching out to them to schedule your game, 2. does not make a
                        concerted effort to schedule a game in a round, or 3. does not
                        show up within 30 minutes of an agreed upon time to play, that
                        player can:
                        <ul>
                            <li>Submit the game as a forfeit win for themselves</li>
                            <li>
                                When submitting your game will be given the option to
                                report your opponent - this alerts the TD that the player
                                in question should be considered for removal from this and
                                future tournaments
                            </li>
                            <li>
                                DM the TD on Discord with screenshots of your attempts to
                                reach out to your opponent
                            </li>
                        </ul>
                        A concerted effort consists of either reaching out first or
                        responding to an initial contact within 48 hours; and offering at
                        least 3 different times, on at least 2 separate days, that you are
                        available to play that week. If both players make a concerted
                        effort to schedule a game and are still unable to find a time to
                        play, the game can be submitted as a draw (1/2-1/2). In case of a
                        dispute, please contact the TD on Discord.
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h6'>Standings and Winners</Typography>
                    <Divider sx={{ mb: 1 }} />
                    <Typography>
                        To view the standings for any round you can navigate to the{' '}
                        <Link component={NextLink} href='/tournaments/open-classical'>
                            Tournament Page
                        </Link>
                        . At the end of the 7 rounds, winners will be announced.
                    </Typography>
                </Stack>
            </Stack>
        </Container>
    );
}
