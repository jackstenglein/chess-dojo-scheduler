import { PositionComment } from '@/database/game';
import { Stack } from '@mui/material';
import Comment from './Comment';
import { SortBy, usePositionCommentSort } from './Comments';

interface RepliesProps {
    comment: PositionComment;
    isReadonly?: boolean;
}

const Replies: React.FC<RepliesProps> = ({ isReadonly, comment }) => {
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
                <Comment isReadonly={isReadonly} key={reply.id} comment={reply} />
            ))}
        </Stack>
    );
};

export default Replies;
