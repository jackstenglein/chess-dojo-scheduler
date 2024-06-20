import { Card, CardContent, Stack, Typography } from '@mui/material';
import { ExamType } from '../../database/exam';
import { KingIcon } from '../../style/ChessIcons';
import { getColorBasedOnExamType } from '../view/ExamCard';
import { ExamList } from './ExamList';

const POLGAR_RANGES = ['0-500', '500-1000', '1000-1500', '1500+'];

/**
 * Renders the Material > Tests > Checkmate Tests page.
 */
export const ListCheckmateExamsPage = () => {
    return (
            <Stack spacing={4}>
                <Card variant='outlined'>
                    <CardContent>
                        <Typography variant='h4'>
                            <KingIcon
                                fontSize='inherit'
                                sx={{ mr: 2, verticalAlign: 'center' }}
                                color={getColorBasedOnExamType(ExamType.Polgar)}
                            />
                            Checkmate Tests
                        </Typography>
                        <ExamList
                            cohortRanges={POLGAR_RANGES}
                            examType={ExamType.Polgar}
                        />
                    </CardContent>
                </Card>
            </Stack>
    );
};

export default ListCheckmateExamsPage;
