import { Container, Stack, Typography } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import { useEffect } from 'react';

import Avatar from '../Avatar';
import { useRequest } from '../../api/Request';
import { YearReview } from '../../database/yearReview';
import { getYearReview } from '../../api/yearReviewApi';
import LoadingPage from '../../loading/LoadingPage';
import NotFoundPage from '../../NotFoundPage';
import RatingsSection from './ratings/RatingsSection';
import GraduationSection from './GraduationSection';

export interface SectionProps {
    review: YearReview;
}

type YearReviewPageParams = {
    username: string;
    year: string;
};

const YearReviewPage = () => {
    const { username, year } = useParams<YearReviewPageParams>();
    const request = useRequest<YearReview>();

    useEffect(() => {
        if (username && year && !request.isSent()) {
            request.onStart();
            getYearReview(username, year)
                .then((resp) => {
                    console.log('getYearReview: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error('getYearReview: ', err);
                    request.onFailure(err);
                });
        }
    });

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const review = request.data;
    if (!review) {
        return <NotFoundPage />;
    }

    return (
        <Container maxWidth='xl'>
            <Stack
                justifyContent='space-between'
                height='calc(100vh - var(--navbar-height))'
                py={4}
            >
                <Stack>
                    <Stack
                        direction='row'
                        spacing={{
                            xs: 2,
                            md: 4,
                        }}
                        mb={3}
                        justifyContent={{
                            xs: 'center',
                            md: 'start',
                        }}
                        alignItems='center'
                        fontSize={{
                            xs: '11vw',
                            sm: 'clamp(30px,7vw,8em)',
                        }}
                    >
                        <Avatar
                            username={username}
                            displayName={review.displayName}
                            size={{
                                xs: 'clamp(48px,7vw,96px)',
                            }}
                        />
                        <Typography
                            variant='h2'
                            fontWeight='800'
                            color='dojoOrange.main'
                            sx={{
                                fontSize: '0.75em',
                                lineHeight: 'clamp(36px,7.3vw,.9em)',
                            }}
                        >
                            {review.displayName}'s
                        </Typography>
                    </Stack>

                    <Typography
                        variant='h1'
                        sx={{
                            fontWeight: 800,
                            fontSize: {
                                xs: '11vw',
                                sm: 'clamp(30px,7vw,8em)',
                            },
                            lineHeight: {
                                xs: '1em',
                                sm: 'clamp(36px,7.3vw,.9em)',
                            },
                            textAlign: {
                                xs: 'center',
                                md: 'start',
                            },
                        }}
                    >
                        Dojo Year in Review{'\n'}
                        {review.period}
                    </Typography>
                </Stack>

                <Stack alignItems='center' mt={5}>
                    <Typography
                        variant='h6'
                        fontWeight='800'
                        fontSize='clamp(24px,3vw,40px)'
                        textAlign='center'
                    >
                        Let's take a look at your progress over the past year!
                    </Typography>
                </Stack>

                <ExpandMore
                    sx={{
                        alignSelf: 'center',
                        fontSize: 'clamp(30px,6vw,7em)',
                    }}
                />
            </Stack>

            <Stack maxWidth='md' spacing={5} sx={{ pb: 4, margin: 'auto' }}>
                <RatingsSection review={review} />
                <GraduationSection review={review} />
            </Stack>
        </Container>
    );
};

export default YearReviewPage;
