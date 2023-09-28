import { Stack, Typography, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { Comment as CommentModel } from '../../database/game';
import GraduationIcon from '../../scoreboard/GraduationIcon';
import Avatar from '../../profile/Avatar';

interface CommentProps {
    comment: CommentModel;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
    const createdAt = new Date(comment.createdAt);

    return (
        <Stack spacing={1}>
            <Stack direction='row' spacing={1.5}>
                <Avatar
                    username={comment.owner}
                    displayName={comment.ownerDisplayName}
                    size={48}
                />
                <Stack>
                    <Stack direction='row' spacing={1} alignItems='center'>
                        <Link component={RouterLink} to={`/profile/${comment.owner}`}>
                            <Typography variant='subtitle1' color='text.secondary'>
                                {comment.ownerDisplayName} ({comment.ownerCohort})
                            </Typography>
                        </Link>
                        <GraduationIcon cohort={comment.ownerPreviousCohort} size={20} />
                    </Stack>
                    <Typography variant='subtitle2' color='text.secondary'>
                        {createdAt.toLocaleString()}
                    </Typography>
                </Stack>
            </Stack>
            <Typography variant='body1' style={{ whiteSpace: 'pre-line' }}>
                {comment.content}
            </Typography>
        </Stack>
    );
};

export default Comment;
