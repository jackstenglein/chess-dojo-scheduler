import { WavingHand } from '@mui/icons-material';
import { Container, Stack, Typography } from '@mui/material';
import { InfoEntryAccordion } from './InfoEntryAccordian';
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
                    <InfoEntryAccordion
                        id='tournament-info'
                        iconid={'info'}
                        title='Tournament Overview'
                        desc='This is a 7-round tournament run over 7 weeks, with one
                                round per week. Because this is a short tournament, we ask
                                that you only register if you anticipate that you will be
                                able to play most of the rounds. If you do require a bye
                                in a particular round, you will be able to submit your bye
                                requests when registering. Please submit all of your bye
                                requests when you register. Players are limited to 2 bye
                                requests per tournament. A new 7-round tournament will
                                start again approximately one week after the last one
                                ends.'
                    />
                    <InfoEntryAccordion
                        id='tournament-director'
                        iconid={'player'}
                        title='Tournament Director'
                        desc='Alex Dodd (alexdodd on Discord) is the tournament
                                director. Feel free to reach out for assistance.'
                    />
                    <InfoEntryAccordion
                        id='registering'
                        iconid='eventCheck'
                        title='Registering'
                        desc='Click on register button to complete the form with all
                                relevant information. Please ensure your form has been
                                submitted successfully. We cannot accept late
                                registrations. If you miss the registration window, you
                                will have to wait until the next tournament starts to sign
                                up.'
                        buttonName='Register'
                        endpoint='/tournaments/open-classical/register'
                        isButton={true}
                    />

                    <InfoEntryAccordion
                        id='pairings'
                        iconid='cohort'
                        title='Pairings'
                        desc='Click the view button below to view Weekly pairings which
                                are posted by Tuesday, 12:00am EST. The pairings will
                                include your and your partners Lichess and Discord
                                usernames so that you can contact each other to schedule
                                your game. It is up to you and your pairing partner to
                                schedule a time to play your game each week.'
                        buttonName='View Pairings'
                        endpoint='/tournaments/open-classical'
                        isButton={true}
                    />


                    <InfoEntryAccordion
                        id='playing-games'
                        iconid={'pawn'}
                        title='Playing Games'
                        isList={true}
                        decList={[
                            'Open Classical Timecontrols:',
                            '- Open: 90+30',
                            '- U1800: 60+30',
                            'Rated games info:',
                            'Similarly, rated games are preferred, but unrated games are allowed if both players agree. If one player cannot agree to play a rated game they will forfeit the game.',
                        ]}
                        desc='Players may opt to play a different time control than the
                                preferred one only if both players agree. If a time
                                control is not agreed upon, the preferred time control
                                will be used. If one player cannot agree to play the
                                preferred time control they will forfeit the game.
                                Similarly, rated games are preferred, but unrated games
                                are allowed if both players agree. If one player cannot
                                agree to play a rated game they will forfeit the game.'
                    />


                    <InfoEntryAccordion
                        id={'submitting-results'}
                        iconid='submit'
                        title='Submitting Results'
                        desc={
                            'Once you haveve completed your game, the winner take responsibility for submitting the game result. In the case of a draw, you ll have to decide which one of you will submit the game. Please do not submit the game twice. Navigate to the and fill in all relevant information. Please ensure your form submission has been submitted successfully.'
                        }
                        isList={true}
                        isButton={true}
                        buttonName='Submit Results'
                        endpoint='/tournaments/open-classical/submit-results'
                        decList={[
                            '- Games must be submitted no later than Sunday at midnight EST.',
                            '- We cannot accept late game submissions.',
                            '- Not submitting your games in time will result in a forfeit loss for both players (0 - 0).',
                        ]}
                    />

                    <InfoEntryAccordion
                        id='disputes'
                        iconid='warning'
                        title='Disputes'
                        isList={true}
                        decList={[
                            "If a player's opponent:",
                            '- Is unresponsive within 48 hours of you reaching out to them to schedule your game',
                            '- Does not make a concerted effort to schedule a game in a round',
                            '- Does not show up within 30 minutes of an agreed upon time to play',
                            '',
                            'That player can:',
                            '- Submit the game as a forfeit win for themselves',
                            '- Report their opponent, which alerts the TD that the player in question should be considered for removal from this and future tournaments',
                            '- DM the TD on Discord with screenshots of your attempts to reach out to your opponent',
                        ]}
                        desc='A concerted effort consists of either reaching out first or responding to an initial contact within 48 hours; and offering at least 3 different times, on at least 2 separate days, that you are available to play that week. If both players make a concerted effort to schedule a game and are still unable to find a time to play, the game can be submitted as a draw (1/2-1/2). In case of a dispute, please contact the TD on Discord.'
                        isButton={false}
                    />

                    <InfoEntryAccordion
                        id={'standings'}
                        iconid='liga'
                        title='Standings and Winners'
                        desc='View standings by clicking the standings button, winners are announced at the end of 7 rounds.'
                        buttonName='View Standings'
                        isButton={true}
                        endpoint='/tournaments/open-classical'
                    />
                </Stack>
            </Stack>
        </Container>
    );
}
