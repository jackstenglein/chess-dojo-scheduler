'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { OpenClassical } from '@/database/tournament';
import LoadingPage from '@/loading/LoadingPage';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    Container,
    Stack,
    Typography,
} from '@mui/material';
import { useEffect } from 'react';

const ListPage = () => {
    const api = useApi();
    const request = useRequest<OpenClassical[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listPreviousOpenClassicals()
                .then((openClassicals) => {
                    console.log('listPreviousOpenClassicals: ', openClassicals);
                    request.onSuccess(openClassicals);
                })
                .catch((err) => {
                    console.error('listPreviousOpenClassicals', err);
                    request.onFailure(err);
                });
        }
    }, [api, request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 5 }}>
            <RequestSnackbar request={request} />
            <Typography variant='h4' gutterBottom textAlign='center'>
                Dojo Open Classical History
            </Typography>

            <Stack spacing={3} mt={4}>
                <Card
                    sx={{
                        maxWidth: 1200,
                        mx: 'auto',
                        border: '2px solid #F7941F',
                        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <CardContent
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}
                    >
                        <Typography variant='h6' component='div'>
                            Current Dojo Open Classical
                        </Typography>
                        <Box display='flex' alignItems='center' mt={1}>
                            <AccessTimeIcon fontSize='small' sx={{ mr: 1 }} />
                            <Typography variant='body2' color='text.secondary'>
                                Ongoing Now
                            </Typography>
                        </Box>
                    </CardContent>
                    <CardActions
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Button
                            size='small'
                            variant='contained'
                            color='primary'
                            href='/tournaments/open-classical'
                            startIcon={<VisibilityIcon />}
                        >
                            View Current
                        </Button>
                    </CardActions>
                </Card>

                {/* Cards for Previous Open Classical */}
                {request.data?.map((openClassical) => (
                    <Card
                        key={openClassical.startsAt}
                        sx={{
                            maxWidth: 1200,
                            mx: 'auto', // Center the card horizontally
                        }}
                    >
                        <CardContent
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant='h6' component='div'>
                                Dojo Open Classical: {openClassical.name}
                            </Typography>
                            <Box display='flex' alignItems='center' mt={1}>
                                <EventIcon fontSize='small' sx={{ mr: 1 }} />
                                <Typography variant='body2' color='text.secondary'>
                                    Started At:{' '}
                                    {new Date(openClassical.startsAt).toLocaleString()}
                                </Typography>
                            </Box>
                        </CardContent>
                        <CardActions
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <Button
                                size='small'
                                variant='contained'
                                color='primary'
                                href={`/tournaments/open-classical?tournament=${openClassical.startsAt}`}
                                startIcon={<VisibilityIcon />}
                            >
                                View More
                            </Button>
                        </CardActions>
                    </Card>
                ))}
            </Stack>
        </Container>
    );
};

export default ListPage;
