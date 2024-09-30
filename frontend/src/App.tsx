import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { LicenseInfo } from '@mui/x-license';
import { Hub } from 'aws-amplify/utils';
import { useEffect } from 'react';
import {
    Navigate,
    Outlet,
    Route,
    RouterProvider,
    ScrollRestoration,
    createBrowserRouter,
    createRoutesFromElements,
    useNavigate,
} from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';
import NotFoundPage from './NotFoundPage';
import LandingPage from './app/(scoreboard)/page';
import { RequireAuth } from './auth/Auth';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import SigninPage from './auth/SigninPage';
import SignupPage from './auth/SignupPage';
import VerifyEmailPage from './auth/VerifyEmailPage';
import CalendarPage from './calendar/CalendarPage';
import EventBooker from './calendar/EventBooker';
import ClubDetailsPage from './clubs/ClubDetailsPage';
import CreateClubPage from './clubs/CreateClubPage';
import ListClubsPage from './clubs/ListClubsPage';
import CoachPortalPage from './coaching/coaches/CoachPortalPage';
import CourseEditorPage from './coaching/coaches/courseEditor/CourseEditorPage';
import CoachingPage from './coaching/customers/CoachingPage';
import ListCoursesPage from './courses/list/ListCoursesPage';
import CoursePage from './courses/view/CoursePage';
import UnsubscribePage from './dojoDigest/UnsubscribePage';
import { ExamLandingPage } from './exams/ExamLandingPage';
import ExamInstructionsPage from './exams/instructions/ExamInstructionsPage';
import { ListCheckmateExamsPage } from './exams/list/ListCheckmateExamsPage';
import { ListEndgameExamsPage } from './exams/list/ListEndgameExamsPage';
import { ListTacticsExamsPage } from './exams/list/ListTacticsExamsPage';
import { AdminStatsPage } from './exams/view/AdminStatsPage';
import ExamPage from './exams/view/ExamPage';
import EditGamePage from './games/edit/EditGamePage';
import ExplorerPage from './games/explorer/ExplorerPage';
import ImportGamePage from './games/import/ImportGamePage';
import ListGamesPage from './games/list/ListGamesPage';
import ReviewQueuePage from './games/review/ReviewQueuePage';
import GamePage from './games/view/GamePage';
import HelpPage from './help/HelpPage';
import BooksPage from './material/BooksPage';
import MaterialPage from './material/MaterialPage';
import MemorizeGamesPage from './material/MemorizeGamesPage';
import ModelGamesPage from './material/ModelGamesPage';
import RatingConversionsPage from './material/RatingConversionsPage';
import SparringPage from './material/SparringPage';
import GroupMeetingPage from './meeting/GroupMeetingPage';
import ListMeetingsPage from './meeting/ListMeetingsPage';
import MeetingPage from './meeting/MeetingPage';
import StripeCancelationPage from './meeting/StripeCancelationPage';
import MerchPage from './merch/MerchPage';
import NotificationPage from './notifications/NotificationPage';
import ProfilePage from './profile/ProfilePage';
import { SwitchCohortPrompt } from './profile/SwitchCohortPrompt';
import ProfileEditorPage from './profile/editor/ProfileEditorPage';
import FollowersPage from './profile/followers/FollowersPage';
import YearReviewPage from './profile/yearReview/YearReviewPage';
import YearReviewRedirect from './profile/yearReview/YearReviewRedirect';
import RecentPage from './recent/RecentPage';
import RequirementPage from './requirements/RequirementPage';
import ScoreboardPage from './scoreboard/ScoreboardPage';
import ClubScoreboardPage from './scoreboard/club/ClubScoreboardPage';
import SearchPage from './scoreboard/search/SeachPage';
import StatisticsPage from './scoreboard/statistics/StatisticsPage';
import TournamentsPage from './tournaments/TournamentsPage';
import DetailsPage from './tournaments/openClassical/DetailsPage';
import InfoPage from './tournaments/openClassical/InfoPage';
import ListPage from './tournaments/openClassical/ListPage';
import RegistrationPage from './tournaments/openClassical/RegistrationPage';
import SubmitResultsPage from './tournaments/openClassical/SubmitResultsPage';
import AdminPage from './tournaments/openClassical/admin/AdminPage';
import { TutorialProvider } from './tutorial/TutorialContext';
import PricingPage from './upsell/PricingPage';

