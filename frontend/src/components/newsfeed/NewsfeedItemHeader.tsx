import { useAuth } from '@/auth/Auth';
import { toDojoDateString, toDojoTimeString } from '@/components/calendar/displayDate';
import { RequirementCategory } from '@/database/requirement';
import { TimelineEntry, TimelineSpecialRequirementId } from '@/database/timeline';
import Avatar from '@/profile/Avatar';
import CohortIcon from '@/scoreboard/CohortIcon';
import { CategoryColors } from '@/style/ThemeProvider';
import { Box, Stack, Typography } from '@mui/material';
import { Link } from '../navigation/Link';

interface NewsfeedItemHeaderProps {
    entry: TimelineEntry;
}

const NewsfeedItemHeader: React.FC<NewsfeedItemHeaderProps> = ({ entry }) => {
    const { user } = useAuth();

    const timezone = user?.timezoneOverride;
    const timeFormat = user?.timeFormat;

    const createdAt = new Date(entry.date || entry.createdAt);
    const date = toDojoDateString(createdAt, timezone, 'backward', {
        month: 'long',
        day: 'numeric',
    });
    const time = toDojoTimeString(createdAt, timezone, timeFormat, 'backward', {
        hour: 'numeric',
        minute: '2-digit',
    });

    const category =
        entry.requirementId === TimelineSpecialRequirementId.GameSubmission
            ? RequirementCategory.Games
            : entry.requirementCategory;

    return (
        <Stack
            direction='row'
            justifyContent='space-between'
            alignItems='center'
            mb={2}
            flexWrap='wrap'
            rowGap={1}
        >
            <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar username={entry.owner} displayName={entry.ownerDisplayName} size={60} />

                <Stack>
                    <Typography>
                        <Link href={`/profile/${entry.owner}`}>{entry.ownerDisplayName}</Link>
                        <CohortIcon
                            cohort={entry.graduationInfo?.newCohort || entry.cohort}
                            size={25}
                            sx={{ marginLeft: '0.6rem', verticalAlign: 'middle' }}
                            tooltip={`Member of the ${entry.graduationInfo?.newCohort || entry.cohort} cohort`}
                        />
                    </Typography>

                    <Typography variant='body2' color='text.secondary'>
                        {date} at {time}
                    </Typography>
                </Stack>
            </Stack>

            {entry.requirementId === 'Graduation' ? (
                <Box sx={{ display: { xs: 'none', sm: 'initial' } }}>
                    <CohortIcon cohort={entry.cohort} size={50} />
                </Box>
            ) : (
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Stack alignItems='end'>
                        <Typography sx={{ color: CategoryColors[category] }}>{category}</Typography>
                        {entry.isCustomRequirement && (
                            <Typography variant='body2' color='text.secondary'>
                                Custom Task
                            </Typography>
                        )}
                        <Typography variant='body2' color='text.secondary'>
                            {entry.cohort}
                        </Typography>
                    </Stack>
                </Stack>
            )}
        </Stack>
    );
};

export default NewsfeedItemHeader;
