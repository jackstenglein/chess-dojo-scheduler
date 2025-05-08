import { Button, Grid, Stack, Typography } from '@mui/material';
import { Link } from '../navigation/Link';
import backgroundImage from './background.jpg';
import { BackgroundImageContainer } from './BackgroundImage';
import { anton, barlow, barlowCondensed } from './fonts';
import { TestimonialProps, testimonials } from './testimonials';

export function TestimonialSection() {
    return (
        <BackgroundImageContainer
            src={backgroundImage}
            background='linear-gradient(270deg, #141422 0%, #06060B 100%)'
        >
            <Stack gap='1rem' alignItems='center'>
                <Typography
                    textAlign='center'
                    fontFamily={anton.style.fontFamily}
                    lineHeight='4.625rem'
                    fontSize='3.75rem'
                >
                    Our program has a proven
                    <br />
                    track record of success
                </Typography>
                <Typography
                    sx={{ textTransform: 'uppercase' }}
                    color='dojoOrange'
                    fontWeight='600'
                    fontSize='1.1875rem'
                    lineHeight='2.125rem'
                    letterSpacing='11%'
                >
                    Here are some of our success stories
                </Typography>
            </Stack>

            <Stack direction='row' mt='3.125rem'>
                <Grid container spacing='2rem'>
                    {testimonials.map((t) => (
                        <Grid size={3} key={t.name} height={1}>
                            <Testimonial {...t} />
                        </Grid>
                    ))}
                </Grid>
            </Stack>

            <Stack alignItems='center' mt='3rem'>
                <Button
                    variant='contained'
                    component={Link}
                    href='/signup'
                    sx={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        py: 1.5,
                        px: 2.5,
                        mt: 3,
                    }}
                    color='dojoOrange'
                >
                    Join the Dojo
                </Button>
            </Stack>
        </BackgroundImageContainer>
    );
}

function Testimonial({ quote, name, rating }: TestimonialProps) {
    return (
        <Stack
            sx={{
                padding: 2.5,
                background: 'linear-gradient(180deg, #1B1B2C 0%, #06060B 100%)',
                minHeight: '23.125rem',
                justifyContent: 'space-between',
                borderRadius: 0.5,
                gap: '1.5rem',
                height: 1,
            }}
        >
            <Typography
                sx={{
                    fontFamily: barlow.style.fontFamily,
                    fontSize: '1.0625rem',
                    lineHeight: '1.75rem',
                }}
            >
                {quote}
            </Typography>

            <Stack gap={0.75}>
                <Typography
                    sx={{
                        fontFamily: barlowCondensed.style.fontFamily,
                        fontWeight: '600',
                        fontSize: '1.3125rem',
                        lineHeight: '1.3125rem',
                    }}
                >
                    {name}
                </Typography>
                <Typography
                    sx={{
                        fontSize: '0.8125rem',
                        fontWeight: '700',
                        letterSpacing: '8%',
                        textTransform: 'uppercase',
                    }}
                    color='dojoOrange'
                >
                    {rating}
                </Typography>
            </Stack>
        </Stack>
    );
}
