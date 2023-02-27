import { Stack, Typography } from '@mui/material';
import { Comment as CommentModel } from '../database/game';

interface CommentProps {
    comment: CommentModel;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
    const createdAt = new Date(comment.createdAt);

    return (
        <Stack>
            <Typography variant='subtitle1' color='text.secondary'>
                {comment.ownerDiscord} • {createdAt.toLocaleString()}
            </Typography>
            <Typography variant='body1'>{comment.content}</Typography>
        </Stack>
    );
};

export default Comment;
