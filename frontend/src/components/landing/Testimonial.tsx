import CohortIcon from '@/scoreboard/CohortIcon';
import { fontFamily } from '@/style/font';
import { ChevronLeft, ChevronRight, Circle } from '@mui/icons-material';
import { Grid, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import Image from 'next/image';
import { Children, ReactNode, useEffect, useState } from 'react';
import { BackgroundImageContainer } from './BackgroundImage';
import { anton, barlow, barlowCondensed } from './fonts';
import { JoinDojoButton } from './JoinDojoButton';
import quoteImage from './quote.webp';
import backgroundImage from './testimonial-background.webp';
import { TestimonialProps, testimonials } from './testimonials';

export function TestimonialSection() {
    const isSm = useMediaQuery((theme) => theme.breakpoints.down('md'));

    return (
        <BackgroundImageContainer
            src={backgroundImage}
            background='linear-gradient(270deg, #141422 0%, #06060B 100%)'
            slotProps={{ image: { style: { opacity: 0.3 } } }}
        >
            <Stack gap='1rem' alignItems='center'>
                <Typography
                    textAlign='center'
                    fontFamily={(theme) => fontFamily(theme, anton)}
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
                    textAlign='center'
                >
                    Hear from our members
                </Typography>
            </Stack>

            <Stack direction='row' mt='3.125rem'>
                {isSm ? (
                    <Carousel>
                        {testimonials.map((t) => (
                            <Testimonial key={t.name} {...t} />
                        ))}
                    </Carousel>
                ) : (
                    <Grid container spacing='2rem'>
                        {testimonials.map((t) => (
                            <Grid size={3} key={t.name} height={1}>
                                <Testimonial {...t} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Stack>

            <Stack alignItems='center' mt='3rem'>
                <JoinDojoButton />
            </Stack>
        </BackgroundImageContainer>
    );
}

function Testimonial({ quote, name, rating, cohort }: TestimonialProps) {
    return (
        <Stack
            sx={{
                padding: '1.25rem',
                background: 'linear-gradient(180deg, #1B1B2C 0%, #06060B 100%)',
                minHeight: '23.125rem',
                justifyContent: 'space-between',
                borderRadius: 1,
                gap: '1.5rem',
                height: 1,
            }}
        >
            <Image src={quoteImage} alt='' style={{ width: '2.3125rem', height: '2.3125rem' }} />

            <Typography
                sx={{
                    fontFamily: (theme) => fontFamily(theme, barlow),
                    fontSize: '1.0625rem',
                    lineHeight: '1.75rem',
                }}
            >
                {quote}
            </Typography>

            <Stack direction='row' columnGap='0.625rem'>
                <CohortIcon cohort={cohort} tooltip='' />

                <Stack gap={0.75}>
                    <Typography
                        sx={{
                            fontFamily: (theme) => fontFamily(theme, barlowCondensed),
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
        </Stack>
    );
}

function Carousel({ children }: { children: Iterable<ReactNode> }) {
    const [index, setIndex] = useState(0);

    const count = Children.count(children);

    const onPrev = () => {
        if (index === 0) {
            setIndex(count - 1);
        } else {
            setIndex(index - 1);
        }
    };

    const onNext = () => {
        if (index === count - 1) {
            setIndex(0);
        } else {
            setIndex(index + 1);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            onNext();
        }, 10 * 1000);
        return () => clearInterval(intervalId);
    }, [onNext]);

    return (
        <Stack>
            {Children.toArray(children)[index]}
            <Stack direction='row' justifyContent='space-between' alignItems='center'>
                <IconButton size='large' onClick={onPrev}>
                    <ChevronLeft fontSize='large' />
                </IconButton>

                <Stack direction='row' gap={0.5} alignItems='center'>
                    {Array.from({ length: count }).map((_, i) => (
                        <Circle
                            key={i}
                            onClick={() => setIndex(i)}
                            sx={{
                                height: '10px',
                                width: '10px',
                                color: i === index ? 'rgb(73, 73, 73)' : 'rgb(175, 175, 175)',
                                cursor: 'pointer',
                            }}
                        />
                    ))}
                </Stack>

                <IconButton size='large' onClick={onNext}>
                    <ChevronRight fontSize='large' />
                </IconButton>
            </Stack>
        </Stack>
    );
}
