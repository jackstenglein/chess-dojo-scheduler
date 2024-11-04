import {
    Edit,
    Folder,
    Groups,
    PieChart,
    RocketLaunch,
    Star,
    ThumbDown,
    ThumbUp,
    Timeline,
} from '@mui/icons-material';
import { LoadingButton, TabContext, TabPanel } from '@mui/lab';
import { Box, Button, Container, Stack, Tab, Tabs } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { useAuth } from '../auth/Auth';
import { FollowerEntry } from '../database/follower';
import { User } from '../database/user';
import LoadingPage from '../loading/LoadingPage';
import { PawnIcon } from '../style/ChessIcons';
import GamesTab from './GamesTab';
import GraduationDialog from './GraduationDialog';
import ActivityTab from './activity/ActivityTab';
import ClubsTab from './clubs/ClubsTab';
import CoachTab from './coach/CoachTab';
import { DirectoriesSection } from './directories/DirectoriesSection';
import { DirectoryCacheProvider } from './directories/DirectoryCache';
import { ActivityCard } from './info/ActivityCard';
import { BadgeCard } from './info/BadgeCard';
import Bio from './info/Bio';
import CoachChip from './info/CoachChip';
import CountChip from './info/CountChip';
import CreatedAtChip from './info/CreatedAtChip';
import DiscordChip from './info/DiscordChip';
import InactiveChip from './info/InactiveChip';
import { RatingsCard } from './info/RatingsCard';
import TimezoneChip from './info/TimezoneChip';
import UserInfo from './info/UserInfo';
import ProgressTab from './progress/ProgressTab';
import StatsTab from './stats/StatsTab';
import ProfilePageTutorial from './tutorials/ProfilePageTutorial';

const ProfilePage = () => {
    const { username } = useParams();
    const navigate = useNavigate();
    const api = useApi();
    const auth = useAuth();
    const currentUser = auth.user;
    const request = useRequest<User>();
    const followRequest = useRequest<FollowerEntry>();

    const currentUserProfile = !username || username === currentUser?.username;

    const [searchParams, setSearchParams] = useSearchParams(
        currentUserProfile ? { view: 'progress' } : { view: 'stats' },
    );

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

    const onFollow = () => {
        if (currentUserProfile || !currentUser) {
            return;
        }

        const action = followRequest.data ? 'unfollow' : 'follow';

        followRequest.onStart();
        api.editFollower(user.username, action)
            .then((resp) => {
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
        <Box
            display='grid'
            sx={{
                py: 6,
                gridTemplateAreas: {
                    xs: '"profile"',
                    lg: '". profile stats ."',
                },
                gridTemplateColumns: {
                    xs: '100%',
                    lg: 'auto minmax(750px, max-content) minmax(350px, 444px) auto',
                },
            }}
        >
            <Container maxWidth='md' sx={{ gridArea: 'profile', marginRight: { lg: 0 } }}>
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
                                <GraduationDialog />
                                <Button
                                    id='edit-profile-button'
                                    variant='contained'
                                    startIcon={<Edit />}
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
                                startIcon={
                                    followRequest.data ? <ThumbDown /> : <ThumbUp />
                                }
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
                        <CoachChip user={user} />
                        <InactiveChip user={user} />
                        <DiscordChip username={user.discordUsername} />
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

                    <Bio bio={user.bio} />

                    <Box sx={{ width: '100%', typography: 'body1', mt: 5 }}>
                        <TabContext value={searchParams.get('view') || 'stats'}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    value={searchParams.get('view') || 'stats'}
                                    onChange={(_, t: string) =>
                                        setSearchParams({ view: t })
                                    }
                                    aria-label='profile tabs'
                                    variant='scrollable'
                                >
                                    <ProfileTab
                                        label='Ratings'
                                        value='stats'
                                        icon={<Timeline fontSize='small' />}
                                    />

                                    {user.isCoach && (
                                        <ProfileTab
                                            label='Coaching'
                                            value='coaching'
                                            icon={<RocketLaunch fontSize='small' />}
                                        />
                                    )}
                                    <ProfileTab
                                        id='training-plan-tab'
                                        label='Training Plan'
                                        value='progress'
                                        icon={<Star fontSize='small' />}
                                    />
                                    <ProfileTab
                                        label='Activity'
                                        value='activity'
                                        icon={<PieChart fontSize='small' />}
                                    />
                                    <ProfileTab
                                        label='Games'
                                        value='games'
                                        icon={<PawnIcon fontSize='small' />}
                                    />
                                    <ProfileTab
                                        label='Files'
                                        value='files'
                                        icon={<Folder fontSize='small' />}
                                    />
                                    <ProfileTab
                                        label='Clubs'
                                        value='clubs'
                                        icon={<Groups fontSize='small' />}
                                    />
                                </Tabs>
                            </Box>
                            <TabPanel value='stats' sx={{ px: { xs: 0, sm: 3 } }}>
                                <StatsTab user={user} />
                            </TabPanel>
                            <TabPanel value='coaching' sx={{ px: { xs: 0, sm: 3 } }}>
                                <CoachTab user={user} />
                            </TabPanel>
                            <TabPanel value='progress' sx={{ px: { xs: 0, sm: 3 } }}>
                                <ProgressTab
                                    user={user}
                                    isCurrentUser={currentUserProfile}
                                />
                            </TabPanel>
                            <TabPanel value='activity' sx={{ px: { xs: 0, sm: 3 } }}>
                                <ActivityTab user={user} />
                            </TabPanel>
                            <TabPanel value='games' sx={{ px: { xs: 0 } }}>
                                <GamesTab user={user} />
                            </TabPanel>
                            <TabPanel value='files' sx={{ px: { xs: 0 } }}>
                                <DirectoryCacheProvider>
                                    <DirectoriesSection
                                        namespace={
                                            currentUserProfile
                                                ? 'own-profile'
                                                : 'other-profile'
                                        }
                                        defaultDirectoryOwner={user.username}
                                        enableNavigationMenu={currentUserProfile}
                                        defaultNavigationMenuOpen={true}
                                        defaultColumnVisibility={{
                                            type: true,
                                            name: true,
                                            result: true,
                                            owner: true,
                                            createdAt: true,
                                        }}
                                    />
                                </DirectoryCacheProvider>
                            </TabPanel>
                            <TabPanel value='clubs' sx={{ px: { xs: 0, sm: 3 } }}>
                                <ClubsTab user={user} />
                            </TabPanel>
                        </TabContext>
                    </Box>
                </Stack>

                {currentUserProfile && (
                    <>
                        <ProfilePageTutorial />
                    </>
                )}
            </Container>

            <Container
                sx={{
                    marginLeft: 0,
                    gridArea: 'stats',
                    display: { xs: 'none', lg: 'initial' },
                }}
            >
                <Stack spacing={2}>
                    <RatingsCard user={user} />
                    <ActivityCard user={user} />
                    <BadgeCard user={user} />
                </Stack>
            </Container>
        </Box>
    );
};

export default ProfilePage;

function ProfileTab({
    label,
    value,
    icon,
    ...others
}: {
    label: string;
    value: string;
    icon: JSX.Element;
    [key: string]: string | JSX.Element;
}) {
    return (
        <Tab
            {...others}
            label={label}
            value={value}
            icon={icon}
            iconPosition='start'
            sx={{ minHeight: '48px' }}
        />
    );
}
