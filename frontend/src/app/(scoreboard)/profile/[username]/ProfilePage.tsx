'use client';

import NotFoundPage from '@/NotFoundPage';
import { useApi } from '@/api/Api';
import { useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { SwitchCohortPrompt } from '@/components/profile/SwitchCohortPrompt';
import ActivityTab from '@/components/profile/activity/ActivityTab';
import { TimelineProvider } from '@/components/profile/activity/useTimeline';
import { DirectoriesSection } from '@/components/profile/directories/DirectoriesSection';
import { DirectoryCacheProvider } from '@/components/profile/directories/DirectoryCache';
import { BadgeCard } from '@/components/profile/info/BadgeCard';
import DojoScoreCard from '@/components/profile/info/DojoScoreCard';
import { HeatmapCard } from '@/components/profile/info/HeatmapCard';
import { UserCard } from '@/components/profile/info/UserCard';
import StatsTab from '@/components/profile/stats/StatsTab';
import { TrainingPlanTab } from '@/components/profile/trainingPlan/TrainingPlanTab';
import ProfilePageTutorial from '@/components/tutorial/ProfilePageTutorial';
import { hasCreatedProfile, User } from '@/database/user';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import ClubsTab from '@/profile/clubs/ClubsTab';
import CoachTab from '@/profile/coach/CoachTab';
import ProfileCreatorPage from '@/profile/creator/ProfileCreatorPage';
import { PawnIcon } from '@/style/ChessIcons';
import { Groups, PieChart, RocketLaunch, Star, Timeline } from '@mui/icons-material';
import { TabContext, TabPanel } from '@mui/lab';
import { Box, Container, Tab, Tabs, useMediaQuery } from '@mui/material';
import { useEffect } from 'react';

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
    const request = useRequest<User>();
    const isSmall = useMediaQuery((theme) => theme.breakpoints.down('md'));
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

    const user = currentUserProfile ? currentUser : request.data;

    if (currentUserProfile && !hasCreatedProfile(currentUser)) {
        return <ProfileCreatorPage />;
    }

    if (!user && (!request.isSent() || request.isLoading())) {
        return <LoadingPage />;
    } else if (!user) {
        return <NotFoundPage />;
    }

    const setFollowerCount = (count: number) => {
        request.onSuccess({
            ...user,
            followerCount: count,
        });
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                py: 6,
                display: 'grid',
                gridTemplateAreas: {
                    xs: `"userInfo"
                         "profile"`,
                    sm: `"userInfo scorecard"
                         "profile profile"`,
                    md: `"userInfo heatmap"
                         "profile profile"`,
                    lg: `"userInfo  profile"
                         "heatmap   profile"
                         "scorecard profile"
                         "badges    profile"
                         ".         profile"`,
                    xl: `"userInfo profile heatmap"
                         "userInfo profile scorecard"
                         "userInfo profile badges"
                         "userInfo profile ."`,
                },
                gridTemplateColumns: {
                    xs: '100%',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'minmax(350px, 444px) minmax(750px, 900px)',
                    xl: 'minmax(350px, 444px) minmax(750px, 1200px) minmax(350px, 444px)',
                },
                gridTemplateRows: {
                    lg: 'auto auto auto auto 1fr',
                    xl: 'auto auto auto 1fr',
                },
                gridAutoColumns: 0,
                columnGap: 2,
                rowGap: 2,
            }}
        >
            <TimelineProvider owner={user.username}>
                <Box sx={{ gridArea: 'profile', width: '100%', typography: 'body1' }}>
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
                            <TrainingPlanTab user={user} isCurrentUser={currentUserProfile} />
                        </TabPanel>
                        <TabPanel value='activity' sx={{ px: { xs: 0, sm: 3 } }}>
                            <ActivityTab user={user} />
                        </TabPanel>
                        <TabPanel value='games' sx={{ px: { xs: 0 } }}>
                            <DirectoryCacheProvider>
                                <DirectoriesSection
                                    namespace={currentUserProfile ? 'own-profile' : 'other-profile'}
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

                {currentUserProfile && (
                    <>
                        <ProfilePageTutorial />
                        <SwitchCohortPrompt />
                    </>
                )}

                <Box sx={{ gridArea: 'userInfo' }}>
                    <UserCard user={user} setFollowerCount={setFollowerCount} />
                </Box>

                {!isSmall && (
                    <Box sx={{ gridArea: 'heatmap', display: { xs: 'none', md: 'initial' } }}>
                        <HeatmapCard
                            workGoalHistory={user.workGoalHistory ?? []}
                            defaultWorkGoal={user.workGoal}
                        />
                    </Box>
                )}

                {(isSmall || isLarge) && (
                    <Box sx={{ gridArea: 'scorecard' }}>
                        <DojoScoreCard user={user} cohort={user.dojoCohort} />
                    </Box>
                )}

                {isLarge && (
                    <Box sx={{ gridArea: 'badges', display: { xs: 'none', lg: 'initial' } }}>
                        <BadgeCard user={user} />
                    </Box>
                )}
            </TimelineProvider>
        </Container>
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
