import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    Stack,
    Typography,
    Divider,
    FormControl,
    MenuItem,
    Select,
    Link,
} from '@mui/material';

import GraduationIcon from '../scoreboard/GraduationIcon';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Graduation } from '../database/graduation';
import LoadingPage from '../loading/LoadingPage';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridValueFormatterParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';
import Avatar from '../profile/Avatar';

function getUniqueGraduations(graduations: Graduation[]): Graduation[] {
    return [...new Map(graduations.map((g) => [g.username, g])).values()];
}

const graduationDayOfWeek = 4; // Thursday
const numberOfOptions = 3;
const lastWeek = new Date();
lastWeek.setDate(lastWeek.getDate() - 7);

interface Timeframe {
    minDate: string;
    maxDate: string;
}

interface TimeframeOption {
    label: string;
    value: Timeframe;
}

function getTimeframeOptions() {
    let currGraduation = new Date();
    currGraduation.setUTCHours(17, 30, 0, 0);
    currGraduation.setUTCDate(
        currGraduation.getUTCDate() +
            ((graduationDayOfWeek + 7 - currGraduation.getUTCDay()) % 7)
    );

    const options: TimeframeOption[] = [];

    for (let i = 0; i < numberOfOptions; i++) {
        let prevGraduation = new Date(currGraduation);
        prevGraduation.setUTCDate(prevGraduation.getUTCDate() - 7);

        options.push({
            label: `Graduation of ${currGraduation.toLocaleDateString()}`,
            value: {
                minDate: prevGraduation.toISOString(),
                maxDate: currGraduation.toISOString(),
            },
        });

        currGraduation = prevGraduation;
    }

    return options;
}

const timeframeOptions = getTimeframeOptions();

const graduateTableColumns: GridColDef<Graduation>[] = [
    {
        field: 'displayName',
        headerName: 'Name',
        minWidth: 200,
        renderCell: (params: GridRenderCellParams<Graduation, string>) => {
            return (
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Avatar
                        username={params.row.username}
                        displayName={params.value}
                        size={32}
                    />
                    <Link component={RouterLink} to={`/profile/${params.row.username}`}>
                        {params.value}
                    </Link>
                </Stack>
            );
        },
    },
    {
        field: 'graduations',
        headerName: 'Graduated',
        align: 'center',
        headerAlign: 'center',
        minWidth: 150,
        valueGetter: (params: GridValueGetterParams<Graduation>) => {
            if (params.row.graduationCohorts && params.row.graduationCohorts.length > 0) {
                return params.row.graduationCohorts;
            }
            return params.row.previousCohort;
        },
        renderCell: (params: GridRenderCellParams<Graduation>) => {
            let graduationCohorts = params.row.graduationCohorts;
            if (graduationCohorts && graduationCohorts.length > 0) {
                if (graduationCohorts.length > 3) {
                    graduationCohorts = graduationCohorts.slice(
                        graduationCohorts.length - 3
                    );
                }
                return (
                    <Stack direction='row'>
                        {graduationCohorts.map((c) => (
                            <GraduationIcon key={c} cohort={c} size={32} />
                        ))}
                    </Stack>
                );
            }
            return <GraduationIcon cohort={params.row.previousCohort} size={32} />;
        },
    },
    {
        field: 'previousCohort',
        headerName: 'Old Cohort',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (params: GridValueGetterParams<Graduation>) => {
            return parseInt(params.row.previousCohort.split('-')[0]);
        },
        renderCell: (params: GridRenderCellParams<Graduation>) => {
            return params.row.previousCohort;
        },
    },
    {
        field: 'newCohort',
        headerName: 'New Cohort',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        valueGetter: (params: GridValueGetterParams<Graduation>) => {
            return parseInt(params.row.newCohort.replaceAll('+', '').split('-')[0]);
        },
        renderCell: (params: GridRenderCellParams<Graduation>) => {
            return params.row.newCohort;
        },
    },
    {
        field: 'score',
        headerName: 'Dojo Score',
        headerAlign: 'center',
        align: 'center',
        valueFormatter: (params: GridValueFormatterParams<number>) => {
            return Math.round(params.value * 100) / 100;
        },
    },
    {
        field: 'createdAt',
        headerName: 'Date',
        headerAlign: 'center',
        align: 'center',
        valueFormatter: (params: GridValueFormatterParams<string>) => {
            return new Date(params.value).toLocaleDateString();
        },
    },
    {
        field: 'comments',
        headerName: 'Comments',
        headerAlign: 'center',
        align: 'center',
        minWidth: 250,
    },
];

const RecentGraduates = () => {
    const api = useApi();
    const request = useRequest<Graduation[]>();
    const [timeframe, setTimeframe] = useState<Timeframe>(timeframeOptions[0]?.value);

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listGraduationsByDate()
                .then((graduations) => request.onSuccess(graduations))
                .catch((err) => {
                    console.error('listGraduationsByDate: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const graduations = useMemo(() => {
        const gs = request.data ?? [];

        return getUniqueGraduations(
            gs.filter(
                (g) => g.createdAt >= timeframe.minDate && g.createdAt < timeframe.maxDate
            )
        );
    }, [request.data, timeframe]);

    return (
        <Stack spacing={3}>
            <RequestSnackbar request={request} />
            <Stack>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Typography variant='h6'>Recent Graduates</Typography>
                    <FormControl
                        data-cy='graduates-timeframe-select'
                        size='small'
                        variant='standard'
                    >
                        <Select
                            value={timeframe}
                            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
                            sx={{
                                '::before': {
                                    border: 'none !important',
                                },
                                '& div': {
                                    paddingBottom: 0,
                                },
                            }}
                        >
                            {timeframeOptions.map((option) => (
                                <MenuItem
                                    data-cy={option.label}
                                    key={option.label}
                                    value={option.value as any}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Stack>
                <Divider />
            </Stack>

            {graduations.length === 0 ? (
                request.isLoading() ? (
                    <LoadingPage />
                ) : (
                    <Typography>No graduations in the selected timeframe</Typography>
                )
            ) : (
                <DataGrid
                    data-cy='recent-graduates-table'
                    columns={graduateTableColumns}
                    rows={graduations}
                    getRowId={(row: Graduation) => row.username}
                    getRowHeight={() => 'auto'}
                    sx={{
                        width: 1,
                        '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': {
                            py: '8px',
                        },
                        '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': {
                            py: '15px',
                        },
                        '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': {
                            py: '22px',
                        },
                    }}
                    pageSizeOptions={[5, 10, 25]}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                page: 0,
                                pageSize: 10,
                            },
                        },
                        sorting: {
                            sortModel: [{ field: 'newCohort', sort: 'asc' }],
                        },
                    }}
                    autoHeight
                />
            )}
        </Stack>
    );
};

export default RecentGraduates;
