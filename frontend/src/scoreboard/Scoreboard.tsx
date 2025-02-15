import { Link } from '@/components/navigation/Link';
import HelpIcon from '@mui/icons-material/Help';
import PushPinIcon from '@mui/icons-material/PushPin';
import { Stack, Tooltip } from '@mui/material';
import {
    DataGridPro,
    GridActionsCellItem,
    GridColDef,
    GridColumnGroupingModel,
    GridColumnVisibilityModel,
    GridProSlotsComponent,
    GridRenderCellParams,
    GridRowId,
    GridRowModel,
} from '@mui/x-data-grid-pro';
import { GridProSlotProps } from '@mui/x-data-grid-pro/models/gridProSlotProps';
import { useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';
import { useFreeTier } from '../auth/Auth';
import { isGraduation } from '../database/graduation';
import { Requirement, ScoreboardDisplay, formatTime } from '../database/requirement';
import { User, compareCohorts } from '../database/user';
import Avatar from '../profile/Avatar';
import CohortIcon from './CohortIcon';
import ScoreboardProgress from './ScoreboardProgress';
import {
    ScoreboardRow,
    formatPercentComplete,
    getCohortScore,
    getColumnDefinition,
    getCurrentRating,
    getMinutesSpent,
    getNormalizedRatingRow,
    getPercentComplete,
    getRatingChange,
    getRatingSystem,
    getStartRating,
} from './scoreboardData';

interface ColumnGroupChild {
    field: string;
}

interface ColumnGroup {
    groupId: string;
    children: ColumnGroupChild[];
}

const userInfoColumnGroup = {
    groupId: 'User Info',
    children: [
        { field: 'actions' },
        { field: 'rank' },
        { field: 'displayName' },
        { field: 'dojoCohort' },
        { field: 'previousCohort' },
    ],
};

const rankColumn: GridColDef<ScoreboardRow> = {
    field: 'rank',
    headerName: 'Rank',
    renderHeader: () => '',
    valueGetter: (_value, row, _column, api) =>
        api.current.getSortedRowIds().indexOf(row.username.replace('#pinned', '')) + 1,
    sortable: false,
    filterable: false,
    align: 'center',
    headerAlign: 'center',
    width: 50,
};

const displayNameColumn: GridColDef<ScoreboardRow> = {
    field: 'displayName',
    headerName: 'Name',
    minWidth: 250,
    renderCell: (params: GridRenderCellParams<ScoreboardRow, string>) => {
        return (
            <Stack direction='row' spacing={1} alignItems='center'>
                <Avatar
                    username={params.row.username.replace('#pinned', '')}
                    displayName={params.value}
                    size={32}
                />
                <Link href={`/profile/${params.row.username.replace('#pinned', '')}`}>
                    {params.value}
                </Link>
            </Stack>
        );
    },
};

const cohortColumn: GridColDef<ScoreboardRow> = {
    field: 'dojoCohort',
    headerName: 'Cohort',
    align: 'center',
    headerAlign: 'center',
    valueGetter(_value, row) {
        if (isGraduation(row)) {
            return '';
        }
        return parseInt(row.dojoCohort);
    },
    renderCell(params) {
        if (isGraduation(params.row)) {
            return '';
        }
        return params.row.dojoCohort;
    },
};

const graduatedColumn: GridColDef<ScoreboardRow> = {
    field: 'previousCohort',
    headerName: 'Graduated',
    valueGetter: (_value, row) => {
        if (row.graduationCohorts && row.graduationCohorts.length > 0) {
            return row.graduationCohorts;
        }
        return row.previousCohort;
    },
    renderCell: (params: GridRenderCellParams<ScoreboardRow>) => {
        let graduationCohorts = params.row.graduationCohorts;
        if (graduationCohorts && graduationCohorts.length > 0) {
            graduationCohorts = graduationCohorts
                .sort(compareCohorts)
                .filter((c, i) => graduationCohorts?.indexOf(c) === i);
            if (graduationCohorts.length > 3) {
                graduationCohorts = graduationCohorts.slice(graduationCohorts.length - 3);
            }

            return (
                <Stack direction='row' alignItems='center' height={1}>
                    {graduationCohorts.map((c) => (
                        <CohortIcon key={c} cohort={c} size={32} />
                    ))}
                </Stack>
            );
        }
        return <CohortIcon cohort={params.row.previousCohort} size={32} />;
    },
    width: 110,
    align: 'center',
    headerAlign: 'center',
};

const summaryUserInfoColumns = [
    rankColumn,
    displayNameColumn,
    cohortColumn,
    graduatedColumn,
];
const defaultUserInfoColumns = [rankColumn, displayNameColumn, graduatedColumn];

const ratingsColumnGroup = {
    groupId: 'Ratings',
    children: [
        { field: 'ratingSystem' },
        { field: 'startRating' },
        { field: 'currentRating' },
        { field: 'ratingChange' },
        { field: 'normalizedRating' },
    ],
};

const ratingsColumns: GridColDef<ScoreboardRow>[] = [
    {
        field: 'ratingSystem',
        headerName: 'Rating System',
        minWidth: 175,
        valueGetter: (_value, row) => getRatingSystem(row),
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: 'startRating',
        headerName: 'Start Rating',
        minWidth: 150,
        valueGetter: (_value, row) => getStartRating(row),
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: 'currentRating',
        headerName: 'Current Rating',
        minWidth: 150,
        valueGetter: (_value, row) => getCurrentRating(row),
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: 'ratingChange',
        headerName: 'Rating Change',
        minWidth: 150,
        valueGetter: (_value, row) => getRatingChange(row),
        align: 'center',
        headerAlign: 'center',
    },
    {
        field: 'normalizedRating',
        headerName: 'Normalized Dojo Rating',
        minWidth: 200,
        valueGetter: (_value, row) => getNormalizedRatingRow(row),
        renderCell: (params: GridRenderCellParams<ScoreboardRow, number>) =>
            (params.value ?? -1) >= 0 ? (
                params.value
            ) : (
                <Tooltip title='Custom ratings cannot be normalized'>
                    <HelpIcon sx={{ ml: 1, color: 'text.secondary', height: 1 }} />
                </Tooltip>
            ),
        align: 'center',
        headerAlign: 'center',
    },
];

const defaultColumnGroups: GridColumnGroupingModel = [
    userInfoColumnGroup,
    ratingsColumnGroup,
    {
        groupId: 'Training Plan',
        children: [{ field: 'cohortScore' }, { field: 'percentComplete' }],
    },
    {
        groupId: 'Time Spent',
        children: [
            { field: 'totalTime' },
            { field: 'last7DaysTime' },
            { field: 'last30DaysTime' },
            { field: 'last90DaysTime' },
            { field: 'last365DaysTime' },
            { field: 'nonDojoTime' },
        ],
        renderHeaderGroup: (params) => {
            return (
                <Stack direction='row' alignItems='center'>
                    {params.groupId}
                    <Tooltip title='Data for time spent in last X days is updated every 24 hours and does not include non-dojo activities'>
                        <HelpIcon sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                </Stack>
            );
        },
    },
];

const summaryColumnGroups: GridColumnGroupingModel = [
    userInfoColumnGroup,
    ratingsColumnGroup,
    {
        groupId: 'Training Plan',
        children: [{ field: 'totalDojoScore' }],
        renderHeaderGroup: (params) => {
            return (
                <Stack direction='row' alignItems='center'>
                    {params.groupId}
                    <Tooltip title='Data covers all cohorts and is updated every 24 hours'>
                        <HelpIcon sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                </Stack>
            );
        },
    },
    {
        groupId: 'Time Spent',
        children: [
            { field: 'totalTime' },
            { field: 'last7DaysTime' },
            { field: 'last30DaysTime' },
            { field: 'last90DaysTime' },
            { field: 'last365DaysTime' },
            { field: 'nonDojoTime' },
        ],
        renderHeaderGroup: (params) => {
            return (
                <Stack direction='row' alignItems='center'>
                    {params.groupId}
                    <Tooltip title='Data covers all cohorts and is updated every 24 hours'>
                        <HelpIcon sx={{ ml: 1, color: 'text.secondary' }} />
                    </Tooltip>
                </Stack>
            );
        },
    },
];

/**
 * Returns the actions column for the scoreboard.
 * @param pinnedRowIds The ids of the currently-pinned rows.
 * @param setPinnedRowIds A function to set the new pinned row ids.
 * @returns The actions column for the scoreboard.
 */
function getActionColumns(
    pinnedRowIds: GridRowId[],
    setPinnedRowIds: React.Dispatch<React.SetStateAction<GridRowId[]>>,
): GridColDef<ScoreboardRow> {
    return {
        field: 'actions',
        type: 'actions',
        width: 50,
        getActions: (params) => {
            const id = (params.id as string).replace('#pinned', '');
            const isPinned = pinnedRowIds.includes(id);
            if (isPinned) {
                return [
                    <GridActionsCellItem
                        key='unpin'
                        label='Unpin Row'
                        icon={
                            <Tooltip title='Unpin Row'>
                                <PushPinIcon color='info' />
                            </Tooltip>
                        }
                        onClick={() =>
                            setPinnedRowIds((prevPinnedRowIds) => {
                                return prevPinnedRowIds.filter((rowId) => rowId !== id);
                            })
                        }
                    />,
                ];
            }
            return [
                <GridActionsCellItem
                    key='pin'
                    icon={
                        <Tooltip title='Pin Row'>
                            <PushPinIcon sx={{ color: 'text.secondary' }} />
                        </Tooltip>
                    }
                    label='Pin Row'
                    onClick={() =>
                        setPinnedRowIds((prevPinnedRowIds) => [...prevPinnedRowIds, id])
                    }
                />,
            ];
        },
    };
}

/**
 * Returns the columns for the Training Plan column group.
 * @param cohort The cohort being displayed in the scoreboard, if applicable.
 * @param requirements The requirements being used to calculate the dojo score, if applicable.
 * @returns The columns for the Training Plan column group.
 */
function getTrainingPlanColumns(
    cohort?: string,
    requirements?: Requirement[],
): GridColDef<ScoreboardRow>[] {
    if (cohort && requirements) {
        return [
            {
                field: 'cohortScore',
                headerName: 'Dojo Score',
                minWidth: 125,
                valueGetter: (_value, row) => getCohortScore(row, cohort, requirements),
                align: 'center',
            },
            {
                field: 'percentComplete',
                headerName: 'Percent Complete',
                minWidth: 175,
                valueGetter: (_value, row) =>
                    getPercentComplete(row, cohort, requirements),
                renderCell: (params: GridRenderCellParams<ScoreboardRow, number>) => (
                    <ScoreboardProgress
                        fullHeight
                        value={params.value ?? 0}
                        max={100}
                        min={0}
                        label={formatPercentComplete(params.value ?? 0)}
                    />
                ),
                align: 'center',
            },
        ];
    }

    return [
        {
            field: 'totalDojoScore',
            headerName: 'Dojo Score',
            minWidth: 150,
            align: 'center',
            valueFormatter: (value) => Math.round(value * 100) / 100,
        },
    ];
}

/**
 * Returns the columns for the Time Spent column group.
 * @param allCohorts Whether all cohorts should be included for time spent.
 * @returns The columns for the Time Spent column group.
 */
function getTimeSpentColumns(allCohorts?: boolean): GridColDef<ScoreboardRow>[] {
    return [
        {
            field: 'totalTime',
            headerName: allCohorts ? 'All Tasks' : 'Cohort Tasks',
            valueGetter: (_value, row) =>
                getMinutesSpent(row, allCohorts ? 'ALL_COHORTS_ALL_TIME' : 'ALL_TIME'),
            valueFormatter: (value) => formatTime(value),
            align: 'center',
            minWidth: 125,
            headerAlign: 'center',
        },
        {
            field: 'last7DaysTime',
            headerName: 'Last 7 Days',
            valueGetter: (_value, row) =>
                getMinutesSpent(
                    row,
                    allCohorts ? 'ALL_COHORTS_LAST_7_DAYS' : 'LAST_7_DAYS',
                ),
            valueFormatter: (value) => formatTime(value),
            align: 'center',
            minWidth: 125,
            headerAlign: 'center',
        },
        {
            field: 'last30DaysTime',
            headerName: 'Last 30 Days',
            valueGetter: (_value, row) =>
                getMinutesSpent(
                    row,
                    allCohorts ? 'ALL_COHORTS_LAST_30_DAYS' : 'LAST_30_DAYS',
                ),
            valueFormatter: (value) => formatTime(value),
            align: 'center',
            minWidth: 125,
            headerAlign: 'center',
        },
        {
            field: 'last90DaysTime',
            headerName: 'Last 90 Days',
            valueGetter: (_value, row) =>
                getMinutesSpent(
                    row,
                    allCohorts ? 'ALL_COHORTS_LAST_90_DAYS' : 'LAST_90_DAYS',
                ),
            valueFormatter: (value) => formatTime(value),
            align: 'center',
            minWidth: 125,
            headerAlign: 'center',
        },
        {
            field: 'last365DaysTime',
            headerName: 'Last 365 Days',
            valueGetter: (_value, row) =>
                getMinutesSpent(
                    row,
                    allCohorts ? 'ALL_COHORTS_LAST_365_DAYS' : 'LAST_365_DAYS',
                ),
            valueFormatter: (value) => formatTime(value),
            align: 'center',
            minWidth: 125,
            headerAlign: 'center',
        },
        {
            field: 'nonDojoTime',
            headerName: 'Non-Dojo',
            valueGetter: (_value, row) =>
                getMinutesSpent(row, allCohorts ? 'ALL_COHORTS_NON_DOJO' : 'NON_DOJO'),
            valueFormatter: (value) => formatTime(value),
            align: 'center',
            minWidth: 125,
            headerAlign: 'center',
        },
    ];
}

interface ScoreboardProps {
    user?: User;
    cohort?: string;
    requirements?: Requirement[];
    cypressId?: string;
    rows: ScoreboardRow[];
    loading: boolean;
    addUser?: boolean;
    slots?: Partial<GridProSlotsComponent>;
    slotProps?: GridProSlotProps;
}

const Scoreboard: React.FC<ScoreboardProps> = ({
    user,
    cohort,
    requirements,
    cypressId,
    rows: initialRows,
    loading,
    addUser,
    slots,
    slotProps,
}) => {
    const isSummary = cohort === undefined;
    const isFreeTier = useFreeTier();

    const [pinnedRowIds, setPinnedRowIds] = useState<GridRowId[]>(
        user ? [user.username] : [],
    );

    const actionColumn = useMemo(
        () => getActionColumns(pinnedRowIds, setPinnedRowIds),
        [pinnedRowIds, setPinnedRowIds],
    );

    const trainingPlanColumns = useMemo(
        () => getTrainingPlanColumns(cohort, requirements),
        [cohort, requirements],
    );

    const timeSpentColumns = useMemo(() => getTimeSpentColumns(isSummary), [isSummary]);

    const requirementColumns: GridColDef<ScoreboardRow>[] = useMemo(() => {
        return (
            requirements
                ?.filter(
                    (r) =>
                        r.category !== 'Welcome to the Dojo' &&
                        r.category !== 'Non-Dojo' &&
                        r.scoreboardDisplay !== ScoreboardDisplay.Hidden &&
                        (!isFreeTier || r.isFree),
                )
                .map((r) => getColumnDefinition(r, cohort || '')) ?? []
        );
    }, [requirements, cohort, isFreeTier]);

    const requirementColumnGroups = useMemo(() => {
        const categories: Record<string, ColumnGroup> = {};
        requirements?.forEach((r) => {
            if (categories[r.category] !== undefined) {
                categories[r.category].children.push({ field: r.id });
            } else {
                categories[r.category] = {
                    groupId: r.category,
                    children: [{ field: r.id }],
                };
            }
        });
        return Object.values(categories);
    }, [requirements]);

    const columns = useMemo(
        () =>
            [actionColumn].concat(
                isSummary ? summaryUserInfoColumns : defaultUserInfoColumns,
                ratingsColumns,
                trainingPlanColumns,
                timeSpentColumns,
                requirementColumns,
            ),
        [
            actionColumn,
            isSummary,
            trainingPlanColumns,
            timeSpentColumns,
            requirementColumns,
        ],
    );

    const columnGroups = useMemo(
        () =>
            (isSummary ? summaryColumnGroups : defaultColumnGroups).concat(
                requirementColumnGroups,
            ),
        [isSummary, requirementColumnGroups],
    );

    const [rows, pinnedRows] = useMemo(() => {
        const pinnedRows: ScoreboardRow[] = [];

        const rows =
            addUser && user && !isFreeTier ? initialRows.concat(user) : initialRows;
        for (const row of rows) {
            if (pinnedRowIds.includes(row.username)) {
                pinnedRows.push(
                    Object.assign({}, row, { username: `${row.username}#pinned` }),
                );
            }
        }

        return [rows, { top: pinnedRows }];
    }, [user, initialRows, pinnedRowIds, isFreeTier, addUser]);

    const [columnVisibility, setColumnVisibility] =
        useLocalStorage<GridColumnVisibilityModel>(`/scoreboard/columns`, {});

    return (
        <DataGridPro
            data-cy={cypressId}
            sx={{ mb: 4, height: 'calc(100vh - 120px)' }}
            columns={columns}
            columnGroupingModel={columnGroups}
            columnVisibilityModel={columnVisibility}
            onColumnVisibilityModelChange={(model) => setColumnVisibility(model)}
            rows={rows}
            pinnedRows={pinnedRows}
            loading={loading}
            getRowId={(row: GridRowModel<ScoreboardRow>) => row.username}
            initialState={{
                sorting: {
                    sortModel: [
                        {
                            field: isSummary ? 'totalDojoScore' : 'cohortScore',
                            sort: 'desc',
                        },
                    ],
                },
            }}
            pagination
            slots={slots}
            slotProps={slotProps}
        />
    );
};

export default Scoreboard;
