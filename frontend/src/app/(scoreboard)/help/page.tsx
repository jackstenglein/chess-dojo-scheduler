import { AuthStatus, useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import AuthenticatedHelp from './AuthenticatedHelp';
import UnauthenticatedHelp from './UnauthenticatedHelp';

const HelpPage = () => {
    const authStatus = useAuth().status;

    switch (authStatus) {
        case AuthStatus.Loading:
            return <LoadingPage />;
        case AuthStatus.Authenticated:
            return <AuthenticatedHelp />;
        case AuthStatus.Unauthenticated:
            return <UnauthenticatedHelp />;
    }
};

export default HelpPage;
