import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Container, Divider, Stack, Typography } from '@mui/material';

import { useApi } from '../../api/Api';
import { useAuth } from '../../auth/Auth';
import { useRequest } from '../../api/Request';
import { User } from '../../database/user';
import LoadingPage from '../../loading/LoadingPage';
import NotFoundPage from '../../NotFoundPage';
import UserInfo from '../info/UserInfo';
import FollowersList from './FollowersList';
import { ProfilePageProps } from '../ProfilePage';

const FollowersPage = () => {
    const { username } = useParams<ProfilePageProps>();
    const api = useApi();
    const currentUser = useAuth().user!;
    const request = useRequest<User>();
    const pathname = useLocation().pathname;

    const currentUserProfile = !username || username === currentUser.username;

    useEffect(() => {
        if (!currentUserProfile && !request.isSent()) {
            request.onStart();
            api.getUserPublic(username)
                .then((response) => {
                    request.onSuccess(response.data);
                })
                .catch((err) => {
                    console.error('Failed to get user profile: ', err);
                    request.onFailure(err);
                });
        }
    }, [api, currentUserProfile, request, username]);

    const user = currentUserProfile ? currentUser : request.data;

    if (!user && request.isLoading()) {
        return <LoadingPage />;
    } else if (!user) {
        return <NotFoundPage />;
    }

    const title = pathname.endsWith('/followers') ? 'Followers' : 'Following';

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack>
                <UserInfo user={user} linkUsername />

                <Typography mt={5} variant='h5'>
                    {title}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <FollowersList />
            </Stack>
        </Container>
    );
};

export default FollowersPage;
