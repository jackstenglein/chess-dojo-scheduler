import { Container, Stack, Typography } from '@mui/material';
import { ExamType } from '../../database/exam';
import { QueenIcon } from '../../style/ChessIcons';
import { ExamList } from './ExamList';

const TACTICS_RANGES = ['1500-2000', '2000+'];

/**
 * Renders the Material > Tests > Tactics Tests page.
 */
export const ListTacticsExamsPage = () => {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Typography variant='h4'>
                    <QueenIcon
                        fontSize='inherit'
                        sx={{ mr: 2, verticalAlign: 'center' }}
                    />
                    Tactics Tests
                </Typography>
                <ExamList cohortRanges={TACTICS_RANGES} examType={ExamType.Tactics} />
            </Stack>
        </Container>
    );
};
