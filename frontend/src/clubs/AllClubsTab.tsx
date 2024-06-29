import { Stack } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useApi } from '../api/Api';
import { useRequest } from '../api/Request';
import { useCache } from '../api/cache/Cache';
import { Club } from '../database/club';
import LoadingPage from '../loading/LoadingPage';
import { ClubFilterEditor, ClubFilters, filterClubs } from './ClubFilters';
import ClubGrid from './ClubGrid';

interface AllClubsTabProps {
    filters: ClubFilters;
}

const AllClubsTab: React.FC<AllClubsTabProps> = ({ filters }) => {
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
    }, [request, api, cache]);

    const displayedClubs = useMemo(
        () => filterClubs(request.data, filters),
        [request.data, filters],
    );

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={3}>
            <ClubFilterEditor filters={filters} />
            <ClubGrid clubs={displayedClubs} request={request} />
        </Stack>
    );
};

export default AllClubsTab;
