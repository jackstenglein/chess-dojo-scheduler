import { Link } from '@/components/navigation/Link';
import { OpenClassical, OpenClassicalPlayer } from '@/database/tournament';
import { DataGridPro, GridColDef } from '@mui/x-data-grid-pro';
import { useMemo } from 'react';

const columns: GridColDef<OpenClassicalPlayer>[] = [
    {
        field: 'displayName',
        headerName: 'Name',
        flex: 1,
        renderCell(params) {
            return <Link href={`/profile/${params.row.username}`}>{params.value}</Link>;
        },
    },
    {
        field: 'lichessUsername',
        headerName: 'Lichess',
        flex: 1,
        renderCell(params) {
            return (
                <Link href={`https://lichess.org/@/${params.value}`} target='_blank' rel='noopener'>
                    {params.value}
                </Link>
            );
        },
    },
    {
        field: 'discordUsername',
        headerName: 'Discord',
        flex: 1,
        renderCell(params) {
            return (
                <Link
                    href={`https://discord.com/users/${params.row.discordId}`}
                    target='_blank'
                    rel='noopener'
                >
                    {params.value}
                </Link>
            );
        },
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

const EntrantsTable: React.FC<EntrantsTableProps> = ({ openClassical, region, ratingRange }) => {
    const rows = useMemo(() => {
        if (!openClassical) {
            return [];
        }
        const section = openClassical.sections[`${region}_${ratingRange}`];
        if (!section) {
            return [];
        }

        return Object.values(section.players);
    }, [openClassical, region, ratingRange]);

    if (!openClassical) {
        return null;
    }

    return (
        <DataGridPro
            getRowId={(player) => player.username}
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
