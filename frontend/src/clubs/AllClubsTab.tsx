import { Stack } from '@mui/material';
import { useEffect, useMemo } from 'react';
import { useApi } from '../api/Api';
import { useCache } from '../api/cache/Cache';
import { useRequest } from '../api/Request';
import { Club } from '../database/club';
import LoadingPage from '../loading/LoadingPage';
import { ClubFilterEditor, ClubFilters, ClubSortMethod } from './ClubFilters';
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

    const displayedClubs = useMemo(() => {
        let result = request.data || [];
        const search = filters.search.trim().toLowerCase();
        if (search) {
            result = result.filter(
                (club) =>
                    club.name.toLowerCase().includes(search) ||
                    club.shortDescription.toLowerCase().includes(search) ||
                    club.location.city.toLowerCase().includes(search) ||
                    club.location.state.toLowerCase().includes(search) ||
                    club.location.country.toLowerCase().includes(search),
            );
        }
        return result.sort((lhs: Club, rhs: Club) => {
            if (filters.sortMethod === ClubSortMethod.Alphabetical) {
                if (filters.sortDirection === 'asc') {
                    return lhs.name.localeCompare(rhs.name);
                }
                return rhs.name.localeCompare(lhs.name);
            }

            if (filters.sortDirection === 'asc') {
                return lhs.memberCount - rhs.memberCount;
            }
            return rhs.memberCount - lhs.memberCount;
        });
    }, [request.data, filters]);

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
