'use client';

import { CheckCircleOutline } from '@mui/icons-material';
import { TabContext, TabPanel } from '@mui/lab';
import {
    Box,
    Card,
    CardContent,
    Divider,
    Stack,
    Tab,
    Tabs,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { useState } from 'react';

interface TabData {
    title: JSX.Element;
    points: string[];
    images: string[];
}

const tabData: Record<string, TabData> = {
    plan: {
        title: (
            <Typography variant='h4'>
                <Typography variant='h4' color='dojoOrange.main' component='span'>
                    Training&nbsp;plans
                </Typography>
                &nbsp;for all&nbsp;players&nbsp;0-2500
            </Typography>
        ),
        points: [
            'Custom-made plans for every 100-point rating range (500-600, 900-1000, 1400-1500, etc)',
            'Hand-picked books and games that will teach you important concepts to reach the next level',
            'Opening guides and repertoires with puzzles, model games and key positions',
            'Middlegame and endgame sparring positions to hone your skills',
        ],
        images: [
            'https://chess-dojo-images.s3.amazonaws.com/landing-page/training-plan.png',
        ],
    },
    games: {
        title: (
            <Typography variant='h4'>
                Contribute to a database of{' '}
                <Typography variant='h4' color='dojoOrange.main' component='span'>
                    annotated&nbsp;games
                </Typography>
            </Typography>
        ),
        points: [
            'Database of annotated games submitted by other members of the Dojo',
            'Search by cohort, player or position',
            'Analyze your own games and receive comments from higher-rated players',
            `Get insights into how you're using your time in games`,
        ],
        images: [
            'https://chess-dojo-images.s3.amazonaws.com/landing-page/game-clock.png',
        ],
    },
    scoreboard: {
        title: (
            <Typography variant='h4'>
                Group&nbsp;
                <Typography variant='h4' color='dojoOrange.main' component='span'>
                    scoreboard
                </Typography>
                &nbsp;to track&nbsp;your&nbsp;progress
            </Typography>
        ),
        points: [
            'Custom platform for tracking your progress and time spent on the program',
            'Keep yourself accountable by working alongside your peers in your cohort',
            'Gamify your chess improvement and reach the top of the leaderboards',
        ],
        images: [
            'https://chess-dojo-images.s3.amazonaws.com/landing-page/scoreboard.png',
        ],
    },
    community: {
        title: (
            <Typography variant='h4'>
                A&nbsp;
                <Typography variant='h4' color='dojoOrange.main' component='span'>
                    community
                </Typography>
                &nbsp;to&nbsp;help you&nbsp;reach&nbsp;the&nbsp;next level
            </Typography>
        ),
        points: [
            'Vibrant Discord community to work and grow with',
            'Find training partners at all levels (and timezones!)',
            'Book study groups, sparring sessions and training games with the shared group calendar',
        ],
        images: ['https://chess-dojo-images.s3.amazonaws.com/landing-page/calendar.png'],
    },
    support: {
        title: (
            <Typography variant='h4'>
                Get support from the{' '}
                <Typography variant='h4' color='dojoOrange.main' component='span'>
                    teachers
                </Typography>{' '}
                on your journey
            </Typography>
        ),
        points: [
            'Ask questions directly to the senseis: GM Jesse Kraai, IM David Pruess and IM Kostya Kavutskiy',
            'Get your games reviewed on stream when you graduate to the next level',
        ],
        images: ['https://chess-dojo-images.s3.amazonaws.com/landing-page/support.png'],
    },
};

const WhatsIncluded = () => {
    const [value, setValue] = useState('plan');

    return (
        <Stack width={1} justifyContent='center' alignItems='center'>
            <Typography variant='h2' textAlign='center' mb={5}>
                See what's included
            </Typography>

            <Box width='100%'>
                <TabContext value={value}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            borderBottom: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Tabs
                            data-cy='whatsincluded-tab-list'
                            value={value}
                            onChange={(_, t: string) => setValue(t)}
                            variant='scrollable'
                            sx={{ justifyContent: 'center' }}
                        >
                            <Tab label='Training Plan' value='plan' />
                            <Tab label='Game Database' value='games' />
                            <Tab label='Scoreboard' value='scoreboard' />
                            <Tab label='Community' value='community' />
                            <Tab label='Teacher Support' value='support' />
                        </Tabs>
                    </Box>

                    {Object.entries(tabData).map(([name, data], i) => (
                        <TabPanel key={name} value={name} sx={{ width: 1 }}>
                            <Card>
                                <CardContent>
                                    <Grid2
                                        container
                                        columnSpacing={{ xs: 1, md: 2, xl: 3 }}
                                        rowGap={2}
                                    >
                                        <Grid2 xs={12} md={6}>
                                            {data.title}

                                            <Divider sx={{ mt: 1, mb: 3 }} />

                                            <BulletPoints points={data.points} />
                                        </Grid2>
                                        <Grid2 xs={12} md={6} alignSelf='center'>
                                            <Stack>
                                                {data.images.map((image) => (
                                                    <img
                                                        key={image}
                                                        src={image}
                                                        style={{
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            borderRadius: '4px',
                                                        }}
                                                        alt=''
                                                        loading={
                                                            i === 0 ? 'eager' : 'lazy'
                                                        }
                                                    />
                                                ))}
                                            </Stack>
                                        </Grid2>
                                    </Grid2>
                                </CardContent>
                            </Card>
                        </TabPanel>
                    ))}
                </TabContext>
            </Box>
        </Stack>
    );
};

export default WhatsIncluded;

function BulletPoints({ points }: { points: string[] }) {
    return (
        <Stack spacing={2}>
            {points.map((p) => (
                <Stack
                    key={p}
                    direction='row'
                    spacing={1}
                    justifyContent='top'
                    alignItems='start'
                    position='relative'
                >
                    <CheckCircleOutline
                        color='success'
                        sx={{ position: 'relative', top: '2px' }}
                    />
                    <Typography variant='h6'>{p}</Typography>
                </Stack>
            ))}
        </Stack>
    );
}
