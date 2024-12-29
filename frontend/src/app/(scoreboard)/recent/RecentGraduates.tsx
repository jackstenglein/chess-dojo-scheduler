'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { Link } from '@/components/navigation/Link';
import { MUI_LICENSE_KEY } from '@/config';
import { Graduation } from '@/database/graduation';
import LoadingPage from '@/loading/LoadingPage';
import Avatar from '@/profile/Avatar';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Divider, FormControl, MenuItem, Select, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { LicenseInfo } from '@mui/x-license';
import { useEffect, useMemo, useState } from 'react';

LicenseInfo.setLicenseKey(MUI_LICENSE_KEY);

function getUniqueGraduations(graduations: Graduation[]): Graduation[] {
    return [...new Map(graduations.map((g) => [g.username, g])).values()];
}

const graduationDayOfWeek = 3; // Wednesday
const numberOfOptions = 4;
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
            ((graduationDayOfWeek + 7 - currGraduation.getUTCDay()) % 7),
    );

    const options: TimeframeOption[] = [];

    for (let i = 0; i < numberOfOptions; i++) {
        const prevGraduation = new Date(currGraduation);
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
        flex: 1,
        renderCell: (params: GridRenderCellParams<Graduation, string>) => {
            return (
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Avatar
                        username={params.row.username}
                        displayName={params.value}
                        size={32}
                    />
                    <Link href={`/profile/${params.row.username}`}>{params.value}</Link>
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
        flex: 1,
        valueGetter: (_value, row) => {
            if (row.graduationCohorts && row.graduationCohorts.length > 0) {
                return row.graduationCohorts;
            }
            return row.previousCohort;
        },
        renderCell: (params: GridRenderCellParams<Graduation>) => {
            let graduationCohorts = params.row.graduationCohorts;
            if (graduationCohorts && graduationCohorts.length > 0) {
                if (graduationCohorts.length > 3) {
                    graduationCohorts = graduationCohorts.slice(
                        graduationCohorts.length - 3,
                    );
                }
                return (
                    <Stack direction='row' justifyContent='center'>
                        {graduationCohorts.map((c) => (
                            <CohortIcon key={c} cohort={c} size={32} />
                        ))}
                    </Stack>
                );
            }
            return <CohortIcon cohort={params.row.previousCohort} size={32} />;
        },
    },
    {
        field: 'previousCohort',
        headerName: 'Old Cohort',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        flex: 1,
        valueGetter: (_value, row) => {
            return parseInt(row.previousCohort.split('-')[0]);
        },
        renderCell: (params: GridRenderCellParams<Graduation>) => {
            return (
                <Stack height='30px' justifyContent='center'>
                    {params.row.previousCohort}
                </Stack>
            );
        },
    },
    {
        field: 'newCohort',
        headerName: 'New Cohort',
        minWidth: 150,
        headerAlign: 'center',
        align: 'center',
        flex: 1,
        valueGetter: (_value, row) => {
            return parseInt(row.newCohort.replaceAll('+', '').split('-')[0]);
        },
        renderCell: (params: GridRenderCellParams<Graduation>) => {
            return (
                <Stack height='30px' justifyContent='center'>
                    {params.row.newCohort}
                </Stack>
            );
        },
    },
    {
        field: 'score',
        headerName: 'Dojo Score',
        headerAlign: 'center',
        align: 'center',
        flex: 1,
        valueFormatter: (value) => Math.round(value * 100) / 100,
        renderCell: (params) => (
            <Stack height='30px' justifyContent='center'>
                {params.formattedValue}
            </Stack>
        ),
    },
    {
        field: 'createdAt',
        headerName: 'Date',
        headerAlign: 'center',
        align: 'center',
        flex: 1,
        valueFormatter: (value) => new Date(value).toLocaleDateString(),
        renderCell: (params) => (
            <Stack height='30px' justifyContent='center'>
                {params.formattedValue}
            </Stack>
        ),
    },
];

function DetailPanelContent(params: GridRowParams<Graduation>) {
    if (!params.row.comments) {
        return null;
    }
    return (
        <Typography mx={2} my={1}>
            {params.row.comments}
        </Typography>
    );
}

function getDetailPanelHeight(): 'auto' {
    return 'auto';
}

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
                (g) =>
                    g.createdAt >= timeframe.minDate && g.createdAt < timeframe.maxDate,
            ),
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
                                    value={option.value as unknown as string}
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
                <DataGridPro
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
                    pageSizeOptions={[10, 25, 100]}
                    initialState={{
                        pagination: {
                            paginationModel: {
                                page: 0,
                                pageSize: 100,
                            },
                        },
                        sorting: {
                            sortModel: [{ field: 'newCohort', sort: 'asc' }],
                        },
                        detailPanel: {
                            expandedRowIds: graduations.map((g) => g.username),
                        },
                    }}
                    getDetailPanelContent={DetailPanelContent}
                    getDetailPanelHeight={getDetailPanelHeight}
                    pagination
                    autoHeight
                />
            )}
        </Stack>
    );
};

export default RecentGraduates;
