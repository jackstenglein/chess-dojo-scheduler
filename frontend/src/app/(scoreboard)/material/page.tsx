import { Navigate, useSearchParams } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';

/**
 * Legacy page that redirects to the new page. This is only still here in case the
 * user had the old page bookmarked.
 */
const MaterialPage = () => {
    const [searchParams] = useSearchParams({});

    switch (searchParams.get('view')) {
        case 'openings':
            return <Navigate to='/courses' replace />;
        case 'books':
            return <Navigate to='/material/books' replace />;
        case 'sparring':
            return <Navigate to='/material/sparring' replace />;
        case 'modelGames':
            return <Navigate to='/material/modelgames' replace />;
        case 'memorizeGames':
            return <Navigate to='/material/memorizegames' replace />;
        case 'ratings':
            return <Navigate to='/material/ratings' replace />;
    }

    return <NotFoundPage />;
};

export default MaterialPage;
