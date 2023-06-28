import { useEffect, useMemo } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Grid,
    Stack,
    Typography,
} from '@mui/material';
import { Link, useParams, useSearchParams } from 'react-router-dom';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Opening } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';
import Module from './Module';
import NotFoundPage from '../../NotFoundPage';

type OpeningPageParams = {
    id: string;
    levelName: string;
};

const OpeningPage = () => {
    const api = useApi();
    const params = useParams<OpeningPageParams>();
    const request = useRequest<Opening>();
    const [searchParams, setSearchParams] = useSearchParams({ module: '0' });

    useEffect(() => {
        if (!request.isSent() && params.id) {
            request.onStart();
            api.getOpening(params.id)
                .then((resp) => {
                    request.onSuccess(resp.data);
                    console.log('getOpening: ', resp);
                })
                .catch((err) => {
                    request.onFailure(err);
                    console.error('getOpening: ', err);
                });
        }
    }, [request, api, params]);

    const openingLevel = useMemo(() => {
        return request.data?.levels.find(
            (l) => l.name.toLowerCase() === params.levelName?.toLowerCase()
        );
    }, [request, params.levelName]);

    const moduleIndex = parseInt(searchParams.get('module') || '0');
    const module = useMemo(() => {
        if (
            openingLevel &&
            moduleIndex >= 0 &&
            moduleIndex < openingLevel.modules.length
        ) {
            return openingLevel.modules[moduleIndex];
        }
    }, [openingLevel, moduleIndex]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (request.data && openingLevel === undefined) {
        return <NotFoundPage />;
    }

    return (
        <Container maxWidth='xl' sx={{ pt: 6, pb: 4 }}>
            {openingLevel && (
                <Grid container rowGap={2}>
                    <Grid item xs={12} sm={12} md={9.5}>
                        <Stack>
                            <Typography variant='h4'>{request.data!.name}</Typography>
                            <Typography variant='h5' color='text.secondary'>
                                {openingLevel.name} ({openingLevel.cohortRange})
                            </Typography>
                            <Divider />

                            {module && (
                                <Box mt={2}>
                                    <Module module={module} />
                                </Box>
                            )}
                        </Stack>
                    </Grid>

                    <Grid item xs={12} sm={12} md={2.5}>
                        <Card variant='outlined'>
                            <CardContent>
                                <Typography>
                                    {request.data!.name} - Table of Contents
                                </Typography>
                                <ul style={{ paddingLeft: '16px' }}>
                                    <li>
                                        {openingLevel.name} ({openingLevel.cohortRange})
                                        <ol>
                                            {openingLevel.modules.map((m, idx) => (
                                                <Link key={m.name} to={`?module=${idx}`}>
                                                    <li>{m.name}</li>
                                                </Link>
                                            ))}
                                        </ol>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={12}>
                        <Stack direction='row' justifyContent='space-between' mt={4}>
                            {moduleIndex > 0 &&
                                moduleIndex < openingLevel.modules.length && (
                                    <Button
                                        variant='contained'
                                        onClick={() =>
                                            setSearchParams({
                                                module: `${moduleIndex - 1}`,
                                            })
                                        }
                                    >
                                        Previous:{' '}
                                        {openingLevel.modules[moduleIndex - 1].name}
                                    </Button>
                                )}

                            {moduleIndex >= 0 &&
                                moduleIndex + 1 < openingLevel.modules.length && (
                                    <Button
                                        variant='contained'
                                        onClick={() =>
                                            setSearchParams({
                                                module: `${moduleIndex + 1}`,
                                            })
                                        }
                                    >
                                        Next: {openingLevel.modules[moduleIndex + 1].name}
                                    </Button>
                                )}
                        </Stack>
                    </Grid>
                </Grid>
            )}

            <RequestSnackbar request={request} />
        </Container>
    );
};

export default OpeningPage;
