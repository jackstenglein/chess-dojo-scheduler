import { useEffect } from 'react';
import { useApi } from '../api/Api';
import { useCache } from '../api/cache/Cache';
import { useRequest } from '../api/Request';
import { Club } from '../database/club';
import LoadingPage from '../loading/LoadingPage';
import ClubGrid from './ClubGrid';

const AllClubsTab = () => {
    const api = useApi();
    const request = useRequest<Club[]>();
    const cache = useCache().clubs;

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listClubs()
                .then((clubs) => {
                    console.log('listClubs: ', clubs);
                    request.onSuccess(clubs);
                    cache.putMany(clubs);
                })
                .catch((err) => {
                    console.error('listClubs: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return <ClubGrid clubs={request.data} request={request} />;
};

export default AllClubsTab;
