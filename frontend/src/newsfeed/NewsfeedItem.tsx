import { Card, CardContent, Divider, Link, Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';
import { Link as RouterLink } from 'react-router-dom';

import { ScoreboardDisplay, TimelineEntry } from '../database/requirement';
import Avatar from '../profile/Avatar';
import { CategoryColors } from '../profile/activity/activity';
import ScoreboardProgress from '../scoreboard/ScoreboardProgress';
import { getTimeSpent } from '../profile/activity/ActivityTimeline';
import CommentEditor from './CommentEditor';
import CommentList from './CommentList';

interface NewsfeedItemProps {
    entry: TimelineEntry;
    onComment: (entry: TimelineEntry) => void;
}

const NewsfeedItem: React.FC<NewsfeedItemProps> = ({ entry, onComment }) => {
    const createdAt = new Date(entry.createdAt);
    const date = createdAt.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
    });
    const time = createdAt.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });
    const isComplete = entry.newCount >= entry.totalCount;
    const isSlider =
        entry.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        entry.scoreboardDisplay === ScoreboardDisplay.Unspecified;
    const timeSpent = getTimeSpent(entry);

    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack direction='row' spacing={2} alignItems='center'>
                    <Avatar
                        username={entry.owner}
                        displayName={entry.ownerDisplayName}
                        size={60}
                    />

                    <Stack>
                        <Typography>
                            <Link component={RouterLink} to={`/profile/${entry.owner}`}>
                                {entry.ownerDisplayName}
                            </Link>
                        </Typography>

                        <Typography variant='body2' color='text.secondary'>
                            {date} at {time}
                        </Typography>
                    </Stack>
                </Stack>

                <Stack mt={3} spacing={1}>
                    <Stack direction='row' spacing={1}>
                        <CircleIcon
                            htmlColor={CategoryColors[entry.requirementCategory]}
                        />
                        <Typography>
                            {entry.requirementCategory} - {entry.cohort}
                        </Typography>
                    </Stack>

                    <Typography>
                        {isComplete ? 'Completed' : 'Updated'}{' '}
                        <strong>{entry.requirementName}</strong>
                    </Typography>

                    {isSlider && (
                        <ScoreboardProgress
                            value={entry.newCount}
                            min={0}
                            max={entry.totalCount}
                            suffix={entry.progressBarSuffix}
                        />
                    )}

                    {timeSpent && (
                        <Typography variant='subtitle2'>{timeSpent}</Typography>
                    )}
                </Stack>

                <Divider sx={{ width: 1, my: 3 }} />

                <CommentList comments={entry.comments} />

                <CommentEditor owner={entry.owner} id={entry.id} onSuccess={onComment} />
            </CardContent>
        </Card>
    );
};

export default NewsfeedItem;
