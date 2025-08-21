import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { useAuth } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import { getConfig } from '@/config';
import { FollowerEntry } from '@/database/follower';
import { User } from '@/database/user';
import Avatar from '@/profile/Avatar';
import GraduationDialog from '@/profile/GraduationDialog';
import CohortIcon from '@/scoreboard/CohortIcon';
import { Check, Link as LinkIcon, Settings, ThumbDown, ThumbUp } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import copy from 'copy-to-clipboard';
import { useEffect, useState } from 'react';
import Bio from './Bio';
import CoachChip from './CoachChip';
import CountChip from './CountChip';
import CreatedAtChip from './CreatedAtChip';
import DiscordChip from './DiscordChip';
import InactiveChip from './InactiveChip';
import TimezoneChip from './TimezoneChip';

const BASE_URL = getConfig().baseUrl;

/**
 * Renders a card with the info for the given user.
 * @param user The user to render info for.
 * @param setFollowerCount Callback invoked to set the cached follower count for the given user.
 */
export function UserCard({
    user,
    setFollowerCount,
}: {
    user: User;
    setFollowerCount: (count: number) => void;
}) {
    const { user: viewer, updateUser } = useAuth();
    const isOwner = viewer?.username === user.username;
    const followRequest = useRequest<FollowerEntry>();
    const api = useApi();
    const [copied, setCopied] = useState('');

    const username = user.username;
    useEffect(() => {
        if (!isOwner && !followRequest.isSent()) {
            followRequest.onStart();
            api.getFollower(username)
                .then((resp) => {
                    followRequest.onSuccess(resp.data || undefined);
                })
                .catch((err) => {
                    console.error(err);
                    followRequest.onFailure(err);
                });
        }
    }, [api, isOwner, followRequest, username]);

    const onFollow = () => {
        if (isOwner || !viewer) {
            return;
        }

        const action = followRequest.data ? 'unfollow' : 'follow';

        followRequest.onStart();
        api.editFollower(user.username, action)
            .then((resp) => {
                const incrementalCount = action === 'follow' ? 1 : -1;
                updateUser({
                    followingCount: viewer.followingCount + incrementalCount,
                });
                setFollowerCount(user.followerCount + incrementalCount);
                followRequest.onSuccess(resp.data || undefined);
            })
            .catch((err) => {
                console.error(err);
                followRequest.onFailure(err);
            });
    };

    const onCopyUrl = () => {
        copy(`${BASE_URL}/profile/${user.username}`);
        setCopied('url');
        setTimeout(() => setCopied(''), 3000);
    };

    return (
        <Card sx={{ position: 'relative', height: { xs: 1, lg: 'unset' } }}>
            <RequestSnackbar request={followRequest} />

            <Stack
                direction='row'
                sx={{
                    position: 'absolute',
                    right: 'var(--mui-spacing)',
                    top: 'calc(0.5 * var(--mui-spacing))',
                }}
            >
                <Tooltip title='Copy Profile URL' onClick={onCopyUrl}>
                    <IconButton>
                        {copied === 'url' ? (
                            <Check sx={{ color: 'text.secondary' }} />
                        ) : (
                            <LinkIcon
                                sx={{ color: 'text.secondary', transform: 'rotate(90deg)' }}
                            />
                        )}
                    </IconButton>
                </Tooltip>

                {isOwner && (
                    <Tooltip title='Edit Profile and Settings'>
                        <IconButton id='edit-profile-button' component={Link} href='/profile/edit'>
                            <Settings sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            <CardContent>
                <Stack alignItems='center' mb={-1}>
                    <Avatar user={user} />
                    <Typography variant='h4' fontWeight='bold' textAlign='center'>
                        {user.displayName}
                    </Typography>

                    <Stack direction='row' alignItems='center' spacing={1}>
                        <CohortIcon
                            cohort={user.dojoCohort}
                            tooltip={`Member of the ${user.dojoCohort} cohort`}
                        />
                        <Typography variant='h5' color='text.secondary'>
                            {user.dojoCohort}
                        </Typography>
                    </Stack>

                    <Stack
                        direction='row'
                        flexWrap='wrap'
                        rowGap={1}
                        columnGap={1}
                        alignItems='center'
                        justifyContent='center'
                        mt={3}
                        mb={3}
                    >
                        <CoachChip user={user} />
                        <InactiveChip user={user} />
                        <DiscordChip username={user.discordUsername} id={user.discordId} />
                        <TimezoneChip timezone={user.timezoneOverride} />
                        <CreatedAtChip createdAt={user.createdAt} />
                        <CountChip
                            count={user.followerCount}
                            label='Followers'
                            singularLabel='Follower'
                            link={`/profile/${user.username}/followers`}
                        />
                        <CountChip
                            count={user.followingCount}
                            label='Following'
                            link={`/profile/${user.username}/following`}
                        />
                    </Stack>

                    <Box sx={{ mb: 3 }}>
                        {isOwner ? (
                            <GraduationDialog />
                        ) : (
                            <Button
                                data-cy='follow-button'
                                variant='contained'
                                onClick={onFollow}
                                loading={followRequest.isLoading()}
                                startIcon={followRequest.data ? <ThumbDown /> : <ThumbUp />}
                            >
                                {followRequest.data ? 'Unfollow' : 'Follow'}
                            </Button>
                        )}
                    </Box>

                    <Bio bio={user.bio} />
                </Stack>
            </CardContent>
        </Card>
    );
}
