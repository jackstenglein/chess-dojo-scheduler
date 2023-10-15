import { useMemo, useState } from 'react';
import { Button, IconButton, Menu, Stack, Tooltip, Typography } from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';

import { TimelineEntry, Reaction } from '../../database/timeline';
import { useAuth } from '../../auth/Auth';
import { User } from '../../database/user';
import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';

const ReactionTypes = [
    '\u2764\uFE0F', // heart
    '😃',
    '👍',
    '🤯',
    '🎉',
];

function isReactor(
    user: User,
    reactions: Record<string, Reaction> | null,
    type: string
): boolean {
    if (!reactions) {
        return false;
    }
    if (!reactions[user.username]) {
        return false;
    }
    return reactions[user.username].types?.includes(type) || false;
}

function getNewTypes(
    user: User,
    reactions: Record<string, Reaction> | null,
    type: string
): string[] {
    if (!reactions) {
        return [type];
    }
    if (!reactions[user.username]) {
        return [type];
    }

    const types = reactions[user.username].types?.filter((t) => t !== type) || [];
    if (types.length === (reactions[user.username].types?.length || 0)) {
        return types.concat(type);
    }
    return types;
}

interface ReactionListProps {
    owner: string;
    id: string;
    reactions: Record<string, Reaction> | null;
    onEdit: (entry: TimelineEntry) => void;
}

const ReactionList: React.FC<ReactionListProps> = ({ owner, id, reactions, onEdit }) => {
    const user = useAuth().user!;
    const api = useApi();
    const request = useRequest();

    const reactionMap = useMemo(() => {
        const reactionMap: Record<string, string[]> = {};
        for (const reaction of Object.values(reactions || {})) {
            for (const type of reaction.types || []) {
                if (reactionMap[type]) {
                    reactionMap[type].push(reaction.displayName);
                } else {
                    reactionMap[type] = [reaction.displayName];
                }
            }
        }
        return reactionMap;
    }, [reactions]);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorEl(null);
    };

    const onReact = (type: string) => {
        const types = getNewTypes(user, reactions, type);

        request.onStart();
        api.setNewsfeedReaction(owner, id, types)
            .then((resp) => {
                console.log('setNewsfeedReaction: ', resp);
                onEdit(resp.data);
                request.onSuccess();
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
        handleClose();
    };

    return (
        <Stack direction='row' spacing={1}>
            <RequestSnackbar request={request} />

            {Object.entries(reactionMap).map(([type, reactors]) => (
                <Tooltip title={`Reacted by ${reactors.join(', ')}`}>
                    <Button
                        key={type}
                        variant={
                            isReactor(user, reactions, type) ? 'contained' : 'outlined'
                        }
                        onClick={() => onReact(type)}
                    >
                        <Typography fontSize='1.25rem'>{type}</Typography>

                        <Typography ml='0.375rem' fontWeight='600'>
                            {reactors.length}
                        </Typography>
                    </Button>
                </Tooltip>
            ))}

            <Tooltip title='Add Reaction'>
                <IconButton color='primary' onClick={handleClick}>
                    <AddReactionIcon />
                </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <Stack
                    px={1}
                    columnGap={0.5}
                    direction='row'
                    flexWrap='wrap'
                    sx={{ maxWidth: 'calc(6 * 2.96875rem)' }}
                >
                    {ReactionTypes.map((type) => (
                        <IconButton
                            key={type}
                            sx={{ width: '2.96875rem' }}
                            onClick={() => onReact(type)}
                        >
                            {type}
                        </IconButton>
                    ))}
                </Stack>
            </Menu>
        </Stack>
    );
};

export default ReactionList;
