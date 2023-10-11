import { Stack, Typography } from '@mui/material';
import { TimelineEntry, formatTime } from '../../database/requirement';

interface GraduationNewsfeedItemProps {
    entry: TimelineEntry;
}

const GraduationNewsfeedItem: React.FC<GraduationNewsfeedItemProps> = ({ entry }) => {
    return (
        <Stack mt={3}>
            <Typography>
                <Typography component='span' color='text.secondary'>
                    Graduated from
                </Typography>{' '}
                <strong>{entry.cohort}</strong>{' '}
                <Typography component='span' color='text.secondary'>
                    into
                </Typography>{' '}
                <strong>{entry.newCohort}</strong>
            </Typography>

            <Stack mt={1} mb={2}>
                <Typography>
                    <Typography component='span' color='text.secondary'>
                        Dojo Score:
                    </Typography>{' '}
                    {Math.round(100 * (entry.dojoScore || 0)) / 100}
                </Typography>

                <Typography>
                    <Typography component='span' color='text.secondary'>
                        Dojo Time:
                    </Typography>{' '}
                    {formatTime(entry.dojoMinutes || 0)}
                </Typography>
                <Typography>
                    <Typography component='span' color='text.secondary'>
                        Non-Dojo Time:
                    </Typography>{' '}
                    {formatTime(entry.nonDojoMinutes || 0)}
                </Typography>
            </Stack>

            {entry.graduationComments && (
                <Typography whiteSpace='pre-line'>{entry.graduationComments}</Typography>
            )}
        </Stack>
    );
};

export default GraduationNewsfeedItem;
