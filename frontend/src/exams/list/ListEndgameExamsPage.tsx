import { ExamType } from '@jackstenglein/chess-dojo-common/src/database/exam';
import { Container, Stack, Typography } from '@mui/material';
import { RookIcon } from '../../style/ChessIcons';
import { ExamList } from './ExamList';

const COHORT_RANGES = ['0-1000', '1000-1500', '1500-2000', '2000+'];

/**
 * Renders the Material > Tests > Endgame Tests page.
 */
export const ListEndgameExamsPage = () => {
    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={4}>
                <Typography variant='h4'>
                    <RookIcon
                        fontSize='inherit'
                        sx={{ mr: 2, verticalAlign: 'center' }}
                    />
                    Endgame Tests
                </Typography>
                <ExamList cohortRanges={COHORT_RANGES} examType={ExamType.Endgame} />
            </Stack>
        </Container>
    );
};
