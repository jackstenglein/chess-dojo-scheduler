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
import { MUI_LICENSE_KEY } from './config';
import EditGamePage from './games/edit/EditGamePage';
import ImportGamePage from './games/import/ImportGamePage';
import ListGamesPage from './games/list/ListGamesPage';
import ReviewQueuePage from './games/review/ReviewQueuePage';
import GamePage from './games/view/GamePage';
import { SwitchCohortPrompt } from './profile/SwitchCohortPrompt';
import { TutorialProvider } from './tutorial/TutorialContext';

LicenseInfo.setLicenseKey(MUI_LICENSE_KEY);

const router = createBrowserRouter(
    createRoutesFromElements(
        <Route path='/' element={<Root />}>
            <Route element={<SwitchCohortPrompt />}>
                <Route index element={<LandingPage />} />

                <Route element={<RequireAuth />}>
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
