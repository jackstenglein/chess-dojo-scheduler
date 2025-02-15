import { Link, Stack, Typography } from '@mui/material';
import { Metadata } from 'next';
import Image from 'next/image';
import { Container } from '../../common/Container';
import { Footer } from '../../common/Footer';
import { Header } from '../../common/Header';
import { DojoAchievements } from '../components/DojoAchievements';
import yearstats from './2024+stats.png';
import customtasks from './custom+tasks.jpg';
import heatmapchanges from './heatmapchanges.jpg';

export const metadata: Metadata = {
    title: 'Free Month at the Dojo | ChessDojo Blog',
    description: `Make your New Year’s resolution and join the Dojo for the month of January at no cost!`,
    keywords: ['Chess', 'Dojo', 'Training', 'Digest', 'Games', 'Repertoire'],
};

export default function DojoDigestVol17() {
    return (
        <Container>
            <Header
                title='Round Robin Tournaments, Custom Tasks, & more!'
                subtitle='Dojo Digest 17 • February 1, 2025'
            />

            <Stack mt={3}>
                <Typography mt={2} variant='h5'>
                    Updates
                </Typography>
                <Typography mt={2}>
                    <strong> 2024 was a great year for the Dojo</strong> - We introduced
                    the Tactics Trainer, the Heatmap, the Dojo Database and many other new
                    features. But more important than all that we saw 81000+ rating points
                    gained and 1900+ graduations. Holy Moly!
                </Typography>

                <Stack mt={2} alignItems='center'>
                    <Image
                        src={yearstats}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>

                <Typography mt={2}>
                    <strong> Dojo has big goals for 2025:</strong> 1) We want to launch
                    our new weekly training schedule in the next month. 2) Improve our
                    user experience (UI!) 3) Dial in the program for Dojo 4.0 (May 1st) 4)
                    Improve our tactics trainer 5) Develop our openings trainer 6) Get the
                    word out! Not everyone knows about the Dojo.
                </Typography>

                <Typography mt={4}>
                    <strong>How to Analyze Your Games</strong> – A ChessDojo Guide will
                    soon be available as an eBook. Keep an eye out to get your copy soon!
                </Typography>

                <Typography mt={2}>
                    <strong>The Dojo Round Robins</strong> have been a huge success, most
                    cohorts have more than one ongoing tournament. These tournaments are
                    the best way for busy players to get a consistent game against
                    opposition who are at their level, unlikely to cheat, and likely to
                    offer a friendly post-mortem to jumpstart the game annotation process.
                    We’ve also now opened up these tournaments up to non-dojo players for
                    a 2 dollar fee. Welcome to the Dojo!
                </Typography>

                <Typography mt={4}>
                    <strong>Heatmap changes.</strong> - We’ve changed the way non-dojo
                    work is presented on the heatmap. Now you, and others, can see the
                    nature of the non-dojo work you did, ie the bucket the work belongs
                    in. What is non-dojo work? It’s chess work that was done with
                    intention. And that is up to you to define. For example, listening to
                    DojoTalks is obviously something everyone should do, but it’s not
                    chess training. Below is Sensei Kraai’s heatmap. What isn’t there are
                    the grad show streams and the blitz dude plays for fun. But he wanted
                    to capture some endgame work (Secrets of Rook Endings by Nunn) and the
                    coverage of the World Championship. Note: it’s definitely possible to
                    do a world championship show without intention, that is just for fun.
                    But Jesse and David tried to go deep, always trying to guess the move
                    and understand what was going on (without an engine!).
                </Typography>
                <Stack mt={2} alignItems='center'>
                    <Image
                        src={heatmapchanges}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>

                <Typography mt={4}>
                    <strong>Custom Tasks!</strong> You can now create custom tasks at the
                    bottom of any bucket of the training plan. The custom task will then
                    show up as non-dojo work in that category on the heatmap. Here is a
                    custom task that sensei Kraai created:
                </Typography>
                <Stack mt={2} alignItems='center'>
                    <Image
                        src={customtasks}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>
                <Typography mt={4}>
                    <strong>Feedback</strong> - The dojo currently has two open threads on
                    our discord, Dojo 4.0 materials and Dojo 2025. The first is strictly
                    about what dojoers think should stay or go within the program for 4.0
                    (May 1st!) and the second is all about improving the Dojo in 2025.
                    Tell us what you think!
                </Typography>

                <Typography mt={4}>
                    Patreon and DojoTalks - The Dojo is trying to be more consistent with
                    our podcast, but we need your help! Head over to our{' '}
                    <Link href='https://www.patreon.com/c/ChessDojo' target='_blank'>
                        Patreon
                    </Link>{' '}
                    where you can get episodes early, vote on coming topics, suggest
                    topics and discuss the pod on our private Discord.
                </Typography>
                <Typography mt={4}>
                    <strong>Teams</strong> - Are you part of a scholastic or European club
                    team? Let us know! We would like to bring your teammates to the Dojo
                    and see you with them on a customized scoreboard. We believe the Dojo
                    is the place for teams to track their progress, be competitive with
                    one another and challenge other teams.
                </Typography>

                <Typography mt={4} variant='h5'>
                    Achievements
                </Typography>
                <Typography mt={4}>
                    The{' '}
                    <Link
                        href='https://www.chessdojo.club/profile/google_116089249199348829796'
                        target='_blank'
                    >
                        DMStewart1981
                    </Link>{' '}
                    passed his USCF Local TD test and is now certified as a Local
                    Tournament Director!
                </Typography>

                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/google_116100455602249006987'
                        target='_blank'
                    >
                        nmp123
                    </Link>{' '}
                    got a score of 4.5/5 on January 15th for a casual tournament and won a
                    king trophy for second place! He also scored 3/4 for his first CFC
                    tournament of the year!
                </Typography>
                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/9ad63b1e-cd90-4cf4-91df-8dd8b96106ed'
                        target='_blank'
                    >
                        Adam Greener
                    </Link>{' '}
                    just hit 2000 Chess.com rapid after joining the Dojo in 2023 with a
                    rating of 1884! Keep an eye out for one of his games in a graduation
                    show soon!
                </Typography>

                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/36ccb6c6-9562-4b01-aa53-d342aeaac08c'
                        target='_blank'
                    >
                        Stephen K
                    </Link>{' '}
                    got his first official FIDE standard rating of 1836!
                </Typography>
                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/google_105412173001395693513'
                        target='_blank'
                    >
                        corporeal
                    </Link>{' '}
                    started following the Dojo in March of 2021 as a 1400 on Chess.com.
                    They had a secret goal of breaking 2000, which they just did!
                </Typography>

                <DojoAchievements
                    rating='180,714'
                    hours='93,180'
                    points='67,680'
                    graduations='2,454'
                />
                <Footer utmCampaign='digest17' />
            </Stack>
        </Container>
    );
}
