import { Card, CardContent, CardMedia, Grid2, Stack, Typography } from '@mui/material';

const senseis = [
    {
        name: 'Jesse Kraai',
        title: 'Grandmaster',
        description:
            'GM Kraai has been playing and teaching chess since before you were born. Playing in seven US championships helped him elevate his game to GM in 2007. He won the Denker tournament of High School Champions in 1989 and 1990 and the Irwin tournament of Senior Champions in 2023. He is currently using the Dojo Training Program with the dream of winning the US Senior Closed in 2024.',
        image: 'https://chess-dojo-images.s3.amazonaws.com/landing-page/Jesse+Presentation_edited.webp',
    },
    {
        name: 'Kostya Kavutskiy',
        title: 'International Master',
        description:
            'Kostya comes from a Ukrainian chess family and has been playing and teaching the game since he was a pup. Since attaining the IM title in 2016, he has struggled to find the time for his own study while also coaching. He is a FIDE trainer and has coached at the World Youth and Pan-American Youth Championships, earning several gold medals for the US national team. Like many of us he needs a structure and a plan! Kostya is committed to following the Dojo Training Program to the GM title, and we are rooting for him!',
        image: 'https://chess-dojo-images.s3.amazonaws.com/landing-page/Kostya+Board_edited.webp',
    },
    {
        name: 'David Pruess',
        title: 'International Master',
        description:
            'David is a chess maximalist, never shying away from what he believes is the most principled path forward. With this madman approach, he attained the rank of International Master in 2003 and then in 2006 he won the prestigious Samford Chess Fellowship. He has all three Grandmaster norms and just needs to cross 2500 to reach the title. David helped design the ChessDojo Training Program with the dream that he could cross that difficult 2500 barrier using its guidance and structure.',
        image: 'https://chess-dojo-images.s3.amazonaws.com/landing-page/David+Pruess_edited.webp',
    },
];

const Sensei = () => {
    return (
        <Stack width={1} alignItems='center' mt={3}>
            <Typography variant='h2' textAlign='center'>
                ChessDojo{' '}
                <Typography variant='h2' color='dojoOrange.main' component='span'>
                    Sensei
                </Typography>
            </Typography>
            <Typography variant='h4' mb={3} textAlign='center'>
                World-class teachers who have been in your shoes
            </Typography>
            <Grid2 container sx={{ width: 1 }} rowGap={2} columnSpacing={3} justifyContent='center'>
                {senseis.map((sensei) => (
                    <Grid2
                        key={sensei.name}
                        size={{
                            xs: 12,
                            sm: 4,
                            lg: 3,
                        }}
                    >
                        <Card sx={{ height: 1 }}>
                            <CardMedia
                                component='img'
                                image={sensei.image}
                                sx={{ aspectRatio: 1 }}
                                loading='lazy'
                                crossOrigin='anonymous'
                                alt=''
                            />
                            <CardContent>
                                <Typography variant='h5'>{sensei.name}</Typography>
                                <Typography variant='subtitle1' gutterBottom>
                                    {sensei.title}
                                </Typography>
                                <Typography color='text.secondary'>{sensei.description}</Typography>
                            </CardContent>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
        </Stack>
    );
};

export default Sensei;
