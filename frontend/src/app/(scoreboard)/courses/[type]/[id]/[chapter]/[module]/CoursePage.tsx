'use client';

import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { GetCourseResponse } from '@/api/courseApi';
import { AuthStatus, useAuth, useFreeTier } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import { Course } from '@/database/course';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import { Alert, Box, Button, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { getCheckoutSessionId, setCheckoutSessionId } from '../../../../localStorage';
import Contents from './Contents';
import Module from './Module';
import PurchaseCoursePage from './PurchaseCoursePage';

export const CoursePage = ({
    params,
}: {
    params: { type: string; id: string; chapter?: string; module?: string };
}) => {
    const auth = useAuth();
    const anonymousUser = auth.user === undefined;
    const isFreeTier = useFreeTier();
    const api = useApi();
    const request = useRequest<GetCourseResponse>();

    const { searchParams } = useNextSearchParams();
    const [checkoutId, setCheckoutId] = useState(searchParams.get('checkout') || '');

    useEffect(() => {
        setCheckoutId(getCheckoutSessionId(params.id));
    }, [setCheckoutId, params.id]);

    useEffect(() => {
        if (!request.isSent() && auth.status !== AuthStatus.Loading && params.type && params.id) {
            request.onStart();
            api.getCourse(params.type, params.id, checkoutId)
                .then((resp) => {
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    request.onFailure(err);
                    console.error('getCourse: ', err);
                });
        }
    }, [request, api, params, checkoutId, auth.status]);

    useEffect(() => {
        if (anonymousUser) {
            console.log('Set checkout session id');
            setCheckoutSessionId(params.id, checkoutId);
        }
    }, [anonymousUser, params.id, checkoutId]);

    const chapterIndex = parseInt(params.chapter || '0');
    const { course, isBlocked } = request.data || {};
    const chapter = useMemo(() => {
        return course?.chapters ? course.chapters[chapterIndex] : undefined;
    }, [course, chapterIndex]);

    const moduleIndex = parseInt(params.module || '0');
    const courseModule = useMemo(() => {
        if (moduleIndex >= 0 && moduleIndex < (chapter?.modules.length || 0)) {
            return chapter?.modules[moduleIndex];
        }
    }, [chapter, moduleIndex]);

    if (isBlocked) {
        return <PurchaseCoursePage course={course} isFreeTier={isFreeTier} />;
    }

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (course === undefined || chapter === undefined || courseModule === undefined) {
        return <NotFoundPage />;
    }

    const prevModule = getPreviousModule(chapterIndex, moduleIndex, course);
    const nextModule = getNextModule(chapterIndex, moduleIndex, course);

    return (
        <Container maxWidth={false} sx={{ pt: 6, pb: 4 }}>
            {anonymousUser && (
                <Alert
                    severity='warning'
                    variant='filled'
                    sx={{ mb: 4 }}
                    action={
                        <Button component={Link} href='/signup' size='small' color='inherit'>
                            Create Account
                        </Button>
                    }
                >
                    You are not signed into an account, so this course is available only on this
                    device and browser. Create an account to access this course anywhere.
                </Alert>
            )}
            <Grid container rowGap={2}>
                <Grid size={{ xs: 12, md: 9.5 }}>
                    <Stack>
                        <Typography variant='h4'>{course.name}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {course.cohortRange}
                        </Typography>
                        <Divider />

                        <Box mt={2}>
                            <Module module={courseModule} />
                        </Box>
                    </Stack>

                    <Stack
                        direction='row'
                        justifyContent='space-between'
                        mt={4}
                        px={{ xs: 0, md: 4 }}
                    >
                        {prevModule && (
                            <Button
                                variant='contained'
                                component={Link}
                                href={`/courses/${params.type}/${params.id}/${prevModule.chapterIndex}/${prevModule.moduleIndex}`}
                            >
                                Previous: {prevModule.name}
                            </Button>
                        )}

                        {nextModule && (
                            <Button
                                variant='contained'
                                component={Link}
                                href={`/courses/${params.type}/${params.id}/${nextModule.chapterIndex}/${nextModule.moduleIndex}`}
                            >
                                Next: {nextModule.name}
                            </Button>
                        )}
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 2.5 }}>
                    <Contents course={course} />
                </Grid>
            </Grid>
            <RequestSnackbar request={request} />
        </Container>
    );
};

function getPreviousModule(chapterIndex: number, moduleIndex: number, course: Course) {
    if (chapterIndex === 0 && moduleIndex === 0) {
        return undefined;
    }
    if (!course.chapters) {
        return undefined;
    }

    if (moduleIndex === 0) {
        const prevModuleIndex = course.chapters[chapterIndex - 1].modules.length - 1;
        return {
            chapterIndex: `${chapterIndex - 1}`,
            moduleIndex: `${prevModuleIndex}`,
            name: course.chapters[chapterIndex - 1].modules[prevModuleIndex].name,
        };
    }

    return {
        chapterIndex: `${chapterIndex}`,
        moduleIndex: `${moduleIndex - 1}`,
        name: course.chapters[chapterIndex].modules[moduleIndex - 1].name,
    };
}

function getNextModule(chapterIndex: number, moduleIndex: number, course: Course) {
    if (!course.chapters) {
        return undefined;
    }
    if (
        chapterIndex === course.chapters.length - 1 &&
        moduleIndex === course.chapters[chapterIndex].modules.length - 1
    ) {
        return undefined;
    }

    if (moduleIndex === course.chapters[chapterIndex].modules.length - 1) {
        return {
            chapterIndex: `${chapterIndex + 1}`,
            moduleIndex: '0',
            name: course.chapters[chapterIndex + 1].modules[0].name,
        };
    }

    return {
        chapterIndex: `${chapterIndex}`,
        moduleIndex: `${moduleIndex + 1}`,
        name: course.chapters[chapterIndex].modules[moduleIndex + 1].name,
    };
}
