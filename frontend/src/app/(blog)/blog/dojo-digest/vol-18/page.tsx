import { Link } from '@/components/navigation/Link';
import { Stack, Typography } from '@mui/material';
import { Metadata } from 'next';
import Image from 'next/image';
import { Container } from '../../common/Container';
import { Footer } from '../../common/Footer';
import { Header } from '../../common/Header';
import { DojoAchievements } from '../components/DojoAchievements';
import badges from './badges.png';
import masteringtime from './mastering-time.png';
import stream from './stream.png';
import tacticalpatterns from './tactical-patterns.jpg';

export const metadata: Metadata = {
    title: 'New Courses, Badges, & more! | ChessDojo Blog',
    description: `Mastering Time in Chess and 100 Tactical Patterns You Must Know are finally out on Chessable!`,
    keywords: ['Chess', 'Dojo', 'Training', 'Digest', 'Tournaments'],
};

export default function DojoDigestVol17() {
    return (
        <Container>
            <Header
                title='New Courses, Badges, & more!'
                subtitle='Dojo Digest 18 • March 1, 2025'
            />

            <Stack mt={3}>
                <Typography mt={2} variant='h5'>
                    Updates
                </Typography>
                <Typography mt={2}>
                    <Link
                        href='https://www.chessable.com/mastering-time-in-chess/course/277570/'
                        target='_blank'
                    >
                        Mastering Time in Chess
                    </Link>{' '}
                    is finally out on Chessable! It's a follow-up to Sensei Kraai's first
                    course{' '}
                    <Link
                        href='https://www.chessable.com/its-about-time-a-beginners-guide-to-time-in-chess/course/194972/'
                        target='_blank'
                    >
                        It’s About Time
                    </Link>
                    . In both courses, Kraai uses his experience of reviewing thousands of
                    Dojo games in the weekly{' '}
                    <Link href='https://www.twitch.tv/chessdojo' target='_blank'>
                        graduation shows
                    </Link>
                    . Dojoer games are featured in both courses! This second course is
                    aimed at players between 1000 and 1600 Dojo rating (1250-1850{' '}
                    <Link href='https://www.chess.com/home' target='_blank'>
                        chess.com
                    </Link>
                    ) and trains the most important skill for these cohorts to master: how
                    to use the free tempi your opponents give you.
                </Typography>

                <Stack mt={2} alignItems='center'>
                    <Image
                        src={masteringtime}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>

                <Typography mt={4}>
                    Also available on Chessable is{' '}
                    <Link
                        href='https://www.chessable.com/100-tactical-patterns-you-must-know/course/283143/'
                        target='_blank'
                    >
                        100 Tactical Patterns You Must Know
                    </Link>
                    , presented by IM Kostya. Based on the book from New in Chess, the
                    course is recommended for players rated 1400-2000 OTB. Watch Kostya's
                    review of the book{' '}
                    <Link
                        href='https://www.youtube.com/watch?v=aC-Up1teylU'
                        target='_blank'
                    >
                        here.
                    </Link>
                </Typography>
                <Stack mt={2} alignItems='center'>
                    <Image
                        src={tacticalpatterns}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>

                <Typography mt={4}>
                    <strong>Open Classical</strong> —{' '}
                    <Link
                        href='https://www.chessdojo.club/tournaments/open-classical'
                        target='_blank'
                    >
                        Registration
                    </Link>{' '}
                    is now open to all players for the Dojo Open Classical, our 7-week
                    classical chess tournament. The tournament starts March 10, so make
                    sure to register before then!
                </Typography>

                <Stack mt={2} alignItems='center' spacing={1}>
                    <Typography>
                        <strong>Badges!</strong> Getting your rating up is not the only
                        achievement in chess. You can also earn ChessDojo badges for
                        completing Polgar mates, annotating games, graduating and more.
                    </Typography>
                </Stack>

                <Stack mt={2} alignItems='center'>
                    <Image
                        src={badges}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>

                <Typography mt={4}>
                    <strong> How to Analyze Your Games </strong>– A ChessDojo Guide is
                    finally coming out on Kindle and the ChessDojo store! Keep an eye out
                    for it's release in the coming days.
                </Typography>

                <Typography mt={4}>
                    The Dojo had a few famous guests on stream recently. We were joined by
                    <strong> 13th World Chess Champion Garry Kasparov</strong> while
                    covering the 5th annual KCF University Cup! Check out the{' '}
                    <Link href='https://www.twitch.tv/videos/2370514774' target='_blank'>
                        stream here
                    </Link>
                    . We were also joined by <strong>Fabiano Caruana</strong> in our{' '}
                    <Link href='https://www.twitch.tv/videos/2351536242' target='_blank'>
                        SoCal Fire Relief
                    </Link>{' '}
                    stream!
                </Typography>
                <Stack mt={2} alignItems='center'>
                    <Image
                        src={stream}
                        alt=''
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                </Stack>

                <Typography mt={4}>
                    Patreon and DojoTalks - The Dojo is trying to be more consistent with
                    our podcast, but we need your help! Head over to our{' '}
                    <Link href='https://www.patreon.com/c/ChessDojo' target='_blank'>
                        Patreon
                    </Link>{' '}
                    where you can get episodes early, vote on coming topics, suggest
                    topics and discuss the pod on our private Discord.
                </Typography>

                <Typography mt={4} variant='h5'>
                    Achievements
                </Typography>
                <Typography mt={4}>
                    <Link
                        href='https://www.chessdojo.club/profile/google_115015475367953308508'
                        target='_blank'
                    >
                        KlutchEZ
                    </Link>{' '}
                    played in the Music City Open (Feb. 21-23), their third tournament,
                    competing in the U1800 section as a 1297-rated player. As the
                    lowest-rated participant, they received a bye in Round 1. In the next
                    four rounds, they scored 3/4, finishing tied for 2nd with 4/5 points
                    and winning $500. Their performance earned them 261 rating points,
                    raising their rating from 1297 to 1558.
                </Typography>

                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/google_100232598840877422187'
                        target='_blank'
                    >
                        Shatterednirvana
                    </Link>{' '}
                    beat their first titled player ever! Check out the game{' '}
                    <Link
                        href='https://www.chessdojo.club/games/1600-1700/2025.02.15_3bc5d84f-902e-4e62-900d-5c495bf25a91'
                        target='_blank'
                    >
                        here
                    </Link>
                    .
                </Typography>
                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/google_114391023466287136398'
                        target='_blank'
                    >
                        NoseKnowsAll
                    </Link>{' '}
                    beat a 15 year old NM to cross 2000 USCF. And on top of that, he's the
                    proud father of a new baby girl!
                </Typography>

                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/google_112287737382436689707'
                        target='_blank'
                    >
                        DoesHoodRatStuff
                    </Link>{' '}
                    rebounded from a low classical rating in December by dedicating time
                    to improving their chess. This month, they tied for 1st in the Dojo
                    U1900 Open Classical Tournament and gained over 150 Lichess classical
                    Elo. They scored 9.5/11 in classical tournament games over the past
                    month.
                </Typography>
                <Typography mt={2}>
                    <Link
                        href='https://www.chessdojo.club/profile/fc3f82c5-4cef-47f9-a2f1-47cd47078a35'
                        target='_blank'
                    >
                        AmbushRakshasa
                    </Link>{' '}
                    won his 25th USCF rated classical game, and set a new Elo best of
                    1126, raising his OTB rating 850 points over the course of those 25
                    wins!
                </Typography>

                <DojoAchievements
                    rating='177,568'
                    hours='81,771'
                    points='69,201'
                    graduations='2,561'
                />
                <Footer utmCampaign='digest18' />
            </Stack>
        </Container>
    );
}
