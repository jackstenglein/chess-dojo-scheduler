import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

import { ScoreboardDisplay, formatTime } from '../../database/requirement';
import { TimelineEntry } from '../../database/timeline';
import { CategoryColors } from '../../profile/activity/activity';
import ScoreboardProgress from '../../scoreboard/ScoreboardProgress';
import CommentEditor from './CommentEditor';
import CommentList from './CommentList';
import ReactionList from './ReactionList';
import NewsfeedItemHeader from './NewsfeedItemHeader';
import GraduationNewsfeedItem from './GraduationNewsfeedItem';
import GameNewsfeedItem from './GameNewsfeedItem';

interface NewsfeedItemProps {
    entry: TimelineEntry;
    onEdit: (entry: TimelineEntry) => void;
    maxComments?: number;
}

const NewsfeedItem: React.FC<NewsfeedItemProps> = ({ entry, onEdit, maxComments }) => {
    return (
        <Card variant='outlined'>
            <CardContent>
                <Stack spacing={3}>
                    <NewsfeedItemHeader entry={entry} />
                    <NewsfeedItemBody entry={entry} />

                    <ReactionList
                        owner={entry.owner}
                        id={entry.id}
                        reactions={entry.reactions}
                        onEdit={onEdit}
                    />

                    <Divider sx={{ width: 1 }} />

                    <CommentList
                        comments={entry.comments}
                        maxComments={maxComments}
                        viewCommentsLink={`/newsfeed/${entry.owner}/${entry.id}`}
                    />
                    <CommentEditor owner={entry.owner} id={entry.id} onSuccess={onEdit} />
                </Stack>
            </CardContent>
        </Card>
    );
};

const NewsfeedItemBody: React.FC<Omit<NewsfeedItemProps, 'onEdit'>> = ({ entry }) => {
    if (entry.requirementId === 'Graduation') {
        return <GraduationNewsfeedItem entry={entry} />;
    }
    if (entry.requirementId === 'GameSubmission') {
        return <GameNewsfeedItem entry={entry} />;
    }

    const isComplete = entry.newCount >= entry.totalCount;
    const isSlider =
        entry.scoreboardDisplay === ScoreboardDisplay.ProgressBar ||
        entry.scoreboardDisplay === ScoreboardDisplay.Unspecified;

    return (
        <Stack mt={3} spacing={1}>
            <Stack direction='row' spacing={1}>
                <CircleIcon htmlColor={CategoryColors[entry.requirementCategory]} />
                <Typography>
                    {entry.requirementCategory} - {entry.cohort}
                </Typography>
            </Stack>

            <Typography>
                {isComplete ? 'Completed' : 'Updated'}{' '}
                <strong>{entry.requirementName}</strong>
            </Typography>

            <Stack pt={1}>
                {entry.minutesSpent > 0 && (
                    <Typography>
                        <Typography component='span' color='text.secondary'>
                            New Time:
                        </Typography>{' '}
                        {formatTime(entry.minutesSpent)}
                    </Typography>
                )}

                {entry.totalMinutesSpent > 0 && (
                    <Typography>
                        <Typography component='span' color='text.secondary'>
                            Total Time:
                        </Typography>{' '}
                        {formatTime(entry.totalMinutesSpent)}
                    </Typography>
                )}
            </Stack>

            {isSlider && (
                <ScoreboardProgress
                    value={entry.newCount}
                    min={0}
                    max={entry.totalCount}
                    suffix={entry.progressBarSuffix}
                />
            )}
        </Stack>
    );
};

export default NewsfeedItem;
