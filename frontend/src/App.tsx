import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Amplify from 'aws-amplify';

import { config } from './config';

import { AuthProvider, RequireAuth } from './auth/Auth';
import LandingPage from './home/LandingPage';

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
                <Router />
            </AuthProvider>
        </BrowserRouter>
    );
}

function Router() {
    return (
        <Routes>
            <Route path='/'>
                <Route index element={<LandingPage />} />

                {/* <Route element={<RequireAuth />}> */}
                {/* <Route path='select-type' element={<SelectTypePage />} />
                    <Route path='select-school' element={<SelectSchoolPage />} />
                    <Route path='select-class' element={<SelectClassPage />} />
                    <Route path='verify-class' element={<VerifyClassPage />} />
                    <Route path='service-terms' element={<TermsOfServicePage />} /> */}

                {/* <Route element={<RequireSignup />}> */}
                {/* <Route path='home' element={<HomePage />} /> */}
                {/* </Route> */}
                {/* </Route> */}
                {/* <Route path='*' element={<NotFoundPage />} /> */}
            </Route>
        </Routes>
    );
}

export default App;
