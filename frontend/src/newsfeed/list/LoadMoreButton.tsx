import { Button, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { LoadingButton } from '@mui/lab';

import { Request } from '../../api/Request';
import { toDojoDateString } from '../../calendar/displayDate';
import { useAuth } from '../../auth/Auth';

interface LoadMoreButtonProps {
    request: Request;
    since?: string;
    startKey?: Record<string, string>;
    onLoadMore: () => void;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({
    request,
    since,
    startKey,
    onLoadMore,
}) => {
    const user = useAuth().user;

    if (Object.values(startKey || {}).length > 0) {
        return (
            <Stack alignItems='center' spacing={1}>
                <LoadingButton
                    variant='contained'
                    loading={request.isLoading()}
                    onClick={onLoadMore}
                >
                    Load More
                </LoadingButton>
            </Stack>
        );
    }

    console.log('Since: ', since);

    if (since) {
        const date = new Date(since);
        console.log('Since date: ', date);

        return (
            <Stack alignItems='center' spacing={1}>
                <CheckCircleOutlineIcon color='success' fontSize='large' />

                <Stack alignItems='center'>
                    <Typography fontWeight='bold' textAlign='center'>
                        You're all caught up
                    </Typography>
                    <Typography color='text.secondary' textAlign='center'>
                        You've seen all new posts since{' '}
                        {toDojoDateString(date, user?.timezoneOverride)}
                    </Typography>

                    <Button onClick={onLoadMore} sx={{ textTransform: 'none' }}>
                        View older posts
                    </Button>
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack alignItems='center' spacing={1}>
            <CheckCircleOutlineIcon color='success' fontSize='large' />

            <Stack alignItems='center'>
                <Typography fontWeight='bold' textAlign='center'>
                    No More Posts
                </Typography>
                <Typography color='text.secondary' textAlign='center'>
                    You've seen all posts in your newsfeed
                </Typography>
            </Stack>
        </Stack>
    );
};

export default LoadMoreButton;
