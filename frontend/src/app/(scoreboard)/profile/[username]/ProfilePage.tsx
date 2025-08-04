'use client';

import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import { SwitchCohortPrompt } from '@/components/profile/SwitchCohortPrompt';
import ActivityTab from '@/components/profile/activity/ActivityTab';
import { TimelineProvider } from '@/components/profile/activity/useTimeline';
import { DirectoriesSection } from '@/components/profile/directories/DirectoriesSection';
import { DirectoryCacheProvider } from '@/components/profile/directories/DirectoryCache';
import { BadgeCard } from '@/components/profile/info/BadgeCard';
import Bio from '@/components/profile/info/Bio';
import CoachChip from '@/components/profile/info/CoachChip';
import CountChip from '@/components/profile/info/CountChip';
import CreatedAtChip from '@/components/profile/info/CreatedAtChip';
import DiscordChip from '@/components/profile/info/DiscordChip';
import DojoScoreCard from '@/components/profile/info/DojoScoreCard';
import { HeatmapCard } from '@/components/profile/info/HeatmapCard';
import InactiveChip from '@/components/profile/info/InactiveChip';
import TimezoneChip from '@/components/profile/info/TimezoneChip';
import UserInfo from '@/components/profile/info/UserInfo';
import StatsTab from '@/components/profile/stats/StatsTab';
import { TrainingPlanTab } from '@/components/profile/trainingPlan/TrainingPlanTab';
import ProfilePageTutorial from '@/components/tutorial/ProfilePageTutorial';
import { FollowerEntry } from '@/database/follower';
import { hasCreatedProfile, User } from '@/database/user';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import GraduationDialog from '@/profile/GraduationDialog';
import ClubsTab from '@/profile/clubs/ClubsTab';
import CoachTab from '@/profile/coach/CoachTab';
import ProfileCreatorPage from '@/profile/creator/ProfileCreatorPage';
import { PawnIcon } from '@/style/ChessIcons';
import {
    Groups,
    PieChart,
    RocketLaunch,
    Settings,
    Star,
    ThumbDown,
    ThumbUp,
    Timeline,
} from '@mui/icons-material';
import { LoadingButton, TabContext, TabPanel } from '@mui/lab';
import {
    Box,
    Container,
    IconButton,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    useMediaQuery,
} from '@mui/material';
import { useEffect, type JSX } from 'react';

export function ProfilePage({ username }: { username?: string }) {
    const { user, status } = useAuth();
    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (!user) {
        return <NotFoundPage />;
    }
    return <AuthProfilePage currentUser={user} username={username} />;
}

function AuthProfilePage({ currentUser, username }: { currentUser: User; username?: string }) {
    const api = useApi();
    const auth = useAuth();
    const request = useRequest<User>();
    const followRequest = useRequest<FollowerEntry>();
    const isLarge = useMediaQuery((theme) => theme.breakpoints.up('lg'));

    const currentUserProfile = !username || username === currentUser?.username;

    const { searchParams, updateSearchParams } = useNextSearchParams(
        currentUserProfile ? { view: 'progress' } : { view: 'stats' },
    );

    const isFiles = searchParams.get('view') === 'files';
    useEffect(() => {
        if (isFiles) {
            updateSearchParams({ view: 'games' });
        }
    }, [isFiles, updateSearchParams]);

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

    if (currentUserProfile && !hasCreatedProfile(currentUser)) {
        return <ProfileCreatorPage />;
    }

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
            <TimelineProvider owner={user.username}>
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
                                <Stack direction='row' spacing={1} alignItems='center'>
                                    <GraduationDialog />
                                    <Tooltip title='Edit Profile and Settings'>
                                        <IconButton
                                            id='edit-profile-button'
                                            component={Link}
                                            href='/profile/edit'
                                        >
                                            <Settings sx={{ color: 'text.secondary' }} />
                                        </IconButton>
                                    </Tooltip>
                                </Stack>
                            ) : (
                                <LoadingButton
                                    data-cy='follow-button'
                                    variant='contained'
                                    onClick={onFollow}
                                    loading={followRequest.isLoading()}
                                    startIcon={followRequest.data ? <ThumbDown /> : <ThumbUp />}
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

                        <Bio bio={user.bio} />

                        <Box sx={{ width: '100%', typography: 'body1', mt: 5 }}>
                            <TabContext value={searchParams.get('view') || 'stats'}>
                                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                    <Tabs
                                        value={searchParams.get('view') || 'stats'}
                                        onChange={(_, t: string) => updateSearchParams({ view: t })}
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
                                    <TrainingPlanTab
                                        user={user}
                                        isCurrentUser={currentUserProfile}
                                    />
                                </TabPanel>
                                <TabPanel value='activity' sx={{ px: { xs: 0, sm: 3 } }}>
                                    <ActivityTab user={user} />
                                </TabPanel>
                                <TabPanel value='games' sx={{ px: { xs: 0 } }}>
                                    <DirectoryCacheProvider>
                                        <DirectoriesSection
                                            namespace={
                                                currentUserProfile ? 'own-profile' : 'other-profile'
                                            }
                                            defaultDirectoryOwner={user.username}
                                            enableNavigationMenu={currentUserProfile}
                                            defaultNavigationMenuOpen={true}
                                            userCohort={user.dojoCohort}
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
                            <SwitchCohortPrompt />
                        </>
                    )}
                </Container>

                {isLarge && (
                    <Container
                        sx={{
                            marginLeft: 0,
                            gridArea: 'stats',
                        }}
                    >
                        <Stack spacing={2}>
                            <HeatmapCard
                                workGoalHistory={user.workGoalHistory ?? []}
                                defaultWorkGoal={user.workGoal}
                            />
                            <DojoScoreCard user={user} cohort={user.dojoCohort} />
                            <BadgeCard user={user} />
                        </Stack>
                    </Container>
                )}
            </TimelineProvider>
        </Box>
    );
}

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
