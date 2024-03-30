import { Stack } from '@mui/material';
import { PositionComment } from '../../../../../database/game';
import Comment from './Comment';
import { SortBy, usePositionCommentSort } from './Comments';

interface RepliesProps {
    comment: PositionComment;
}

const Replies: React.FC<RepliesProps> = ({ comment }) => {
    const { sortBy } = usePositionCommentSort();

    const replies = Object.values(comment.replies);
    if (replies.length === 0) {
        return null;
    }

    const sortedComments = replies.sort((lhs, rhs) => {
        if (sortBy === SortBy.Newest) {
            return rhs.createdAt.localeCompare(lhs.createdAt);
        }
        return lhs.createdAt.localeCompare(rhs.createdAt);
    });

    return (
        <Stack pt={1} spacing={1.5}>
            {sortedComments.map((reply) => (
                <Comment key={reply.id} comment={reply} />
            ))}
        </Stack>
    );
};

export default Replies;
