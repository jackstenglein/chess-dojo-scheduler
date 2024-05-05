import { ExpandLess, ExpandMore } from '@mui/icons-material';
import {
    Collapse,
    Container,
    Divider,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { Exam, ExamType } from '../../database/exam';
import LoadingPage from '../../loading/LoadingPage';
import ExamsTable from './ExamsTable';

const TACTICS_RANGES = ['1500-2000', '2000+'];
const POLGAR_RANGES = ['0-500', '500-1000', '1000-1500', '1500+'];

/**
 * Renders the Material > Tactics Tests page.
 */
const ListTacticsExamsPage = () => {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={7}>
                <ExamListSection
                    title='Tactics Tests'
                    cohortRanges={TACTICS_RANGES}
                    examType={ExamType.Tactics}
                />
                <ExamListSection
                    title='Polgar Mate Tests'
                    cohortRanges={POLGAR_RANGES}
                    examType={ExamType.Polgar}
                />
            </Stack>
        </Container>
    );
};

export default ListTacticsExamsPage;

interface CohortRangeExams {
    name: string;
    exams: Exam[];
}

interface ExamListSectionProps {
    title: string;
    cohortRanges: string[];
    examType: ExamType;
}

/**
 * Renders a section of exams.
 * @param title The title of the section
 * @param cohortRanges The cohort ranges that apply to this section
 * @param examType The type of exam shown in this section
 */
const ExamListSection: React.FC<ExamListSectionProps> = ({
    title,
    cohortRanges,
    examType,
}) => {
    const api = useApi();
    const request = useRequest<Exam[]>();
    const [expanded, setExpanded] = useState(true);

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
    }, [request, api]);

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
    }, [request]);

    return (
        <Stack spacing={2}>
            <Stack>
                <Stack spacing={1} direction='row' alignItems='center'>
                    <Tooltip title={expanded ? 'Collapse Section' : 'Expand Section'}>
                        <IconButton onClick={() => setExpanded(!expanded)}>
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Tooltip>
                    <Typography variant='h5'>{title}</Typography>
                </Stack>
                <Divider />
            </Stack>

            {!request.isSent() || request.isLoading() ? (
                <LoadingPage />
            ) : (
                <Collapse in={expanded}>
                    <Stack spacing={3}>
                        {ranges.map((range) => (
                            <Stack key={range.name}>
                                <Typography variant='h6'>{range.name}</Typography>

                                <ExamsTable exams={range.exams} />
                            </Stack>
                        ))}
                    </Stack>
                </Collapse>
            )}

            <RequestSnackbar request={request} />
        </Stack>
    );
};