LicenseInfo.setLicenseKey(
    '54bc84a7ecb1e4bb301846936cb75a56Tz03ODMxNixFPTE3MzExMDQzNDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI=',
);

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

                    <Route path='tests'>
                        <Route index element={<ExamLandingPage />} />
                        <Route path='tactics' element={<ListTacticsExamsPage />} />
                        <Route path='checkmate' element={<ListCheckmateExamsPage />} />
                        <Route path='endgame' element={<ListEndgameExamsPage />} />

                        <Route path=':type/:id'>
                            <Route index element={<ExamInstructionsPage />} />
                            <Route path='exam' element={<ExamPage />} />
                            <Route path='stats' element={<AdminStatsPage />} />
                        </Route>
                    </Route>

                    <Route path='tactics'>
                        <Route index element={<Navigate to='/tests/tactics' replace />} />
                        <Route
                            path='*'
                            element={<Navigate to='/tests/tactics' replace />}
                        />
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
                        <Route path='import' element={<ImportGamePage />} />
                        <Route
                            path='submit'
                            element={<Navigate to='/games/import' replace />}
                        />
                        <Route path='explorer' element={<ExplorerPage />} />
                        <Route path=':cohort/:id'>
                            <Route path='edit' element={<EditGamePage />} />
                        </Route>
                        <Route path='review-queue' element={<ReviewQueuePage />} />
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
                        <Route path='sparring' element={<SparringPage />} />
                        <Route path='modelgames' element={<ModelGamesPage />} />
                        <Route path='memorizegames' element={<MemorizeGamesPage />} />
                    </Route>

                    <Route path='notifications' element={<NotificationPage />} />

                    <Route path='coach'>
                        <Route index element={<CoachPortalPage />} />
                        <Route path='courses/:type/:id' element={<CourseEditorPage />} />
                    </Route>
                </Route>
            </Route>

            {/* Unauthenticated */}

            <Route path='games'>
                <Route path=':cohort/:id'>
                    <Route index element={<GamePage />} />
                </Route>
            </Route>

            <Route path='material'>
                <Route path='books' element={<BooksPage />} />
                <Route path='ratings' element={<RatingConversionsPage />} />
            </Route>

            {/* Legacy routes from Wix */}
            <Route path='books-by-rating' element={<BooksPage />} />
            <Route path='books' element={<BooksPage />} />
            <Route path='recommendations' element={<BooksPage />} />
            <Route path='training' element={<Navigate to='/profile' replace />} />
            <Route path='home' element={<Navigate to='/profile' replace />} />
            <Route path='plans-pricing' element={<PricingPage />} />
            <Route path='shop' element={<MerchPage />} />

            <Route path='*' element={<NotFoundPage />} />
        </Route>,
    ),
);

function App() {
    return (
        <LocalizationProvider
            dateAdapter={AdapterLuxon}
            adapterLocale={navigator.languages[0]}
        >
            <RouterProvider router={router} />
        </LocalizationProvider>
    );
}

function Root() {
    const navigate = useNavigate();

    useEffect(() => {
        return Hub.listen('auth', (data) => {
            switch (data?.payload?.event) {
                case 'customOAuthState':
                    if (data.payload.data) {
                        navigate(data.payload.data);
                    }
            }
        });
    }, [navigate]);

    return (
        <>
            <ScrollRestoration
                getKey={(location) => {
                    if (location.pathname.includes('tactics/instructions')) {
                        return location.key;
                    }
                    return location.pathname;
                }}
            />
            <TutorialProvider>
                <ErrorBoundary>
                    <Outlet />
                </ErrorBoundary>
            </TutorialProvider>
        </>
    );
}

export default App;
