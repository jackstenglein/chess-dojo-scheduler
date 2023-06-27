import { Typography } from '@mui/material';

interface CommentProps {
    text?: string;
    inline?: boolean;
}

const Comment: React.FC<CommentProps> = ({ text, inline }) => {
    if (!text) {
        return null;
    }

    if (inline) {
        return (
            <Typography variant='caption' color='text.secondary' display='inline'>
                {text}
            </Typography>
        );
    }

    return (
        <Typography variant='body2' color='text.secondary' p='4px'>
            {text}
        </Typography>
    );
};

export default Comment;
