import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';

import { ScoreboardDisplay, formatTime } from '../../database/requirement';
import { TimelineEntry } from '../../database/timeline';
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
                <Stack>
                    <NewsfeedItemHeader entry={entry} />
                    <NewsfeedItemBody entry={entry} />

                    <ReactionList
                        owner={entry.owner}
                        id={entry.id}
                        reactions={entry.reactions}
                        onEdit={onEdit}
                    />

                    <Divider sx={{ width: 1, mt: 1, mb: 2 }} />

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
        <Stack spacing={0.5}>
            <Typography>
                {isComplete ? 'Completed' : 'Updated'}{' '}
                <strong>{entry.requirementName}</strong>
            </Typography>

            {entry.totalMinutesSpent > 0 && entry.minutesSpent > 0 && (
                <Stack direction='row' spacing={1}>
                    <Typography component='span' color='text.secondary'>
                        Total Time:
                    </Typography>
                    <Typography>
                        {formatTime(entry.totalMinutesSpent - entry.minutesSpent)}
                    </Typography>
                    <ArrowRightAltIcon sx={{ color: 'text.secondary' }} />
                    <Typography>{formatTime(entry.totalMinutesSpent)}</Typography>
                </Stack>
            )}

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
