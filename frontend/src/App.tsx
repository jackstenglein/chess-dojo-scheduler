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
import CalendarPage from './calendar/CalendarPage';
import EventBooker from './calendar/EventBooker';
import ExamInstructionsPage from './exams/instructions/ExamInstructionsPage';
import { AdminStatsPage } from './exams/view/AdminStatsPage';
import ExamPage from './exams/view/ExamPage';
import EditGamePage from './games/edit/EditGamePage';
import ImportGamePage from './games/import/ImportGamePage';
import ListGamesPage from './games/list/ListGamesPage';
import ReviewQueuePage from './games/review/ReviewQueuePage';
import GamePage from './games/view/GamePage';
import ProfilePage from './profile/ProfilePage';
import { SwitchCohortPrompt } from './profile/SwitchCohortPrompt';
import ProfileEditorPage from './profile/editor/ProfileEditorPage';
import FollowersPage from './profile/followers/FollowersPage';
import YearReviewRedirect from './profile/yearReview/YearReviewRedirect';
import { TutorialProvider } from './tutorial/TutorialContext';

LicenseInfo.setLicenseKey(
    '54bc84a7ecb1e4bb301846936cb75a56Tz03ODMxNixFPTE3MzExMDQzNDQwMDAsUz1wcm8sTE09c3Vic2NyaXB0aW9uLEtWPTI=',
);

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<Root />}>
            <Route element={<SwitchCohortPrompt />}>
                <Route index element={<LandingPage />} />

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
                        <Route path=':type/:id'>
                            <Route index element={<ExamInstructionsPage />} />
                            <Route path='exam' element={<ExamPage />} />
                            <Route path='stats' element={<AdminStatsPage />} />
                        </Route>
                    </Route>

                    <Route path='calendar' element={<CalendarPage />}>
                        <Route path='availability/:id' element={<EventBooker />} />
                    </Route>

                    <Route path='games'>
                        <Route index element={<ListGamesPage />} />
                        <Route path='import' element={<ImportGamePage />} />
                        <Route
                            path='submit'
                            element={<Navigate to='/games/import' replace />}
                        />
                        <Route path=':cohort/:id'>
                            <Route path='edit' element={<EditGamePage />} />
                        </Route>
                        <Route path='review-queue' element={<ReviewQueuePage />} />
                    </Route>
                </Route>
            </Route>

            {/* Unauthenticated */}

            <Route path='games'>
                <Route path=':cohort/:id'>
                    <Route index element={<GamePage />} />
                </Route>
            </Route>

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
