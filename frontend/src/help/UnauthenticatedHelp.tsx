import {
    Card,
    CardContent,
    CardHeader,
    Container,
    Divider,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { RatingSystem, formatRatingSystem } from '../database/user';
import HelpItem from './HelpItem';
import SupportTicket from './SupportTicket';

const { Custom, ...ratingSystems } = RatingSystem;

const helpSections = [
    {
        title: 'Account',
        items: [
            {
                title: 'I am stuck on the free tier even though I have subscribed',
                content: (
                    <>
                        If you previously subscribed on the{' '}
                        <Link
                            component={RouterLink}
                            to='https://chessdojo.shop'
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
                <Grid2 md={3} sx={{ display: { xs: 'none', md: 'initial' } }}>
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

                <Grid2 id='scroll-parent' md={9}>
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
