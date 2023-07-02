import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, Grid, Stack, Typography } from '@mui/material';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { Course } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';
import Board from '../../board/Board';

interface OpeningTabLevel {
    name: string;
    colors: OpeningTabColor[];
}

interface OpeningTabColor {
    name: string;
    courses: Course[];
}

const OpeningsTab = () => {
    const request = useRequest<Course[]>();
    const api = useApi();

    useEffect(() => {
        if (!request.isSent()) {
            api.listCourses()
                .then((courses) => {
                    request.onSuccess(courses);
                    console.log('listCourses: ', courses);
                })
                .catch((err) => {
                    console.error('listCourses: ', err);
                    request.onFailure(err);
                });
        }
    });

    const levels = useMemo(() => {
        const levels: OpeningTabLevel[] = [];
        if (request.data) {
            for (const course of request.data) {
                let level: OpeningTabLevel | undefined = levels.find(
                    (l1) => l1.name === course.cohortRange
                );

                if (level === undefined) {
                    level = { name: course.cohortRange, colors: [] };
                    levels.push(level);
                }

                let color = level.colors.find((c) => c.name === course.color);
                if (color === undefined) {
                    color = { name: course.color, courses: [] };
                    level.colors.push(color);
                }
                color.courses.push(course);
            }
        }
        return levels;
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    console.log('levels: ', levels);

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {levels.length > 0 &&
                levels.map((level) => (
                    <Stack key={level.name} spacing={0.5}>
                        <Typography variant='h5'>{level.name}</Typography>

                        <Stack spacing={1} pl={3}>
                            {level.colors.map((color) => (
                                <Stack key={color.name} spacing={0.5}>
                                    <Typography variant='h6' color='text.secondary'>
                                        {color.name}
                                    </Typography>

                                    <Grid container spacing={2}>
                                        {color.courses.map((course) => (
                                            <React.Fragment key={course.id}>
                                                {course.chapters.length > 1 && (
                                                    <Grid item xs={12}>
                                                        <Typography
                                                            variant='h6'
                                                            color='text.secondary'
                                                            sx={{
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            {course.name}
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {course.chapters.map((chapter, idx) => (
                                                    <Grid item xs='auto'>
                                                        <Link
                                                            key={course.id}
                                                            to={`/openings/${course.id}?chapter=${idx}`}
                                                            style={{
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            <Card
                                                                key={chapter.name}
                                                                variant='outlined'
                                                                sx={{ px: 0 }}
                                                            >
                                                                <CardHeader
                                                                    sx={{ px: 1, py: 1 }}
                                                                    subheader={
                                                                        <Typography color='text.secondary'>
                                                                            {course
                                                                                .chapters
                                                                                .length >
                                                                            1
                                                                                ? chapter.name
                                                                                : course.name}
                                                                        </Typography>
                                                                    }
                                                                />
                                                                <CardContent
                                                                    sx={{
                                                                        p: 0,
                                                                        pb: '0 !important',
                                                                        width: '336px',
                                                                        height: '336px',
                                                                    }}
                                                                >
                                                                    <Board
                                                                        config={{
                                                                            fen: chapter.thumbnailFen.trim(),
                                                                            viewOnly:
                                                                                true,
                                                                            orientation:
                                                                                chapter.thumbnailOrientation,
                                                                        }}
                                                                    />
                                                                </CardContent>
                                                            </Card>
                                                        </Link>
                                                    </Grid>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </Grid>
                                </Stack>
                            ))}
                        </Stack>
                    </Stack>
                ))}

            {(request.data === undefined || levels.length === 0) && (
                <Typography>No openings found</Typography>
            )}
        </Stack>
    );
};

export default OpeningsTab;
