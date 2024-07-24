import { Navigate } from 'react-router-dom';

import { useAuth } from '../../auth/Auth';

const YearReviewRedirect = () => {
    const user = useAuth().user;

    if (!user) {
        return <Navigate to='/' replace />;
    }

    return <Navigate to={`/yearreview/${user.username}/2023`} replace />;
};

export default YearReviewRedirect;
