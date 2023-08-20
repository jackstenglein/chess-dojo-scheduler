import { Button, Container, Divider, Stack, Typography, Link } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import HelpItem from './HelpItem';
import { useTutorial } from '../tutorial/TutorialContext';
import { TutorialName } from '../tutorial/tutorialNames';

const HelpPage = () => {
    const navigate = useNavigate();
    const { setTutorialState } = useTutorial();

    const onTutorial = (path: string, tutorialName: TutorialName) => {
        navigate(path);
        setTutorialState({ activeTutorial: tutorialName });
    };

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={5}>
                <Stack>
                    <Typography variant='h4'>Help/FAQs</Typography>
                    <Divider />
                    <Typography variant='body1' mt={3}>
                        If you have trouble using the site, please check this section
                        before asking for help. If your issue is not listed here or is not
                        solved by the advice here, then send a Discord message in the{' '}
                        <Link
                            href='https://discord.com/channels/951958534113886238/1095403018607923281'
                            target='_blank'
                            rel='noreferrer'
                        >
                            Dojo Scoreboard Feedback Discord Channel.
                        </Link>
                    </Typography>
                </Stack>

                <Stack>
                    <Typography variant='h5'>Tutorials</Typography>
                    <Divider />
                    <ul>
                        <li>
                            <Button
                                onClick={() =>
                                    onTutorial('/profile', TutorialName.ProfilePage)
                                }
                                sx={{ textTransform: 'none' }}
                            >
                                Launch Profile Page Tutorial
                            </Button>
                        </li>
                        <li>
                            <Button
                                onClick={() =>
                                    onTutorial('/scoreboard', TutorialName.ScoreboardPage)
                                }
                                sx={{ textTransform: 'none' }}
                            >
                                Launch Scoreboard Page Tutorial
                            </Button>
                        </li>
                        <li>
                            <Button
                                onClick={() =>
                                    onTutorial('/calendar', TutorialName.CalendarPage)
                                }
                                sx={{ textTransform: 'none' }}
                            >
                                Launch Calendar Page Tutorial
                            </Button>
                        </li>
                        <li>
                            <Button
                                onClick={() =>
                                    onTutorial('/games', TutorialName.ListGamesPage)
                                }
                                sx={{ textTransform: 'none' }}
                            >
                                Launch Games Page Tutorial
                            </Button>
                        </li>
                    </ul>
                </Stack>

                <Stack>
                    <Typography variant='h5'>Program Requirements/Ratings</Typography>
                    <Divider />
                    <Stack spacing={3} mt={3}>
                        <HelpItem title='How do I update my progress in the training program?'>
                            At the bottom of the{' '}
                            <Link component={RouterLink} to='/profile'>
                                Profile page
                            </Link>
                            , select the "Progress" tab. From here, you can see the
                            training program requirements for each cohort. On the
                            requirement you'd like to complete, click the checkbox or
                            pencil icon in order to update your progress.
                        </HelpItem>
                        <HelpItem title='How do I see the details of a requirement in the training program?'>
                            At the bottom of the{' '}
                            <Link component={RouterLink} to='/profile'>
                                Profile page
                            </Link>
                            , select the "Progress" tab. From here, you can see the
                            training program requirements for each cohort. On the
                            requirement you'd like to learn more about, click the info
                            icon.
                        </HelpItem>
                        <HelpItem title='How do I graduate?'>
                            At the top of the{' '}
                            <Link component={RouterLink} to='/profile'>
                                Profile page
                            </Link>
                            , click the "Graduate" button. This will move you to the
                            graduates section on the scoreboard for your current cohort,
                            as well as add you to the list of recent graduates on the{' '}
                            <Link component={RouterLink} to='/home'>
                                Home page
                            </Link>
                            .
                        </HelpItem>
                        <HelpItem title='How do I switch cohorts without graduating?'>
                            In the{' '}
                            <Link component={RouterLink} to='/profile/edit'>
                                profile editor
                            </Link>
                            , choose a new cohort from the dropdown and then click save.
                            This will move you to the scoreboard for the new cohort, but
                            will not add you to the graduates section for the previous
                            cohort nor add you to the recent graduates on the{' '}
                            <Link component={RouterLink} to='/home'>
                                Home page
                            </Link>
                            .
                        </HelpItem>
                        <HelpItem title='How do I update my ratings?'>
                            Current ratings are updated automatically every 24 hours. If
                            your ratings are not updating, make sure that you have
                            correctly set your Chess.com username, Lichess username, FIFDE
                            Id and/or USCF Id in the{' '}
                            <Link component={RouterLink} to='/profile/edit'>
                                profile editor
                            </Link>
                            . If your usernames are correct and your ratings are still not
                            updating, please send a Discord message in the{' '}
                            <Link
                                href='https://discord.com/channels/951958534113886238/1037811610586193950'
                                target='_blank'
                                rel='noreferrer'
                            >
                                ChessDojo Scheduler Discord Channel.
                            </Link>
                        </HelpItem>
                        <HelpItem title='How do I switch to a different rating system?'>
                            In the{' '}
                            <Link component={RouterLink} to='/profile/edit'>
                                profile editor
                            </Link>
                            , choose a new rating system from the dropdown and then click
                            save. This will update your rating system on the scoreboard
                            for your current cohort, but not for any that you have
                            previously graduated from.
                        </HelpItem>
                        <HelpItem title="Why can't I find myself on the scoreboard?">
                            The scoreboard only displays users who have updated their
                            progress in the last month. If you cannot find yourself,
                            update your progress on one of the program requirements.
                        </HelpItem>
                        <HelpItem title='Why does my profile activity say "no time data"?'>
                            When updating your training progress, add the amount of time
                            you worked on each requirement in order to get a pie chart of
                            how you are using your time.
                        </HelpItem>
                    </Stack>
                </Stack>

                <Stack>
                    <Typography variant='h5'>Scheduling</Typography>
                    <Divider />
                    <Stack spacing={3} mt={3}>
                        <HelpItem title='How do I create a meeting for others to book?'>
                            On the{' '}
                            <Link component={RouterLink} to='/calendar'>
                                Calendar page
                            </Link>
                            , click a time slot on the calendar. This will open a popup
                            where you can specify the start/end times for your
                            availability, the types of meetings you are looking for, how
                            many people can join and which cohorts can join. When you have
                            filled in this info, click the "Save" button at the top of the
                            screen.
                        </HelpItem>
                        <HelpItem title='How do I edit a meeting I previously created?'>
                            On the{' '}
                            <Link component={RouterLink} to='/calendar'>
                                Calendar page
                            </Link>
                            , click on the meeting you would like to edit. A popup will
                            appear containing a pencil icon. Click the pencil icon in
                            order to edit your meeting.
                        </HelpItem>
                        <HelpItem title='How do I delete/cancel a meeting?'>
                            Currently, canceling a booked meeting is only possible for a
                            1-on-1 meeting. In order to cancel a 1-on-1 meeting, click the
                            "Cancel" button at the top of the meeting details page. In
                            order to delete a meeting that has not yet been booked, go to
                            the{' '}
                            <Link component={RouterLink} to='/calendar'>
                                Calendar page
                            </Link>
                            and click the meeting you would like to delete. A popup will
                            appear containing a trash icon. Click the trash icon in order
                            to delete your meeting.
                        </HelpItem>
                        <HelpItem title="How do I book someone else's meeting?">
                            On the{' '}
                            <Link component={RouterLink} to='/calendar'>
                                Calendar page
                            </Link>
                            , click the meeting you would like to book. A popup will
                            appear containing a "Book" button at the bottom.
                        </HelpItem>
                    </Stack>
                </Stack>

                <Stack>
                    <Typography variant='h5'>Game Database</Typography>
                    <Divider />
                    <Stack spacing={3} mt={3}>
                        <HelpItem title='How do I submit a game to the database?'>
                            On the{' '}
                            <Link component={RouterLink} to='/games'>
                                Games page
                            </Link>
                            , click the Submit a Game button, or go directly to the{' '}
                            <Link component={RouterLink} to='/games/submit'>
                                Game Submission page
                            </Link>
                            . You can submit a game either through a Lichess Study link or
                            through manual entry. When submitting through a Lichess link,
                            make sure that your Lichess Study is public and that your link
                            is for a single chapter in your study.
                        </HelpItem>

                        <HelpItem title='How do I update my game?'>
                            Go to the page for the game you want to update. On the top
                            left of the page, you will see a button labeled Update PGN.
                            Click this button to update the PGN data of your game. This
                            will not remove any comments that have been left on your game.
                            Note that you can only do this through games submitted on the
                            new site. Games submitted through the old site cannot be
                            updated in this way.
                        </HelpItem>

                        <HelpItem title='How do I delete my game?'>
                            If the game was submitted to the current database (IE: on this
                            site), then go to the page for the game you want to delete. On
                            the top left of the page, you will see a button labeled Delete
                            Game. Click this button to permanently remove your game and
                            any associated comments. For games submitted through the old
                            database (on chessdojo.club), fill out the following form:{' '}
                            <Link
                                href='https://forms.gle/v3JMwxyLQw3LMA1Y9'
                                target='_blank'
                                rel='noreferrer'
                            >
                                https://forms.gle/v3JMwxyLQw3LMA1Y9
                            </Link>
                        </HelpItem>

                        <HelpItem title="Why can't I find a game I am searching for?">
                            Most games were submitted through the old site and therefore
                            were not associated with this site's accounts. These games
                            will not appear on the profile page. Additionally, these games
                            can only be searched by the player name used in the PGN. For
                            example, if you are searching for the Chess.com username
                            "AngryNaartjie" but the PGN file has the player name as "Our
                            Hero, Naartjie", then you will not find the game.
                        </HelpItem>

                        <HelpItem title='How are games marked as featured?'>
                            The sensei choose the games that are marked as featured.
                            Featured games are visible on the{' '}
                            <Link component={RouterLink} to='/home'>
                                Home page
                            </Link>{' '}
                            for up to a month.
                        </HelpItem>
                    </Stack>
                </Stack>
            </Stack>
        </Container>
    );
};

export default HelpPage;
