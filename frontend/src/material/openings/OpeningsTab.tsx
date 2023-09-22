import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Stack, Typography, Link } from '@mui/material';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { Course } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';
import { useFreeTier } from '../../auth/Auth';
import UpsellDialog, { RestrictedAction } from '../../upsell/UpsellDialog';

const LEVELS = ['Starter (1200-1800)', 'Expert (1800+)'];

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
    const isFreeTier = useFreeTier();
    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);

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
            for (const l of LEVELS) {
                const courses = request.data.filter((c) => c.cohortRange === l);
                const level = {
                    name: l,
                    colors: [
                        {
                            name: 'White',
                            courses: courses.filter((c) => c.color === 'White'),
                        },
                        {
                            name: 'Black',
                            courses: courses.filter((c) => c.color === 'Black'),
                        },
                    ],
                };

                levels.push(level);
            }
        }
        return levels;
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    const onClickLink = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (isFreeTier) {
            event.preventDefault();
            setUpsellDialogOpen(true);
        }
    };

    console.log('levels: ', levels);

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {levels.length > 0 &&
                levels.map((level) => (
                    <Stack key={level.name} spacing={0.5} data-cy={level.name}>
                        <Typography variant='h5'>{level.name}</Typography>

                        <Stack spacing={1} pl={3}>
                            {level.colors.map((color) => {
                                if (color.courses.length === 0) {
                                    return null;
                                }

                                return (
                                    <Stack key={color.name} spacing={0.5}>
                                        <Typography variant='h6' color='text.secondary'>
                                            {color.name}
                                        </Typography>

                                        <ul>
                                            {color.courses.map((course) => (
                                                <Link
                                                    key={course.id}
                                                    component={RouterLink}
                                                    to={`/openings/${course.id}`}
                                                    style={{
                                                        textDecoration: 'none',
                                                    }}
                                                    onClick={onClickLink}
                                                >
                                                    <li key={course.id}>{course.name}</li>
                                                </Link>
                                            ))}
                                        </ul>
                                    </Stack>
                                );
                            })}
                        </Stack>
                    </Stack>
                ))}

            {(request.data === undefined || levels.length === 0) && (
                <Typography>No openings found</Typography>
            )}

            <UpsellDialog
                open={upsellDialogOpen}
                onClose={setUpsellDialogOpen}
                currentAction={RestrictedAction.AccessOpenings}
            />
        </Stack>
    );
};

export default OpeningsTab;
