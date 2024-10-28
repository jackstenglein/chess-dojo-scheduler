import { useState } from 'react';

/** Sorting methods for clubs. */
export enum ClubSortMethod {
    /** Sort clubs in alphabetical order by name. */
    Alphabetical = 'ALPHABETICAL',
    /** Sort clubs by their number of members. */
    MemberCount = 'MEMBER_COUNT',
    /** Sort clubs by their creation date. */
    CreationDate = 'CREATION_DATE',
}

/** A set of filters/sorting information for clubs. */
export interface ClubFilters {
    search: string;
    setSearch: (search: string) => void;

    sortMethod: ClubSortMethod;
    setSortMethod: (sortMethod: ClubSortMethod) => void;

    sortDirection: 'asc' | 'desc';
    setSortDirection: (sortDirection: 'asc' | 'desc') => void;
}

/** Manages the state for a set of club filters. */
export function useClubFilters(): ClubFilters {
    const [search, setSearch] = useState('');
    const [sortMethod, setSortMethod] = useState(ClubSortMethod.Alphabetical);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    return {
        search,
        setSearch,
        sortMethod,
        setSortMethod,
        sortDirection,
        setSortDirection,
    };
}
