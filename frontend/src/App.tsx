import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Amplify from 'aws-amplify';

import { config } from './config';

import { AuthProvider, RequireAuth, RequireProfile } from './auth/Auth';
import LandingPage from './home/LandingPage';
import ProfilePage from './profile/ProfilePage';
import { ApiProvider } from './api/Api';

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
        <BrowserRouter>
            <AuthProvider>
                <ApiProvider>
                    <Router />
                </ApiProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

function Router() {
    return (
        <Routes>
            <Route path='/'>
                <Route index element={<LandingPage />} />

                <Route element={<RequireAuth />}>
                    <Route path='profile' element={<ProfilePage />} />

                    <Route element={<RequireProfile />}>
                        <Route path='home' element={<h2>Home</h2>} />
                    </Route>
                </Route>
                {/* <Route path='*' element={<NotFoundPage />} /> */}
            </Route>
        </Routes>
    );
}

export default App;
