import { Link, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { Comment } from '../database/game';
import Avatar from '../profile/Avatar';

interface CommentListProps {
    comments: Comment[] | null;
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
    if (!comments) {
        return null;
    }

    return (
        <Stack spacing={3} mb={3}>
            {comments.map((comment) => (
                <CommentListItem key={comment.id} comment={comment} />
            ))}
        </Stack>
    );
};

interface CommentListItemProps {
    comment: Comment;
}

const CommentListItem: React.FC<CommentListItemProps> = ({ comment }) => {
    const createdAt = new Date(comment.createdAt);

    return (
        <Stack direction='row' spacing={1.5}>
            <Avatar
                username={comment.owner}
                displayName={comment.ownerDisplayName}
                size={40}
            />

            <Stack>
                <Paper elevation={2} sx={{ px: '12px', py: '8px', borderRadius: '6px' }}>
                    <Stack>
                        <Link component={RouterLink} to={`/profile/${comment.owner}`}>
                            <Typography variant='subtitle1' color='text.secondary'>
                                {comment.ownerDisplayName} ({comment.ownerCohort})
                            </Typography>
                        </Link>

                        <Typography sx={{ whiteSpace: 'pre-line' }}>
                            {comment.content}
                        </Typography>
                    </Stack>
                </Paper>
                <Typography variant='caption' color='text.secondary'>
                    {createdAt.toLocaleDateString()} • {createdAt.toLocaleTimeString()}
                </Typography>
            </Stack>
        </Stack>
    );
};

export default CommentList;
