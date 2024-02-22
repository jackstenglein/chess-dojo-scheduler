import { Stack } from '@mui/material';
import { useMemo } from 'react';
import { useClubs } from '../api/cache/clubs';
import { useAuth } from '../auth/Auth';
import LoadingPage from '../loading/LoadingPage';
import { ClubFilterEditor, ClubFilters, filterClubs } from './ClubFilters';
import ClubGrid from './ClubGrid';

const NO_CLUBS: string[] = [];

interface MyClubsTabProps {
    filters: ClubFilters;
}

const MyClubsTab: React.FC<MyClubsTabProps> = ({ filters }) => {
    const user = useAuth().user;
    const { clubs, request } = useClubs(user?.clubs || NO_CLUBS);

    const displayedClubs = useMemo(() => filterClubs(clubs, filters), [clubs, filters]);

    if (clubs.length === 0 && request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Stack spacing={3}>
            <ClubFilterEditor filters={filters} />
            <ClubGrid clubs={displayedClubs} request={request} />
        </Stack>
    );
};

export default MyClubsTab;
