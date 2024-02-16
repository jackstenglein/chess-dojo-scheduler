import { useClubs } from '../api/cache/clubs';
import { useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import ClubGrid from './ClubGrid';

const NO_CLUBS: string[] = [];

const MyClubsTab = () => {
    const user = useAuth().user;
    const { clubs, request } = useClubs(user?.clubs || NO_CLUBS);

    if (clubs.length === 0 && request.isLoading()) {
        return <LoadingPage />;
    }

    return <ClubGrid clubs={clubs} request={request} />;
};

export default MyClubsTab;
