import { Box, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import Image from 'next/image';
import davidImage from './david.webp';
import { barlow, barlowCondensed } from './fonts';
import jesseImage from './jesse.webp';
import kostyaImage from './kostya.webp';

export function Senseis() {
    return (
        <Container maxWidth='lg' sx={{ py: '5.5rem' }}>
            <Grid container spacing='2rem'>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack
                        sx={{
                            gap: '1.5rem',
                            position: { xs: 'unset', md: 'sticky' },
                            top: 'calc(var(--navbar-height) + 1rem)',
                            mb: { xs: 2, md: 0 },
                        }}
                    >
                        <Typography
                            sx={{
                                fontSize: '3rem',
                                lineHeight: '3.375rem',
                                fontFamily: barlowCondensed.style.fontFamily,
                                fontWeight: '500',
                            }}
                        >
                            The Senseis
                        </Typography>

                        <Divider
                            sx={{
                                height: '3px',
                                background:
                                    'linear-gradient(90deg, var(--mui-palette-darkBlue-main) 0%, var(--mui-palette-darkBlue-light) 100%)',
                                width: 0.37,
                            }}
                        />

                        <Typography
                            sx={{
                                fontFamily: barlow.style.fontFamily,
                                fontSize: '1.5rem',
                                lineHeight: '2.125rem',
                            }}
                        >
                            Led by world class chess trainers, ChessDojo has been meticulously
                            crafted to improve players of any level
                        </Typography>
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Stack gap='3.75rem'>
                        {senseis.map((s) => (
                            <Sensei key={s.name} {...s} />
                        ))}
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
}

function Sensei({
    image,
    title,
    name,
    bio,
}: {
    image: string;
    title: string;
    name: string;
    bio: string;
}) {
    return (
        <Box
            sx={{
                display: 'grid',
                columnGap: '1.5625rem',
                gridTemplateColumns: {
                    xs: 'auto 1fr',
                },
                gridTemplateAreas: {
                    xs: `"image name"
                         "bio bio"`,
                    md: `"image name"
                         "image bio"`,
                },
            }}
        >
            <Image
                src={image}
                alt=''
                style={{
                    width: '9.375rem',
                    height: '9.375rem',
                    borderRadius: '50%',
                    gridArea: 'image',
                }}
            />

            <Stack gridArea='name' justifyContent={{ xs: 'center', md: 'unset' }}>
                <Typography
                    color='darkBlue'
                    sx={{
                        fontWeight: '700',
                        fontSize: '0.9375rem',
                        lineHeight: '1.375rem',
                        letterSpacing: '10%',
                        textTransform: 'uppercase',
                    }}
                >
                    {title}
                </Typography>
                <Typography
                    sx={{
                        fontFamily: barlowCondensed.style.fontFamily,
                        fontWeight: '500',
                        fontSize: '2.625rem',
                        lineHeight: '2.625rem',
                        letterSpacing: '0%',
                        marginTop: '0.3125rem',
                    }}
                >
                    {name}
                </Typography>
            </Stack>

            <Typography
                gridArea='bio'
                sx={{
                    fontFmaily: barlow.style.fontFamily,
                    fontWeight: '400',
                    fontSize: '1.1875rem',
                    lineHeight: '1.9375rem',
                    letterSpacing: '0%',
                    marginTop: '0.9375rem',
                }}
            >
                {bio}
            </Typography>
        </Box>
    );
}

const senseis = [
    {
        image: jesseImage,
        title: 'Grandmaster',
        name: 'Jesse Kraai',
        bio: `GM Kraai has been playing and teaching chess since before you were born. Playing in seven US championships helped him elevate his game to GM in 2007. He won the Denker tournament of High School Champions in 1989 and 1990 and the Irwin tournament of Senior Champions in 2023. He is currently using the Dojo Training Program with the dream of winning the US Senior Closed in 2024.`,
    },
    {
        image: kostyaImage,
        title: 'International Master',
        name: 'Kostya Kavutskiy',
        bio: `Kostya comes from a Ukrainian chess family and has been playing and  teaching the game since he was a pup. Since attaining the IM title in 2016, he has struggled to find the time for his own study while also coaching. He is a FIDE trainer and has coached at the World Youth and Pan-American Youth Championships, earning several gold medals for the US national team. Like many of us he needs a structure and a plan! Kostya is committed to following the Dojo Training Program to the GM title, and we are rooting for him!`,
    },
    {
        image: davidImage,
        title: 'International Master',
        name: 'David Pruess',
        bio: `David is a  chess maximalist, never shying away from what he believes is the most principled path forward. With this madman approach, he attained the rank of International Master in 2003 and then in 2006 he won the prestigious Samford Chess Fellowship. He has all three Grandmaster norms and just needs to cross 2500 to reach the title. David helped design the ChessDojo Training Program with the dream that he could cross that difficult 2500 barrier using its guidance and structure.`,
    },
];
