import {
    getExamMaxScore,
    getRegression,
} from '@jackstenglein/chess-dojo-common/src/exam/scores';
import { Check, Close, ExpandLess, ExpandMore, Help, Lock } from '@mui/icons-material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {
    Alert,
    ButtonBase,
    Collapse,
    IconButton,
    Link,
    Snackbar,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRenderCellParams,
    GridRowParams,
} from '@mui/x-data-grid-pro';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useAuth, useFreeTier } from '../../auth/Auth';
import { toDojoDateString } from '../../calendar/displayDate';
import { Exam, ExamType } from '../../database/exam';
import { isCohortInRange } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import UpsellDialog, { RestrictedAction } from '../../upsell/UpsellDialog';
import { getColorBasedOnExamType } from '../view/ExamCard';

interface CohortRangeExams {
    name: string;
    exams: Exam[];
}

interface ExamListProps {
    cohortRanges: string[];
    examType: ExamType;
}

/**
 * Renders a set of exams in different cohort ranges. Each cohort range is
 * collapsible, and the user's current cohort range is expanded by default.
 * @param cohortRanges The cohort ranges that apply to this section
 * @param examType The type of exam shown in this section
 */
export const ExamList: React.FC<ExamListProps> = ({ cohortRanges, examType }) => {
    const api = useApi();
    const request = useRequest<Exam[]>();
    const user = useAuth().user;
    const [expanded, setExpanded] = useState(
        cohortRanges.map((c) => isCohortInRange(user?.dojoCohort, c)),
    );

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            api.listExams(examType)
                .then((exams) => {
                    console.log('Exams: ', exams);
                    request.onSuccess(exams);
                })
                .catch((err) => {
                    console.error('listExams: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api, examType]);

    const ranges = useMemo(() => {
        const ranges: CohortRangeExams[] = [];
        if (request.data) {
            for (const range of cohortRanges) {
                const exams = request.data
                    .filter((c) => c.cohortRange === range)
                    .sort((lhs, rhs) => {
                        if (
                            parseInt(lhs.name.replace('Test #', '')) <
                            parseInt(rhs.name.replace('Test #', ''))
                        ) {
                            return -1;
                        }
                        return 1;
                    });
                ranges.push({
                    name: range,
                    exams,
                });
            }
        }
        return ranges;
    }, [request, cohortRanges]);

    const onChangeExpanded = (i: number) => {
        setExpanded([...expanded.slice(0, i), !expanded[i], ...expanded.slice(i + 1)]);
    };

    return (
        <Stack spacing={2}>
            {!request.isSent() || request.isLoading() ? (
                <LoadingPage />
            ) : (
                <Stack spacing={3}>
                    {ranges.map((range, i) => (
                        <Stack key={range.name}>
                            <Stack spacing={1} direction='row' alignItems='center'>
                                <Tooltip
                                    title={
                                        expanded[i]
                                            ? 'Collapse Section'
                                            : 'Expand Section'
                                    }
                                >
                                    <ButtonBase onClick={() => onChangeExpanded(i)}>
                                        <IconButton>
                                            {expanded[i] ? (
                                                <ExpandLess
                                                    color={getColorBasedOnExamType(
                                                        examType,
                                                    )}
                                                />
                                            ) : (
                                                <ExpandMore
                                                    color={getColorBasedOnExamType(
                                                        examType,
                                                    )}
                                                />
                                            )}
                                        </IconButton>
                                        <Typography variant='h6'>{range.name}</Typography>
                                    </ButtonBase>
                                </Tooltip>
                            </Stack>

                            <Collapse in={expanded[i]}>
                                <ExamsTable exams={range.exams} />
                            </Collapse>
                        </Stack>
                    ))}
                </Stack>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};

const columns: GridColDef<Exam>[] = [
    {
        field: 'problems',
        headerName: '# of Problems',
        valueGetter: (_value, row) => row.pgns.length,
        align: 'center',
        headerAlign: 'center',
        flex: 1,
    },
    {
        field: 'timeLimitSeconds',
        headerName: 'Time Limit',
        valueFormatter: (value: number) => `${value / 60} min`,
        headerAlign: 'center',
        align: 'center',
        flex: 1,
    },
    {
        field: 'takebacksDisabled',
        headerName: 'Takebacks',
        headerAlign: 'center',
        align: 'center',
        width: 88,
        renderCell(params) {
            return (
                <Tooltip
                    title={
                        params.value
                            ? 'Takebacks are disabled for this exam. Once you make a move, it is locked in.'
                            : 'Takebacks are enabled for this exam. After making a move, you can promote another move instead.'
                    }
                >
                    {params.value ? <Close color='error' /> : <Check color='success' />}
                </Tooltip>
            );
        },
    },
    {
        field: 'avgScore',
        headerName: 'Avg Score',
        headerAlign: 'center',
        align: 'center',
        valueGetter(_value, row) {
            const scores = Object.values(row.answers).map((a) => a.score);
            const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return Math.round(10 * avg) / 10;
        },
        renderCell(params: GridRenderCellParams<Exam, number>) {
            const totalScore = getExamMaxScore(params.row);
            if (params.value === undefined || isNaN(params.value)) {
                return `- / ${totalScore}`;
            }
            return `${params.value} / ${totalScore}`;
        },
        flex: 1,
    },
];

const avgRatingColumn: GridColDef<Exam> = {
    field: 'avgRating',
    headerName: 'Avg Rating',
    headerAlign: 'center',
    align: 'center',
    valueGetter(_value, row) {
        const regression = getRegression(row);
        if (!regression) {
            return -1;
        }

        const sum = Object.values(row.answers)
            .map((a) => regression.predict(a.score))
            .reduce((sum, rating) => sum + rating, 0);

        return Math.round((10 * sum) / Object.values(row.answers).length) / 10;
    },
    renderCell(params: GridRenderCellParams<Exam, number>) {
        if (!params.value || params.value < 0 || isNaN(params.value)) {
            return (
                <Tooltip title='Avg rating is not calculated until at least 10 people have taken the exam.'>
                    <Help sx={{ color: 'text.secondary' }} />
                </Tooltip>
            );
        }
        return `${params.value}`;
    },
    flex: 1,
};

export const ExamsTable = ({ exams }: { exams: Exam[] }) => {
    const user = useAuth().user;
    const navigate = useNavigate();
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [upsellOpen, setUpsellOpen] = useState(false);
    const isFreeTier = useFreeTier();

    const examColumns = useMemo(() => {
        const examColumns: GridColDef<Exam>[] = [
            {
                field: 'name',
                headerName: 'Name',
                renderCell(params: GridRenderCellParams<Exam, string>) {
                    const hasAnswered = Boolean(params.row.answers[user?.username || '']);

                    const i = exams.findIndex((e) => e.id === params.row.id);
                    if (
                        !hasAnswered &&
                        i >= 1 &&
                        !exams[i - 1].answers[user?.username || '']
                    ) {
                        return (
                            <Tooltip title='This exam is locked until you complete the previous exam'>
                                <Stack direction='row' spacing={0.5} alignItems='center'>
                                    <Link color='text.disabled'>
                                        {params.value}{' '}
                                        <Lock
                                            fontSize='small'
                                            color='error'
                                            sx={{ verticalAlign: 'middle' }}
                                        />
                                    </Link>
                                </Stack>
                            </Tooltip>
                        );
                    }
                    return (
                        <Stack direction='row' spacing={0.5} alignItems='center'>
                            <Link sx={{ cursor: 'pointer' }}>
                                {params.value}{' '}
                                <OpenInNewIcon
                                    fontSize='small'
                                    color='primary'
                                    sx={{ verticalAlign: 'middle' }}
                                />
                            </Link>
                        </Stack>
                    );
                },
                flex: 1,
            },
            ...columns,
            {
                field: 'yourScore',
                headerName: 'Your Score',
                align: 'center',
                headerAlign: 'center',
                valueGetter(_value, row) {
                    if (!user) {
                        return -1;
                    }
                    const answer = row.answers[user.username];
                    if (!answer) {
                        return -1;
                    }
                    return answer.score;
                },
                renderCell(params: GridRenderCellParams<Exam, number>) {
                    const totalScore = getExamMaxScore(params.row);
                    if (params.value === undefined || params.value < 0) {
                        return `- / ${totalScore}`;
                    }
                    return `${params.value} / ${totalScore}`;
                },
                flex: 1,
            },
            avgRatingColumn,
            {
                field: 'yourRating',
                headerName: 'Your Rating',
                align: 'center',
                headerAlign: 'center',
                valueGetter(_value, row) {
                    if (!user || !row.answers[user.username]) {
                        return '';
                    }
                    const regression = getRegression(row);
                    if (!regression) {
                        return -1;
                    }
                    return (
                        Math.round(
                            10 * regression.predict(row.answers[user.username].score),
                        ) / 10
                    );
                },
                renderCell(params: GridRenderCellParams<Exam, number>) {
                    if (!params.value || params.value < 0 || isNaN(params.value)) {
                        return (
                            <Tooltip title='Your rating is not calculated until at least 10 people have taken the exam.'>
                                <Help sx={{ color: 'text.secondary' }} />
                            </Tooltip>
                        );
                    }
                    return `${params.value}`;
                },
            },
            {
                field: 'dateTaken',
                headerName: 'Date Taken',
                align: 'center',
                headerAlign: 'center',
                valueGetter(_value, row) {
                    if (!user) {
                        return '';
                    }
                    const answer = row.answers[user.username];
                    return answer
                        ? toDojoDateString(
                              new Date(answer.createdAt),
                              user.timezoneOverride,
                          )
                        : '';
                },
                flex: 1,
            },
        ];
        return examColumns;
    }, [user, exams]);

    const onClickRow = (params: GridRowParams<Exam>) => {
        if (params.row.answers[user?.username || '']) {
            navigate(`/tests/${params.row.type}/${params.row.id}/exam`, {
                state: { exam: params.row },
            });
            return;
        }

        const i = exams.findIndex((e) => e.id === params.row.id);
        if (!user?.isAdmin && i >= 1 && !exams[i - 1].answers[user?.username || '']) {
            setSnackbarOpen(true);
        } else if (i >= 1 && isFreeTier) {
            setUpsellOpen(true);
        } else {
            navigate(`/tests/${params.row.type}/${params.row.id}`, {
                state: { exam: params.row },
            });
        }
    };

    const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }

        setSnackbarOpen(false);
    };

    return (
        <>
            <DataGridPro
                autoHeight
                autoPageSize
                columns={examColumns}
                rows={exams}
                hideFooter
                onRowClick={onClickRow}
                disableRowSelectionOnClick
                disableColumnMenu
                disableColumnSelector
            />
            <Snackbar
                open={snackbarOpen}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity='error' variant='filled' onClose={handleClose}>
                    This exam is locked until you complete the previous exam.
                </Alert>
            </Snackbar>
            <UpsellDialog
                open={upsellOpen}
                onClose={() => setUpsellOpen(false)}
                currentAction={RestrictedAction.TacticsExams}
            />
        </>
    );
};
