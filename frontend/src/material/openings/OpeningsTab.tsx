import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Stack, Typography } from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';
import { Opening } from '../../database/opening';
import LoadingPage from '../../loading/LoadingPage';

interface OpeningTabLevel {
    name: string;
    cohortRange: string;
    colors: OpeningTabColor[];
}

interface OpeningTabColor {
    name: string;
    openings: {
        id: string;
        name: string;
    }[];
}

const OpeningsTab = () => {
    const request = useRequest<Opening[]>();
    const api = useApi();

    useEffect(() => {
        if (!request.isSent()) {
            api.listOpenings()
                .then((openings) => {
                    request.onSuccess(openings);
                    console.log('listOpenings: ', openings);
                })
                .catch((err) => {
                    console.error('listOpenings: ', err);
                    request.onFailure(err);
                });
        }
    });

    const levels = useMemo(() => {
        const levels: OpeningTabLevel[] = [];
        if (request.data) {
            for (const opening of request.data) {
                for (const l of opening.levels) {
                    let level: OpeningTabLevel | undefined = levels.find(
                        (l1) => l1.name === l.name && l1.cohortRange === l.cohortRange
                    );
                    if (level === undefined) {
                        level = { name: l.name, cohortRange: l.cohortRange, colors: [] };
                        levels.push(level);
                    }
                    let color = level.colors.find((c) => c.name === opening.color);
                    if (color === undefined) {
                        color = { name: opening.color, openings: [] };
                        level.colors.push(color);
                    }
                    color.openings.push({ id: opening.id, name: opening.name });
                }
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
                        <Typography variant='h5'>
                            {level.name} ({level.cohortRange})
                        </Typography>

                        <Stack spacing={1} pl={3}>
                            {level.colors.map((color) => (
                                <Stack key={color.name} spacing={0.5}>
                                    <Typography variant='h6' color='text.secondary'>
                                        {color.name}
                                    </Typography>

                                    <Stack spacing={1} pl={3}>
                                        {color.openings.map((opening) => (
                                            <Link
                                                key={opening.id}
                                                to={`/openings/${opening.id}/${level.name}`}
                                                style={{ textDecoration: 'none' }}
                                            >
                                                <Stack
                                                    direction='row'
                                                    alignItems='center'
                                                    spacing={2}
                                                >
                                                    <Typography
                                                        variant='h6'
                                                        color='text.secondary'
                                                        sx={{ textDecoration: 'none' }}
                                                    >
                                                        {opening.name}
                                                    </Typography>
                                                    <Typography
                                                        color='text.secondary'
                                                        pt='3px'
                                                    >
                                                        <ArrowForwardIosIcon />
                                                    </Typography>
                                                </Stack>
                                            </Link>
                                        ))}
                                    </Stack>
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
