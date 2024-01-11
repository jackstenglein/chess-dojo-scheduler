import { useEffect } from 'react';
import {
    Route,
    createBrowserRouter,
    createRoutesFromElements,
    RouterProvider,
    Outlet,
    useNavigate,
    ScrollRestoration,
} from 'react-router-dom';
import { Amplify, Hub } from 'aws-amplify';
import { LicenseInfo } from '@mui/x-data-grid-pro';

import { getConfig } from './config';
import { AuthProvider, RequireAuth } from './auth/Auth';
import LandingPage from './landing/LandingPage';
import ProfilePage from './profile/ProfilePage';
import ProfileEditorPage from './profile/editor/ProfileEditorPage';
import { ApiProvider } from './api/Api';
import CalendarPage from './calendar/CalendarPage';
import MeetingPage from './meeting/MeetingPage';
import ListMeetingsPage from './meeting/ListMeetingsPage';
import Navbar from './navbar/Navbar';
import SigninPage from './auth/SigninPage';
import SignupPage from './auth/SignupPage';
import VerifyEmailPage from './auth/VerifyEmailPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import { CacheProvider } from './api/cache/Cache';
import GroupMeetingPage from './meeting/GroupMeetingPage';
import GamePage from './games/view/GamePage';
import ListGamesPage from './games/list/ListGamesPage';
import ScoreboardPage from './scoreboard/ScoreboardPage';
import NotFoundPage from './NotFoundPage';
import RequirementPage from './requirements/RequirementPage';
import { SwitchCohortPrompt } from './profile/SwitchCohortPrompt';
import RecentPage from './recent/RecentPage';
import HelpPage from './help/HelpPage';
import EditGamePage from './games/edit/EditGamePage';
import ThemeProvider from './ThemeProvider';
import StatisticsPage from './scoreboard/statistics/StatisticsPage';
import MaterialPage from './material/MaterialPage';
import ErrorBoundary from './ErrorBoundary';
import TournamentsPage from './tournaments/TournamentsPage';
import RegistrationPage from './tournaments/openClassical/RegistrationPage';
import { TutorialProvider } from './tutorial/TutorialContext';
import SearchPage from './scoreboard/search/SeachPage';
import SubmitResultsPage from './tournaments/openClassical/SubmitResultsPage';
import NotificationPage from './notifications/NotificationPage';
import FollowersPage from './profile/followers/FollowersPage';
import NewsfeedListPage from './newsfeed/list/NewsfeedListPage';
import NewsfeedDetailPage from './newsfeed/detail/NewsfeedDetailPage';
import DetailsPage from './tournaments/openClassical/DetailsPage';
import UnsubscribePage from './dojoDigest/UnsubscribePage';
import ExplorerPage from './games/explorer/ExplorerPage';
import CoursePage from './courses/view/CoursePage';
import InfoPage from './tournaments/openClassical/InfoPage';
import ListCoursesPage from './courses/list/ListCoursesPage';
import PricingPage from './upsell/PricingPage';
import CoachPortalPage from './coaching/coaches/CoachPortalPage';
import StripeCancelationPage from './meeting/StripeCancelationPage';
import CourseEditorPage from './coaching/coaches/courseEditor/CourseEditorPage';
import YearReviewPage from './profile/yearReview/YearReviewPage';
import YearReviewRedirect from './profile/yearReview/YearReviewRedirect';
import EventBooker from './calendar/EventBooker';
import CoachingPage from './coaching/customers/CoachingPage';

LicenseInfo.setLicenseKey(
    '54bc84a7ecb1e4bb301846936cb75a56Tz03ODMxNixFPTE3MzExMDQzNDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI='
);

