import { Help } from '@mui/icons-material';
import { Alert, Container, Snackbar, Stack, Tooltip, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRowParams,
    GridValueFormatterParams,
} from '@mui/x-data-grid-pro';
import { SimpleLinearRegression } from 'ml-regression-simple-linear';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { toDojoDateString } from '../calendar/displayDate';
import { Exam, ExamType } from '../database/exam';
import LoadingPage from '../loading/LoadingPage';

const RANGES = ['1500-2100', '2100+'];

interface CohortRangeExams {
    cohortRange: string;
    exams: Exam[];
}

const ListTacticsExamsPage = () => {
    const api = useApi();
    const request = useRequest<Exam[]>();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();

            api.listExams(ExamType.Tactics)
                .then((exams) => {
                    console.log('Exams: ', exams);
                    request.onSuccess(exams);
                })
                .catch((err) => {
                    console.error('listExams: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    const cohortRanges = useMemo(() => {
        const cohortRanges: CohortRangeExams[] = [];
        if (request.data) {
            for (const range of RANGES) {
                const exams = request.data
                    .filter((c) => c.cohortRange === range)
                    .sort((lhs, rhs) => lhs.name.localeCompare(rhs.name));
                cohortRanges.push({
                    cohortRange: range,
                    exams,
                });
            }
        }
        return cohortRanges;
    }, [request]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 4 }}>
            <Stack spacing={4}>
                <Typography variant='h5'>Tactics Exams</Typography>

                {cohortRanges.map((range) => (
                    <Stack key={range.cohortRange}>
                        <Typography variant='h6'>{range.cohortRange}</Typography>

                        <ExamsTable exams={range.exams} />
                    </Stack>
                ))}
            </Stack>
            <RequestSnackbar request={request} />
        </Container>
    );
};

export default ListTacticsExamsPage;

/**
 * Returns the linear regression for this exam. If the exam has not been taken
 * by enough people, null is returned.
 * @param exam The exam to get the linear regression for.
 * @returns The linear regression, or null if the exam does not have enough answers.
 */
function getRegression(exam: Exam): SimpleLinearRegression | null {
    const answers = Object.values(exam.answers);
    if (answers.length < 10) {
        return null;
    }

    const x = answers.map((a) => a.score);
    const y = answers.map((a) => a.rating);
    return new SimpleLinearRegression(x, y);
}

const columns: GridColDef<Exam>[] = [
    {
        field: 'name',
        headerName: 'Name',
        flex: 1,
    },
    {
        field: 'problems',
        headerName: '# of Problems',
        valueGetter(params) {
            return params.row.problems.length;
        },
        align: 'center',
        headerAlign: 'center',
        flex: 1,
    },
    {
        field: 'timeLimitSeconds',
        headerName: 'Time Limit',
        valueFormatter: (params: GridValueFormatterParams<number>) => {
            return `${params.value / 60} min`;
        },
        headerAlign: 'center',
        align: 'center',
        flex: 1,
    },
    {
        field: 'avgScore',
        headerName: 'Avg Score',
        headerAlign: 'center',
        align: 'center',
        valueGetter(params) {
            const scores = Object.values(params.row.answers).map((a) => a.score);
            const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            return avg;
        },
        renderCell(params) {
            if (isNaN(params.value)) {
                return `- / ${params.row.totalScore}`;
            }
            return `${params.value} / ${params.row.totalScore}`;
        },
        flex: 1,
    },
];

const avgRatingColumn: GridColDef<Exam> = {
    field: 'avgRating',
    headerName: 'Avg Rating',
    headerAlign: 'center',
    align: 'center',
    valueGetter(params) {
        const regression = getRegression(params.row);
        if (!regression) {
            return -1;
        }

        const sum = Object.values(params.row.answers)
            .map((a) => regression.predict(a.score))
            .reduce((sum, rating) => sum + rating, 0);

        return Math.round((10 * sum) / Object.values(params.row.answers).length) / 10;
    },
    renderCell(params) {
        if (params.value < 0) {
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

const ExamsTable = ({ exams }: { exams: Exam[] }) => {
    const user = useAuth().user;
    const navigate = useNavigate();
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const examColumns = useMemo(() => {
        return columns.concat(
            {
                field: 'yourScore',
                headerName: 'Your Score',
                align: 'center',
                headerAlign: 'center',
                valueGetter(params) {
                    if (!user) {
                        return -1;
                    }
                    const answer = params.row.answers[user.username];
                    if (!answer) {
                        return -1;
                    }
                    return answer.score;
                },
                renderCell(params) {
                    if (params.value < 0) {
                        return `- / ${params.row.totalScore}`;
                    }
                    return `${params.value} / ${params.row.totalScore}`;
                },
                flex: 1,
            },
            avgRatingColumn,
            {
                field: 'yourRating',
                headerName: 'Your Rating',
                align: 'center',
                headerAlign: 'center',
                valueGetter(params) {
                    if (!user || !params.row.answers[user.username]) {
                        return '';
                    }
                    const regression = getRegression(params.row);
                    if (!regression) {
                        return -1;
                    }
                    return regression.predict(params.row.answers[user.username].score);
                },
                renderCell(params) {
                    if (params.value < 0) {
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
                valueGetter(params) {
                    if (!user) {
                        return '';
                    }
                    const answer = params.row.answers[user.username];
                    return answer
                        ? toDojoDateString(
                              new Date(answer.createdAt),
                              user.timezoneOverride,
                          )
                        : '';
                },
                flex: 1,
            },
        );
    }, [user]);

    const onClickRow = (params: GridRowParams<Exam>) => {
        if (params.row.answers[user?.username || '']) {
            navigate('/tactics/exam', { state: { exam: params.row } });
            return;
        }

        const i = exams.findIndex((e) => e.id === params.row.id);
        if (i >= 1 && !Boolean(exams[i - 1].answers[user?.username || ''])) {
            setSnackbarOpen(true);
        } else {
            navigate(`/tactics/instructions`, { state: { exam: params.row } });
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
                columns={examColumns}
                rows={exams}
                hideFooter
                onRowClick={onClickRow}
                disableRowSelectionOnClick
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
        </>
    );
};