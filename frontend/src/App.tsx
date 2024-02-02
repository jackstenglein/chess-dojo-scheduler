import { LicenseInfo } from '@mui/x-data-grid-pro';
import { Amplify, Hub } from 'aws-amplify';
import { useEffect } from 'react';
import {
    createBrowserRouter,
    createRoutesFromElements,
    Outlet,
    Route,
    RouterProvider,
    ScrollRestoration,
    useNavigate,
} from 'react-router-dom';

import { ApiProvider } from './api/Api';
import { CacheProvider } from './api/cache/Cache';
import { AuthProvider, RequireAuth } from './auth/Auth';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import SigninPage from './auth/SigninPage';
import SignupPage from './auth/SignupPage';
import VerifyEmailPage from './auth/VerifyEmailPage';
import CalendarPage from './calendar/CalendarPage';
import EventBooker from './calendar/EventBooker';
import ChatPage from './chat/ChatPage';
import ClubDetailsPage from './clubs/ClubDetailsPage';
import CreateClubPage from './clubs/CreateClubPage';
import ListClubsPage from './clubs/ListClubsPage';
import BookPage from './book/BookPage';
import BookNewOpening from './book/BookNewOpening';
import BookNewEndgame from './book/BookNewEndgame';
import BookEdit from './book/BookEdit';
import BookAddLine from './book/BookAddLine';
import TrainingPage from './book/training/TrainingPage';
import NewTrainingPage from './book/training/NewTrainingPage';
import CoachPortalPage from './coaching/coaches/CoachPortalPage';
import CourseEditorPage from './coaching/coaches/courseEditor/CourseEditorPage';
import CoachingPage from './coaching/customers/CoachingPage';
import { getConfig } from './config';
import ListCoursesPage from './courses/list/ListCoursesPage';
import CoursePage from './courses/view/CoursePage';
import UnsubscribePage from './dojoDigest/UnsubscribePage';
import ErrorBoundary from './ErrorBoundary';
import EditGamePage from './games/edit/EditGamePage';
import ExplorerPage from './games/explorer/ExplorerPage';
import ListGamesPage from './games/list/ListGamesPage';
import GamePage from './games/view/GamePage';
import HelpPage from './help/HelpPage';
import LandingPage from './landing/LandingPage';
import MaterialPage from './material/MaterialPage';
import GroupMeetingPage from './meeting/GroupMeetingPage';
import ListMeetingsPage from './meeting/ListMeetingsPage';
import MeetingPage from './meeting/MeetingPage';
import StripeCancelationPage from './meeting/StripeCancelationPage';
import Navbar from './navbar/Navbar';
import NewsfeedDetailPage from './newsfeed/detail/NewsfeedDetailPage';
import NewsfeedListPage from './newsfeed/list/NewsfeedListPage';
import NotFoundPage from './NotFoundPage';
import NotificationPage from './notifications/NotificationPage';
import ProfileEditorPage from './profile/editor/ProfileEditorPage';
import FollowersPage from './profile/followers/FollowersPage';
import ProfilePage from './profile/ProfilePage';
import { SwitchCohortPrompt } from './profile/SwitchCohortPrompt';
import YearReviewPage from './profile/yearReview/YearReviewPage';
import YearReviewRedirect from './profile/yearReview/YearReviewRedirect';
import RecentPage from './recent/RecentPage';
import RequirementPage from './requirements/RequirementPage';
import ClubScoreboardPage from './scoreboard/club/ClubScoreboardPage';
import ScoreboardPage from './scoreboard/ScoreboardPage';
import SearchPage from './scoreboard/search/SeachPage';
import StatisticsPage from './scoreboard/statistics/StatisticsPage';
import ThemeProvider from './ThemeProvider';
import AdminPage from './tournaments/openClassical/admin/AdminPage';
import DetailsPage from './tournaments/openClassical/DetailsPage';
import InfoPage from './tournaments/openClassical/InfoPage';
import ListPage from './tournaments/openClassical/ListPage';
import RegistrationPage from './tournaments/openClassical/RegistrationPage';
import SubmitResultsPage from './tournaments/openClassical/SubmitResultsPage';
import TournamentsPage from './tournaments/TournamentsPage';
import { TutorialProvider } from './tutorial/TutorialContext';
import PricingPage from './upsell/PricingPage';

LicenseInfo.setLicenseKey(
    '54bc84a7ecb1e4bb301846936cb75a56Tz03ODMxNixFPTE3MzExMDQzNDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI=',
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
            <Route element={<SwitchCohortPrompt />}>
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
                        <Route path='previous' element={<ListPage />} />
                        <Route path='admin' element={<AdminPage />} />
                    </Route>
                </Route>
                <Route path='book'>
                    <Route index element={<BookPage />} />
                    <Route path="add-line" element={<BookAddLine />} />
                    <Route path='books'>
                        <Route path="new-opening" element={<BookNewOpening />} />
                        <Route path="new-endgame" element={<BookNewEndgame />} />
                        <Route path=':bookId'>
                            <Route index element={<BookEdit />} />
                        </Route>
                    </Route>
                    <Route path='training'>
                        <Route path="new" element={<NewTrainingPage />} />
                        <Route path=':trainingId'>
                            <Route index element={<TrainingPage />} />
                        </Route>
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

                <Route path='clubs'>
                    <Route index element={<ListClubsPage />} />
                    <Route path='create' element={<CreateClubPage />} />
                    <Route path=':id'>
                        <Route index element={<ClubDetailsPage />} />
                        <Route path='edit' element={<CreateClubPage />} />
                    </Route>
                </Route>

                <Route element={<RequireAuth />}>
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

                    <Route path='chat' element={<ChatPage />} />

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
                        <Route path='clubs/:id' element={<ClubScoreboardPage />} />
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
        </Route>,
    ),
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
            <ScrollRestoration getKey={(location) => location.pathname} />
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
