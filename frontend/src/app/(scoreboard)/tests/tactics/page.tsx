import { ExamList } from '@/components/exams/ExamList';
import { QueenIcon } from '@/style/ChessIcons';
import { ExamType } from '@jackstenglein/chess-dojo-common/src/database/exam';
import { Container, Stack, Typography } from '@mui/material';

const TACTICS_RANGES = ['0-1000', '1000-1500', '1500-2000', '2000+'];

/**
 * Renders the Material > Tests > Tactics Tests page.
 */
export default function ListTacticsExamsPage() {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Typography variant='h4'>
                    <QueenIcon fontSize='inherit' sx={{ mr: 2, verticalAlign: 'center' }} />
                    Tactics Tests
                </Typography>
                <ExamList cohortRanges={TACTICS_RANGES} examType={ExamType.Tactics} />
            </Stack>
        </Container>
    );
}
