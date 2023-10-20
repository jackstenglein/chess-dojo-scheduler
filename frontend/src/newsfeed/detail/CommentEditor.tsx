import { useState } from 'react';
import { CircularProgress, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

import { useAuth } from '../../auth/Auth';
import Avatar from '../../profile/Avatar';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { TimelineEntry } from '../../database/timeline';
import { useApi } from '../../api/Api';

interface CommentEditorProps {
    owner: string;
    id: string;
    onSuccess: (entry: TimelineEntry) => void;
}

const CommentEditor: React.FC<CommentEditorProps> = ({ owner, id, onSuccess }) => {
    const user = useAuth().user!;
    const [comment, setComment] = useState('');
    const request = useRequest();
    const api = useApi();

    const onSubmit = () => {
        const content = comment.trim();
        if (content.length === 0) {
            return;
        }

        request.onStart();
        api.createNewsfeedComment(owner, id, content)
            .then((resp) => {
                console.log(resp);
                setComment('');
                onSuccess(resp.data);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Stack direction='row' spacing={1} alignItems='start' width={1}>
            <RequestSnackbar request={request} />

            <Avatar user={user} size={40} />
            <TextField
                label='Add a comment...'
                fullWidth
                multiline
                value={comment}
                onChange={(e) => setComment(e.target.value)}
            />

            {request.isLoading() ? (
                <div style={{ alignSelf: 'end' }}>
                    <CircularProgress size={40} />
                </div>
            ) : (
                <Tooltip title='Post Comment'>
                    <div style={{ alignSelf: 'end' }}>
                        <IconButton
                            onClick={onSubmit}
                            disabled={comment.trim() === ''}
                            color='primary'
                        >
                            <SendIcon />
                        </IconButton>
                    </div>
                </Tooltip>
            )}
        </Stack>
    );
};

export default CommentEditor;
