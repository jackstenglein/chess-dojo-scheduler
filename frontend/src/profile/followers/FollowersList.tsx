import React, { useEffect } from 'react';
import { Link, Stack, Typography } from '@mui/material';
import { useLocation, useParams, Link as RouterLink } from 'react-router-dom';

import { RequestSnackbar, useRequest } from '../../api/Request';
import { ListFollowersResponse } from '../../api/userApi';
import LoadingPage from '../../loading/LoadingPage';
import { useApi } from '../../api/Api';
import { ProfilePageProps } from '../ProfilePage';
import { FollowerEntry } from '../../database/follower';
import Avatar from '../Avatar';
import { useAuth } from '../../auth/Auth';
import { LoadingButton } from '@mui/lab';

const FollowersList = () => {
    const api = useApi();
    const isFollowing = useLocation().pathname.endsWith('/following');
    const request = useRequest<ListFollowersResponse>();
    const { username } = useParams<ProfilePageProps>();
    const auth = useAuth();
    const currentUser = auth.user;

    const searchFunc = isFollowing ? api.listFollowing : api.listFollowers;

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            searchFunc(username || '')
                .then((resp) => {
                    console.log('listFollowers: ', resp);
                    request.onSuccess(resp.data);
                })
                .catch((err) => {
                    console.error(err);
                    request.onFailure(err);
                });
        }
    }, [request, username, searchFunc]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    if (!request.data || !request.data.followers || request.data.followers.length === 0) {
        return (
            <>
                <RequestSnackbar request={request} />
                <Typography>No users found</Typography>
            </>
        );
    }

    const onUnfollow = (poster: string) => {
        if (currentUser) {
            auth.updateUser({ followingCount: currentUser.followingCount - 1 });
        }
        request.onSuccess({
            followers: request.data?.followers.filter((f) => f.poster !== poster) || [],
            lastEvaluatedKey: request.data?.lastEvaluatedKey || '',
        });
    };

    return (
        <Stack spacing={4}>
            <RequestSnackbar request={request} />

            {request.data.followers.map((f) => (
                <FollowerListItem
                    key={isFollowing ? f.poster : f.follower}
                    entry={f}
                    isFollowing={isFollowing}
                    onUnfollow={
                        isFollowing && username === currentUser?.username
                            ? onUnfollow
                            : undefined
                    }
                />
            ))}
        </Stack>
    );
};

interface FollowerListItemProps {
    entry: FollowerEntry;
    isFollowing: boolean;
    onUnfollow?: (poster: string) => void;
}

const FollowerListItem: React.FC<FollowerListItemProps> = ({
    entry,
    isFollowing,
    onUnfollow,
}) => {
    const unfollowRequest = useRequest<FollowerEntry>();
    const api = useApi();

    const onClick = () => {
        if (!onUnfollow) {
            return;
        }

        unfollowRequest.onStart();
        api.editFollower(entry.poster, 'unfollow')
            .then((resp) => {
                console.log('editFollower: ', resp);
                onUnfollow(entry.poster);
            })
            .catch((err) => {
                console.error(err);
                unfollowRequest.onFailure(err);
            });
    };

    return (
        <Stack direction='row' justifyContent='space-between' alignItems='center'>
            <RequestSnackbar request={unfollowRequest} />

            <Stack direction='row' spacing={2} alignItems='center'>
                <Avatar
                    username={isFollowing ? entry.poster : entry.follower}
                    displayName={
                        isFollowing ? entry.posterDisplayName : entry.followerDisplayName
                    }
                    size={{ xs: 40, sm: 52 }}
                />

                <Link
                    component={RouterLink}
                    to={`/profile/${isFollowing ? entry.poster : entry.follower}`}
                >
                    {isFollowing ? entry.posterDisplayName : entry.followerDisplayName}
                </Link>
            </Stack>

            {onUnfollow && (
                <LoadingButton
                    variant='contained'
                    loading={unfollowRequest.isLoading()}
                    onClick={onClick}
                >
                    Unfollow
                </LoadingButton>
            )}
        </Stack>
    );
};

export default FollowersList;
