import { Card, CardContent, Divider, Stack, Typography } from '@mui/material';
import CircleIcon from '@mui/icons-material/Circle';

import { ScoreboardDisplay, TimelineEntry } from '../database/requirement';
import { CategoryColors } from '../profile/activity/activity';
import ScoreboardProgress from '../scoreboard/ScoreboardProgress';
import CommentEditor from './CommentEditor';
import CommentList from './CommentList';
import ReactionList from './ReactionList';
import NewsfeedItemHeader from './NewsfeedItemHeader';
import GraduationNewsfeedItem from './GraduationNewsfeedItem';

interface NewsfeedItemProps {
    entry: TimelineEntry;
    onEdit: (entry: TimelineEntry) => void;
}

const NewsfeedItem: React.FC<NewsfeedItemProps> = ({ entry, onEdit }) => {
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

                    <CommentList comments={entry.comments} />
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