const config = getConfig();
Amplify.configure({
    Auth: {
        region: config.auth.region,
        userPoolId: config.auth.userPoolId,
        userPoolWebClientId: config.auth.userPoolWebClientId,
        oauth: {
            domain: config.auth.oauth.domain,
            scope: config.auth.oauth.scope,
            redirectSignIn: config.auth.oauth.redirectSignIn,
            redirectSignOut: config.auth.oauth.redirectSignOut,
            responseType: config.auth.oauth.responseType,
        },
    },
});

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<Root />}>
            <Route index element={<LandingPage />} />
            <Route path='signin' element={<SigninPage />} />
            <Route path='signup' element={<SignupPage />} />
            <Route path='verify-email' element={<VerifyEmailPage />} />
            <Route path='forgot-password' element={<ForgotPasswordPage />} />
            <Route path='help' element={<HelpPage />} />
            <Route path='tournaments'>
                <Route index element={<TournamentsPage />} />
                <Route path='open-classical'>
                    <Route index element={<DetailsPage />} />
                    <Route path='info' element={<InfoPage />} />
                    <Route path='register' element={<RegistrationPage />} />
                    <Route path='submit-results' element={<SubmitResultsPage />} />
                </Route>
            </Route>
            <Route path='dojodigest/unsubscribe' element={<UnsubscribePage />} />

            <Route path='courses'>
                <Route index element={<ListCoursesPage />} />
                <Route path=':type/:id' element={<CoursePage />} />
            </Route>
            <Route path='coaching' element={<CoachingPage />} />

            <Route path='prices' element={<PricingPage />} />

            <Route path='yearreview/:username/:year' element={<YearReviewPage />} />

            <Route element={<RequireAuth />}>
                <Route element={<SwitchCohortPrompt />}>
                    <Route path='profile'>
                        <Route index element={<ProfilePage />} />
                        <Route path='edit' element={<ProfileEditorPage />} />
                        <Route path='yearreview' element={<YearReviewRedirect />} />
                        <Route path=':username'>
                            <Route index element={<ProfilePage />} />
                            <Route path='followers' element={<FollowersPage />} />
                            <Route path='following' element={<FollowersPage />} />
                        </Route>
                    </Route>

                    <Route path='recent' element={<RecentPage />} />
                    <Route path='calendar' element={<CalendarPage />}>
                        <Route path='availability/:id' element={<EventBooker />} />
                    </Route>
                    <Route path='meeting'>
                        <Route index element={<ListMeetingsPage />} />
                        <Route path=':meetingId'>
                            <Route index element={<MeetingPage />} />
                            <Route path='cancel' element={<StripeCancelationPage />} />
                        </Route>
                    </Route>
                    <Route path='group/:availabilityId' element={<GroupMeetingPage />} />
                    <Route path='games'>
                        <Route index element={<ListGamesPage />} />
                        <Route path='submit' element={<EditGamePage />} />
                        <Route path='explorer' element={<ExplorerPage />} />
                        <Route path=':cohort/:id'>
                            <Route index element={<GamePage />} />
                            <Route path='edit' element={<EditGamePage />} />
                        </Route>
                    </Route>

                    <Route path='scoreboard'>
                        <Route index element={<ScoreboardPage />} />
                        <Route path='stats' element={<StatisticsPage />} />
                        <Route path='search' element={<SearchPage />} />
                        <Route path=':type' element={<ScoreboardPage />} />
                    </Route>

                    <Route path='requirements'>
                        <Route path=':id' element={<RequirementPage />} />
                    </Route>

                    <Route path='material'>
                        <Route index element={<MaterialPage />} />
                    </Route>

                    <Route path='notifications' element={<NotificationPage />} />

                    <Route path='newsfeed'>
                        <Route index element={<NewsfeedListPage />} />
                        <Route path=':owner/:id' element={<NewsfeedDetailPage />} />
                    </Route>

                    <Route path='coach'>
                        <Route index element={<CoachPortalPage />} />
                        <Route path='courses/:type/:id' element={<CourseEditorPage />} />
                    </Route>
                </Route>
            </Route>
            <Route path='*' element={<NotFoundPage />} />
        </Route>
    )
);

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <RouterProvider router={router} />
            </ThemeProvider>
        </AuthProvider>
    );
}

function Root() {
    const navigate = useNavigate();

    useEffect(() => {
        Hub.listen('auth', (data: any) => {
            switch (data?.payload?.event) {
                case 'customOAuthState':
                    if (data.payload.data) {
                        navigate(data.payload.data);
                    }
            }
        });
    }, [navigate]);

    return (
        <ApiProvider>
            <ScrollRestoration />
            <CacheProvider>
                <TutorialProvider>
                    <Navbar />
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </TutorialProvider>
            </CacheProvider>
        </ApiProvider>
    );
}

export default App;
