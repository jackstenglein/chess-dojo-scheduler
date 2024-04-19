import { Container, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridRowParams,
    GridValueFormatterParams,
} from '@mui/x-data-grid-pro';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { toDojoDateString } from '../calendar/displayDate';
import { Exam, ExamType } from '../database/exam';
import LoadingPage from '../loading/LoadingPage';

const RANGES = ['1700-2100', '2100+'];

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

const ExamsTable = ({ exams }: { exams: Exam[] }) => {
    const user = useAuth().user;
    const navigate = useNavigate();

    const onClickRow = (params: GridRowParams<Exam>) => {
        if (params.row.answers[user?.username || '']) {
            navigate('/tactics/exam', { state: { exam: params.row } });
        } else {
            navigate(`/tactics/instructions`, { state: { exam: params.row } });
        }
    };

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

    return (
        <DataGridPro
            autoHeight
            columns={examColumns}
            rows={exams}
            hideFooter
            onRowClick={onClickRow}
        />
    );
};
