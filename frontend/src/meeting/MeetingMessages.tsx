import { Box, Card, CardContent, CardHeader, Stack } from '@mui/material';
import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../api/Api';
import { useCache } from '../api/cache/Cache';
import { useRequiredAuth } from '../auth/Auth';
import { Event, EventType } from '../database/event';
import LoadingPage from '../loading/LoadingPage';
import CommentEditor from '../newsfeed/detail/CommentEditor';
import CommentList from '../newsfeed/detail/CommentList';

const MeetingMessages = () => {
    const { user } = useRequiredAuth();
    const { meetingId } = useParams();
    const cache = useCache();
    const api = useApi();
    const bottomRef = useRef<HTMLDivElement>(null);

    const meeting = cache.events.get(meetingId || '');
    const messages = meeting?.messages;

    useEffect(() => {
        bottomRef.current?.scrollTo(0, bottomRef.current.scrollHeight || 0);
    }, [messages]);

    if (!meeting) {
        if (cache.isLoading) {
            return <LoadingPage />;
        }
        return null;
    }

    if (
        meeting.type === EventType.Coaching &&
        meeting.owner !== user.username &&
        !meeting.participants[user.username]?.hasPaid
    ) {
        return null;
    }

    const onSuccess = (event: Event) => {
        cache.events.put(event);
    };

    return (
        <Card
            variant='outlined'
            sx={{
                height: 'calc(100vh - var(--navbar-height) - 48px)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <CardHeader title='Messages' />
            <CardContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                }}
            >
                <Stack
                    sx={{
                        flexGrow: 1,
                        flexShrink: 1,
                        flexBasis: 'auto',
                        position: 'relative',
                    }}
                >
                    <Box
                        ref={bottomRef}
                        sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            right: 0,
                            left: 0,
                            overflowY: 'auto',
                        }}
                    >
                        <CommentList comments={meeting.messages || []} />
                    </Box>
                </Stack>

                <Box sx={{ flexShrink: 0, pt: 2 }}>
                    <CommentEditor
                        createFunctionProps={meetingId || ''}
                        createFunction={api.createMessage}
                        onSuccess={onSuccess}
                        label='Send a message...'
                        tooltip='Send Message'
                    />
                </Box>
            </CardContent>
        </Card>
    );
};

export default MeetingMessages;
