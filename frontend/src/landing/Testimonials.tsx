'use client';

import {
    Card,
    CardContent,
    Stack,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import Carousel from 'react-material-ui-carousel';

const testimonials = [
    {
        name: 'PepperChess',
        rating: '1011 Chess.com',
        quote: `The Dojo has single-handedly been the best thing to happen for my chess. I was stuck in the mid 700s on chess.com and showing little improvement. However, in a short time, I managed to break the 1k club. None of this would have been possible without the Dojo's program.`,
    },
    {
        name: 'Benwick',
        rating: '1400 ECF',
        quote: 'This program is really helping me treat chess with respect. Meaning that I approach each task with more reverence and more focus, which I am sure is leading to better results and a more consistent mindset.',
    },
    {
        name: 'LaurentS',
        rating: '1950 FIDE',
        quote: `After 1 year, I'm very happy about the program. I think it's very well designed with the emphasis on long games and analysis for long-term progress. The positive environment has motivated me to work regularly on my chess this year, and I could feel my progress.`,
    },
    {
        name: 'Southernrun',
        rating: '792 Chess.com',
        quote: `The program details have helped me filter out so much of what is available to learn from and to drill down on what is needed. Focusing on the fundamentals at my level has been very helpful.`,
    },
    {
        name: 'Dawson Boyd',
        rating: '1750 Chess.com',
        quote: `Climbed from 1600 to 1750 Chess.com. I truly feel like the hard work is paying off. I've won several games during the climb that I think I would have otherwise lost had I not studied.`,
    },
    {
        name: 'BuckDuck',
        rating: '2070 FIDE',
        quote: `The endgame sparring is put together with great care. There's a good selection of training positions, and this was very educational to see which rook endgames one knew by heart and where one struggled.`,
    },
    {
        name: 'Tom',
        rating: '850 Chess.com',
        quote: `I joined the Dojo about a year ago and gained a little over 500 rating points on chess.com. ChessDojo is a great program that points you in the right direction. If you do what they recommend and put in the time, you will improve!`,
    },
    {
        name: 'quad-exe',
        rating: '1445 Chess.com',
        quote: `I was struggling to get above 1300 when I found the Dojo, and now I am just laughing at 1400s and their timid superficial plans and little tricks.`,
    },
    {
        name: 'NoseKnowsAll',
        rating: '2280 Chess.com',
        quote: `Huge fan of the program! Working on my classical chess has been so much more rewarding than improving at blitz. I've also had time to play a decent amount of OTB games this year for the first time in my life and have gained more than 200 points since joining the Dojo.`,
    },
    {
        name: 'AmbushRakshasa',
        rating: '738 Chess.com',
        quote: `The biggest benefit of the training program for me is the Dojo community. I've met other Dojo members at my home club, and it's fun to prep with and root for them during tournaments. Thanks to Jesse, Kostya and David for creating this thing, and to everyone in the Dojo for showing up day in-day out.`,
    },
    {
        name: 'Chuckleton',
        rating: '1438 Lichess',
        quote: `I love the program and feel like it's sharpening my chess every day that I put in the time against the program. Thank you to the senseis for building this! It's making chess less frustrating and more systematic for me for sure.`,
    },
    {
        name: 'Lucasimnida',
        rating: '1619 Lichess',
        quote: `The first month in this program has given me a great roadmap to transition away from being a purely online rapid player and toward playing longer and thinking deeper in a way that is already more rewarding. I look forward to continuing on!`,
    },
];

const Testimonials = () => {
    const theme = useTheme();
    const isSm = useMediaQuery(theme.breakpoints.up('sm'));
    const isLg = useMediaQuery(theme.breakpoints.up('lg'));
    const quotesPerSlide = isSm ? 3 : 1;

    const items = [];
    for (let i = 0; i < testimonials.length; i += quotesPerSlide) {
        items.push(
            <Grid2 key={i} container columnSpacing={3} justifyContent='center'>
                {testimonials.slice(i, i + quotesPerSlide).map((t) => (
                    <Grid2 key={t.name} xs={10} sm={4} lg={3}>
                        <Card sx={{ height: 1 }}>
                            <CardContent>
                                <Typography variant='h5'>{t.name}</Typography>
                                <Typography variant='subtitle1' gutterBottom>
                                    {t.rating}
                                </Typography>
                                <Typography color='text.secondary'>{t.quote}</Typography>
                            </CardContent>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>,
        );
    }

    return (
        <Stack width={1} alignItems='center' mt={5} textAlign='center'>
            <Typography variant='h2'>
                What our{' '}
                <Typography variant='h2' color='dojoOrange.main' component='span'>
                    users
                </Typography>
                &nbsp;say
            </Typography>

            <Carousel
                sx={{ width: 1, mt: 1 }}
                animation='slide'
                duration={700}
                interval={10 * 1000}
                navButtonsAlwaysVisible={isLg}
            >
                {items}
            </Carousel>
        </Stack>
    );
};

export default Testimonials;
