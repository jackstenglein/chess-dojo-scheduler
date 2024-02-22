import {
    FormControl,
    FormControlLabel,
    FormLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Stack,
    TextField,
} from '@mui/material';
import { useState } from 'react';

export interface ClubFilters {
    search: string;
    setSearch: (search: string) => void;

    sortMethod: ClubSortMethod;
    setSortMethod: (sortMethod: ClubSortMethod) => void;

    sortDirection: 'asc' | 'desc';
    setSortDirection: (sortDirection: 'asc' | 'desc') => void;
}

export enum ClubSortMethod {
    Alphabetical = 'ALPHABETICAL',
    MemberCount = 'MEMBER_COUNT',
}

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

interface ClubFilterEditorProps {
    filters: ClubFilters;
}

export const ClubFilterEditor: React.FC<ClubFilterEditorProps> = ({ filters }) => {
    return (
        <Stack direction='row' spacing={3} alignItems='center' flexWrap='wrap' rowGap={3}>
            <TextField
                label='Search...'
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                sx={{ flexGrow: 1 }}
            />

            <Stack direction='row' spacing={2} alignItems='center'>
                <TextField
                    select
                    label='Sort By'
                    value={filters.sortMethod}
                    onChange={(e) =>
                        filters.setSortMethod(e.target.value as ClubSortMethod)
                    }
                >
                    <MenuItem value={ClubSortMethod.Alphabetical}>Alphabetical</MenuItem>
                    <MenuItem value={ClubSortMethod.MemberCount}>Member Count</MenuItem>
                </TextField>

                <FormControl>
                    <FormLabel>Sort Direction</FormLabel>
                    <RadioGroup
                        value={filters.sortDirection}
                        onChange={(e) =>
                            filters.setSortDirection(e.target.value as 'asc' | 'desc')
                        }
                        row
                    >
                        <FormControlLabel
                            control={<Radio />}
                            label='Ascending'
                            value='asc'
                        />
                        <FormControlLabel
                            control={<Radio />}
                            label='Descending'
                            value='desc'
                        />
                    </RadioGroup>
                </FormControl>
            </Stack>
        </Stack>
    );
};
