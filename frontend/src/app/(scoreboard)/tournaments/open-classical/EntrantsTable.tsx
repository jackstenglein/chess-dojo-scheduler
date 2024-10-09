import { OpenClassical } from '@/database/tournament';
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';
import { useMemo } from 'react';

interface EntrantsTableRow {
    lichessUsername: string;
    discordUsername: string;
    rating: number;
}

const columns: GridColDef<EntrantsTableRow>[] = [
    {
        field: 'lichessUsername',
        headerName: 'Lichess Username',
        flex: 1,
    },
    {
        field: 'discordUsername',
        headerName: 'Discord Username',
        flex: 1,
    },
    {
        field: 'rating',
        headerName: 'Rating',
    },
];

interface EntrantsTableProps {
    openClassical?: OpenClassical;
    region: string;
    ratingRange: string;
}

const EntrantsTable: React.FC<EntrantsTableProps> = ({
    openClassical,
    region,
    ratingRange,
}) => {
    const rows = useMemo(() => {
        if (!openClassical) {
            return [];
        }
        const section = openClassical.sections[`${region}_${ratingRange}`];
        if (!section) {
            return [];
        }

        return Object.values(section.players).map((player) => ({
            lichessUsername: player.lichessUsername,
            discordUsername: player.discordUsername,
            rating: player.rating,
        }));
    }, [openClassical, region, ratingRange]);

    if (!openClassical) {
        return null;
    }

    return (
        <DataGridPro
            getRowId={(player) => player.lichessUsername}
            rows={rows}
            columns={columns}
            autoHeight
            initialState={{
                sorting: {
                    sortModel: [{ field: 'rating', sort: 'desc' }],
                },
            }}
        />
    );
};

export default EntrantsTable;
