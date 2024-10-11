import { RatingSystem, formatRatingSystem } from '@/database/user';
import {
    Card,
    CardContent,
    CardHeader,
    Container,
    Divider,
    Grid2,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import React from 'react';
import HelpItem from './HelpItem';
import SupportTicket from './SupportTicket';

const { Custom, ...ratingSystems } = RatingSystem;

export const faq = {
    title: 'Frequently Asked Questions',
    items: [
        {
            title: 'What is the foundation of the program?',
            content: (
                <>
                    The Dojo Training Program is built around three simple ideas:
                    <ol>
                        <li>
                            We need a structure to guide us and to keep us accountable
                        </li>
                        <li>
                            We need a a coach above us (plus), someone below us to teach
                            (minus), and a cohort to spar with (equal)
                        </li>
                        <li>
                            The most substantive form of chess improvement is the analysis
                            of our own games
                        </li>
                    </ol>
                </>
            ),
        },
        {
            title: 'How does the program work?',
            content: (
                <>
                    We give you a training plan (list of tasks) and a cohort (in Discord)
                    to support your journey. The most important task is to play long games
                    and then analyze them. The work is entirely self-paced, and you should
                    definitely not try to rush it. Yes, you can quickly skim the required
                    reading and check off a box. But you will find much more success if
                    you spend time, by yourself and with your cohort, truly studying the
                    material.
                </>
            ),
        },
        {
            title: 'How often should I study?',
            content: (
                <>
                    You should put in "sweat work" at least three times a week. Sweat work
                    should be hard enough that you feel tired afterward. Examples include
                    playing long games, game analysis, solving difficult exercises, etc.
                    Watching videos, playing blitz, and doing lots of puzzle rush does not
                    count as sweat work!
                </>
            ),
        },
        {
            title: 'Do I have to complete the full training plan to graduate?',
            content: (
                <>
                    We recommend graduating once your rating has crossed the threshold
                    into the next cohort. You do not have to complete all the tasks first.
                </>
            ),
        },
        {
            title: 'What are the classical game requirements?',
            content: (
                <>
                    A core task of the training plan is to play and annotate classical
                    games. The minimum accepted time controls for each rating are as
                    follows:
                    <ul>
                        <li>Under 800: 30+0</li>
                        <li>800-1200: 30+30</li>
                        <li>1200+: 45+30</li>
                        <li>1600+: 60+30</li>
                        <li>2000+: 90+30</li>
                    </ul>
                    Each cohort has a different amount of games to play, but there is no
                    requirement on how often to play them. Many students try to play one
                    classical game per week; some try to play an OTB tournament every 1-2
                    months.
                </>
            ),
        },
        {
            title: 'Are long games really necessary?',
            content: (
                <>
                    Yes – you need to have the competitive pressure of long thinking in a
                    classical game to truly hone your skills, and you need that long game
                    to be able to review it after. It is not possible to review your own
                    deep thinking in a blitz/rapid game.
                </>
            ),
        },
    ],
};

const helpSections = [
    faq,
    {
        title: 'Account',
        items: [
            {
                title: 'I am stuck on the free tier even though I have subscribed',
                content: (
                    <>
                        If you previously subscribed on the{' '}
                        <Link
                            href='https://chessdojo.shop'
                            target='_blank'
                            rel='noopener'
                        >
                            old site
                        </Link>
                        , make sure that you are logging into this site with the same
                        email address. If you are using the same address and still cannot
                        access paid content, please submit a help ticket below.
                    </>
                ),
            },
            {
                title: `I want to sign up but don't have a rating`,
                content: (
                    <>
                        The Dojo currently requires that you have a rating when you sign
                        up. This allows us to determine which cohort you should be placed
                        in. Your rating can be provisional, but must be from one of the
                        currently supported systems:
                        <ul>
                            {Object.values(ratingSystems).map((rs) => (
                                <li key={rs}>{formatRatingSystem(rs)}</li>
                            ))}
                        </ul>
                        If you currently don't have a rating in any of these systems, we
                        recommend creating an account on Chess.com or Lichess and playing
                        a few games. It's free and you will want an account for sparring
                        anyway.
                    </>
                ),
            },
        ],
    },
];

const UnauthenticatedHelp = () => {
    const scrollToId = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();

        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView();
        }
    };

    return (
        <Container maxWidth='xl' sx={{ py: 4 }}>
            <Grid2 container columnSpacing={4}>
                <Grid2
                    sx={{ display: { xs: 'none', md: 'initial' } }}
                    size={{
                        md: 3,
                    }}
                >
                    <Card
                        variant='outlined'
                        sx={{
                            '--margin': '32px',
                            position: 'sticky',
                            top: 'calc(var(--navbar-height) + var(--margin))',
                            overflowY: 'auto',
                            maxHeight:
                                'calc(100vh - var(--navbar-height) - 2 * var(--margin))',
                        }}
                    >
                        <CardHeader title='Table of Contents' />
                        <CardContent>
                            <Stack>
                                {helpSections.map((section) => (
                                    <React.Fragment key={section.title}>
                                        <Link
                                            href={`#${section.title}`}
                                            onClick={(e) => scrollToId(e, section.title)}
                                        >
                                            {section.title}
                                        </Link>
                                        <ul style={{ marginTop: 0 }}>
                                            {section.items.map((item) => (
                                                <li key={item.title}>
                                                    <Link
                                                        href={`#${item.title}`}
                                                        onClick={(e) =>
                                                            scrollToId(e, item.title)
                                                        }
                                                    >
                                                        {item.title}
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </React.Fragment>
                                ))}
                                <Link
                                    href='#support-ticket'
                                    onClick={(e) => scrollToId(e, 'support-ticket')}
                                >
                                    Open a Support Ticket
                                </Link>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid2>

                <Grid2
                    id='scroll-parent'
                    size={{
                        md: 9,
                    }}
                >
                    <Stack spacing={5}>
                        <Stack>
                            <Typography variant='h4'>Help/FAQs</Typography>
                            <Divider />
                            <Typography variant='body1' mt={3}>
                                If you have trouble using the site, please check this
                                section before asking for help. If your issue is not
                                listed here or is not solved by the advice here, then
                                create a support ticket below.
                            </Typography>
                        </Stack>

                        {helpSections.map((section) => (
                            <Stack
                                key={section.title}
                                id={section.title}
                                sx={{
                                    scrollMarginTop: 'calc(var(--navbar-height) + 8px)',
                                }}
                            >
                                <Typography variant='h5'>{section.title}</Typography>
                                <Divider />

                                <Stack spacing={3} mt={3}>
                                    {section.items.map((item) => (
                                        <HelpItem key={item.title} title={item.title}>
                                            {item.content}
                                        </HelpItem>
                                    ))}
                                </Stack>
                            </Stack>
                        ))}

                        <SupportTicket />
                    </Stack>
                </Grid2>
            </Grid2>
        </Container>
    );
};

export default UnauthenticatedHelp;
