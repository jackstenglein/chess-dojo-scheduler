import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import { ThemeProvider } from '@mui/system';

import { getConfig } from './config';
import { AuthProvider, RequireAuth, RequireProfile } from './auth/Auth';
import LandingPage from './landing/LandingPage';
import ProfilePage from './profile/ProfilePage';
import ProfileEditorPage from './profile/ProfileEditorPage';
import { ApiProvider } from './api/Api';
import CalendarPage from './calendar/CalendarPage';
import MeetingPage from './meeting/MeetingPage';
import ListMeetingsPage from './meeting/ListMeetingsPage';
import Navbar from './navbar/Navbar';
import SigninPage from './auth/SigninPage';
import SignupPage from './auth/SignupPage';
import VerifyEmailPage from './auth/VerifyEmailPage';
import ForgotPasswordPage from './auth/ForgotPasswordPage';
import AdminPage from './admin/AdminPage';
import theme from './theme';
import { CacheProvider } from './api/cache/Cache';
import GroupMeetingPage from './meeting/GroupMeetingPage';
import GamePage from './games/GamePage';
import ListGamesPage from './games/ListGamesPage';
import SubmitGamePage from './games/SubmitGamePage';
import AvailabilityBooker from './calendar/AvailabilityBooker';
import ScoreboardPage from './scoreboard/ScoreboardPage';
import NotFoundPage from './NotFoundPage';
import RequirementPage from './requirements/RequirementPage';
import { GraduationPrompt } from './profile/GraduationPrompt';
import HomePage from './home/HomePage';
import HelpPage from './help/HelpPage';

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

function App() {
    return (
        <ThemeProvider theme={theme}>
            <BrowserRouter>
                <AuthProvider>
                    <ApiProvider>
                        <CacheProvider>
                            <Navbar />
                            <Router />
                        </CacheProvider>
                    </ApiProvider>
                </AuthProvider>
            </BrowserRouter>
        </ThemeProvider>
    );
}

function Router() {
    return (
        <Routes>
            <Route path='/'>
                <Route index element={<LandingPage />} />
                <Route path='signin' element={<SigninPage />} />
                <Route path='signup' element={<SignupPage />} />
                <Route path='verify-email' element={<VerifyEmailPage />} />
                <Route path='forgot-password' element={<ForgotPasswordPage />} />
                <Route path='help' element={<HelpPage />} />

                <Route element={<RequireAuth />}>
                    <Route element={<GraduationPrompt />}>
                        <Route path='profile'>
                            <Route index element={<ProfilePage />} />
                            <Route path='edit' element={<ProfileEditorPage />} />
                            <Route path=':username' element={<ProfilePage />} />
                        </Route>
                        <Route path='admin' element={<AdminPage />} />

                        <Route element={<RequireProfile />}>
                            <Route path='home' element={<HomePage />} />
                            <Route path='calendar' element={<CalendarPage />}>
                                <Route
                                    path='availability/:id'
                                    element={<AvailabilityBooker />}
                                />
                            </Route>
                            <Route path='meeting'>
                                <Route index element={<ListMeetingsPage />} />
                                <Route path=':meetingId' element={<MeetingPage />} />
                            </Route>
                            <Route
                                path='group/:availabilityId'
                                element={<GroupMeetingPage />}
                            />
                            <Route path='games'>
                                <Route index element={<ListGamesPage />} />
                                <Route path='submit' element={<SubmitGamePage />} />
                                <Route path=':cohort/:id' element={<GamePage />} />
                            </Route>

                            <Route path='scoreboard'>
                                <Route index element={<ScoreboardPage />} />
                                <Route path=':cohort' element={<ScoreboardPage />} />
                            </Route>

                            <Route
                                path='requirements/:id'
                                element={<RequirementPage />}
                            />
                        </Route>
                    </Route>
                </Route>
                <Route path='*' element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}

export default App;
