import { useEffect, useState } from 'react';
import { Box, Button, Container, Stack, Tab, Tabs } from '@mui/material';
import { LoadingButton, TabContext, TabPanel } from '@mui/lab';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth, useFreeTier } from '../auth/Auth';
import { User } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import NotFoundPage from '../NotFoundPage';
import GamesTab from './GamesTab';
import ProgressTab from './progress/ProgressTab';
import ActivityTab from './activity/ActivityTab';
import GraduationDialog from './GraduationDialog';
import StatsTab from './stats/StatsTab';
import ProfilePageTutorial from './tutorials/ProfilePageTutorial';
import UpsellDialog, { RestrictedAction } from '../upsell/UpsellDialog';
import Bio from './info/Bio';
import InactiveChip from './info/InactiveChip';
import CreatedAtChip from './info/CreatedAtChip';
import TimezoneChip from './info/TimezoneChip';
import DiscordChip from './info/DiscordChip';
import CountChip from './info/CountChip';
import { FollowerEntry } from '../database/follower';
import UserInfo from './info/UserInfo';

export type ProfilePageProps = {
    username: string;
};

const ProfilePage = () => {
    const { username } = useParams<ProfilePageProps>();
    const navigate = useNavigate();
    const api = useApi();
    const auth = useAuth();
    const currentUser = auth.user!;
    const request = useRequest<User>();
    const isFreeTier = useFreeTier();
    const followRequest = useRequest<FollowerEntry>();

    const currentUserProfile = !username || username === currentUser.username;

    const [searchParams, setSearchParams] = useSearchParams(
        currentUserProfile ? { view: 'progress' } : { view: 'stats' }
    );

    const [upsellDialogOpen, setUpsellDialogOpen] = useState(false);
    const [showGraduationDialog, setShowGraduationDialog] = useState(false);

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

    useEffect(() => {
        if (!currentUserProfile && !followRequest.isSent()) {
            followRequest.onStart();
            api.getFollower(username)
                .then((resp) => {
                    console.log('getFollower: ', resp);
                    followRequest.onSuccess(resp.data || undefined);
                })
                .catch((err) => {
                    console.error(err);
                    followRequest.onFailure(err);
                });
        }
    }, [api, currentUserProfile, followRequest, username]);

    const user = currentUserProfile ? currentUser : request.data;

    if (!user && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    } else if (!user) {
        return <NotFoundPage />;
    }

    const onGraduate = () => {
        if (isFreeTier) {
            setUpsellDialogOpen(true);
        } else {
            setShowGraduationDialog(true);
        }
    };

    const onFollow = () => {
        if (currentUserProfile) {
            return;
        }

        const action = followRequest.data ? 'unfollow' : 'follow';

        followRequest.onStart();
        api.editFollower(user.username, action)
            .then((resp) => {
                console.log('editFollower: ', resp);
                const incrementalCount = action === 'follow' ? 1 : -1;
                auth.updateUser({
                    followingCount: currentUser.followingCount + incrementalCount,
                });
                request.onSuccess({
                    ...user,
                    followerCount: user.followerCount + incrementalCount,
                });
                followRequest.onSuccess(resp.data || undefined);
            })
            .catch((err) => {
                console.error(err);
                followRequest.onFailure(err);
            });
    };

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <RequestSnackbar request={followRequest} />

            <Stack>
                <Stack
                    direction='row'
                    justifyContent='space-between'
                    alignItems='start'
                    flexWrap='wrap'
                    rowGap={2}
                >
                    <UserInfo user={user} />

                    {currentUserProfile ? (
                        <Stack direction='row' spacing={2}>
                            <Button
                                id='graduate-button'
                                variant='contained'
                                color='success'
                                onClick={onGraduate}
                            >
                                Graduate
                            </Button>
                            <Button
                                id='edit-profile-button'
                                variant='contained'
                                onClick={() => navigate('/profile/edit')}
                            >
                                Edit Profile
                            </Button>
                        </Stack>
                    ) : (
                        <LoadingButton
                            data-cy='follow-button'
                            variant='contained'
                            onClick={onFollow}
                            loading={followRequest.isLoading()}
                        >
                            {followRequest.data ? 'Unfollow' : 'Follow'}
                        </LoadingButton>
                    )}
                </Stack>

                <Stack
                    mt={3}
                    mb={4}
                    direction='row'
                    flexWrap='wrap'
                    rowGap={1}
                    columnGap={1.5}
                >
                    <InactiveChip user={user} />
                    <CreatedAtChip createdAt={user.createdAt} />
                    <TimezoneChip timezone={user.timezoneOverride} />
                    <DiscordChip username={user.discordUsername} />
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

                <Bio bio={user.bio} />

                <Box sx={{ width: '100%', typography: 'body1', mt: 5 }}>
                    <TabContext value={searchParams.get('view') || 'stats'}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={searchParams.get('view') || 'stats'}
                                onChange={(_, t) => setSearchParams({ view: t })}
                                aria-label='profile tabs'
                                variant='scrollable'
                            >
                                <Tab label='Ratings' value='stats' id='test' />
                                <Tab
                                    id='training-plan-tab'
                                    label='Training Plan'
                                    value='progress'
                                />
                                <Tab label='Activity' value='activity' />
                                <Tab label='Games' value='games' />
                            </Tabs>
                        </Box>
                        <TabPanel value='stats' sx={{ px: { xs: 0, sm: 3 } }}>
                            <StatsTab user={user} />
                        </TabPanel>
                        <TabPanel value='progress' sx={{ px: { xs: 0, sm: 3 } }}>
                            <ProgressTab user={user} isCurrentUser={currentUserProfile} />
                        </TabPanel>
                        <TabPanel value='activity' sx={{ px: { xs: 0, sm: 3 } }}>
                            <ActivityTab user={user} />
                        </TabPanel>
                        <TabPanel value='games' sx={{ px: { xs: 0, sm: 3 } }}>
                            <GamesTab user={user} />
                        </TabPanel>
                    </TabContext>
                </Box>
            </Stack>

            {currentUserProfile && (
                <>
                    <GraduationDialog
                        open={showGraduationDialog}
                        onClose={() => setShowGraduationDialog(false)}
                        cohort={user.dojoCohort}
                    />
                    <UpsellDialog
                        open={upsellDialogOpen}
                        onClose={setUpsellDialogOpen}
                        currentAction={RestrictedAction.Graduate}
                    />
                    <ProfilePageTutorial />
                </>
            )}
        </Container>
    );
};

export default ProfilePage;
