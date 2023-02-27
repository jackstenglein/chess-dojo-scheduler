import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import { useMemo, useState } from 'react';
import { Comment as CommentModel } from '../database/game';
import Comment from './Comment';

interface CommentListProps {
    comments: CommentModel[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
    const [sortOrder, setSortOrder] = useState('DESC');

    const sortedComments = useMemo(() => {
        if (sortOrder === 'ASC') {
            return comments;
        }
        return comments.slice().reverse();
    }, [sortOrder, comments]);

    return (
        <Stack alignItems='start' spacing={3}>
            <FormControl>
                <InputLabel id='comment-sort-select-label'>Sort By</InputLabel>
                <Select
                    labelId='comment-sort-select-label'
                    id='comment-sort-select'
                    value={sortOrder}
                    label='Sort By'
                    onChange={(e) => setSortOrder(e.target.value)}
                >
                    <MenuItem value={'DESC'}>Newest First</MenuItem>
                    <MenuItem value={'ASC'}>Oldest First</MenuItem>
                </Select>
            </FormControl>

            {sortedComments.map((comment) => (
                <Comment comment={comment} key={comment.id} />
            ))}
        </Stack>
    );
};

export default CommentList;
