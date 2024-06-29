import { Card, CardContent, Container, Stack, Typography } from '@mui/material';
import { ExamType } from '../../database/exam';
import { QueenIcon } from '../../style/ChessIcons';
import { getColorBasedOnExamType } from '../view/ExamCard';
import { ExamList } from './ExamList';
import ListCheckmateExamsPage from './ListCheckmateExamsPage';
const TACTICS_RANGES = ['0-1000', '1000-1500', '1500-2000', '2000+'];

/**
 * Renders the Material > Tests > Tactics Tests page.
 */
export const ListTacticsExamsPage = () => {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardContent>
                        <Typography variant='h4'>
                            <QueenIcon
                                fontSize='inherit'
                                sx={{ mr: 2, verticalAlign: 'center' }}
                                color={getColorBasedOnExamType(ExamType.Tactics)}
                            />
                            Tactics Tests
                        </Typography>
                        <ExamList
                            cohortRanges={TACTICS_RANGES}
                            examType={ExamType.Tactics}
                        />
                    </CardContent>
                </Card>
            </Stack>
            <ListCheckmateExamsPage />
        </Container>
    );
};
