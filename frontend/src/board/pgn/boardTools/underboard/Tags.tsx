import { EventType, TAGS } from '@jackstenglein/chess';
import { Box, Link, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridColDef,
    GridEditInputCell,
    GridEditSingleSelectCell,
    GridRenderCellParams,
    GridRenderEditCellParams,
} from '@mui/x-data-grid-pro';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Game } from '../../../../database/game';
import Avatar from '../../../../profile/Avatar';
import CohortIcon from '../../../../scoreboard/CohortIcon';
import { useChess } from '../../PgnBoard';

interface TagRow {
    name: string;
    value:
        | string
        | {
              displayName: string;
              username: string;
              previousCohort: string;
          };
}

const columns: GridColDef<TagRow>[] = [
    { field: 'name', flex: 0.25 },
    {
        field: 'value',
        flex: 0.75,
        editable: true,
        renderCell: (params: GridRenderCellParams<TagRow>) => {
            if (
                params.row.name === 'Uploaded By' &&
                typeof params.row.value === 'object'
            ) {
                return (
                    <Stack direction='row' spacing={1} alignItems='center'>
                        <Avatar
                            username={params.row.value.username}
                            displayName={params.row.value.displayName}
                            size={28}
                        />
                        <Link
                            component={RouterLink}
                            to={`/profile/${params.row.value.username}`}
                        >
                            <Typography variant='body2'>
                                {params.row.value.displayName}
                            </Typography>
                        </Link>
                        <CohortIcon cohort={params.row.value.previousCohort} size={20} />
                    </Stack>
                );
            }

            if (params.row.name === 'Cohort' && typeof params.row.value === 'string') {
                return (
                    <Link
                        component={RouterLink}
                        to={`/games/?type=cohort&cohort=${encodeURIComponent(
                            params.row.value,
                        )}`}
                    >
                        {params.row.value}
                    </Link>
                );
            }

            return params.row.value.toString();
        },
        renderEditCell: (params) => <CustomEditComponent {...params} />,
    },
];

function CustomEditComponent(props: GridRenderEditCellParams<TagRow>) {
    if (props.row.name === TAGS.Result) {
        return (
            <GridEditSingleSelectCell
                {...props}
                variant='outlined'
                colDef={{
                    ...props.colDef,
                    type: 'singleSelect',
                    valueOptions: ['1-0', '1/2-1/2', '0-1'],
                    getOptionValue(value) {
                        return value;
                    },
                    getOptionLabel(value) {
                        return value.toString();
                    },
                }}
            />
        );
    }

    return <GridEditInputCell {...props} />;
}

const defaultTags = [
    'White',
    'WhiteElo',
    'Black',
    'BlackElo',
    'Result',
    'Date',
    'Event',
    'Section',
    'Round',
    'Board',
];

const uneditableTags = ['PlyCount', 'TimeControl'];

interface TagsProps {
    tags?: Record<string, string>;
    game?: Game;
    allowEdits?: boolean;
}

const Tags: React.FC<TagsProps> = ({ game, allowEdits }) => {
    const chess = useChess().chess;
    const [, setForceRender] = useState(0);

    useEffect(() => {
        if (chess) {
            const observer = {
                types: [EventType.UpdateHeader],
                handler: () => {
                    setForceRender((v) => v + 1);
                },
            };

            chess.addObserver(observer);
            return () => chess.removeObserver(observer);
        }
    }, [chess]);

    const tags = chess?.pgn.header.tags;
    if (!tags) {
        return null;
    }

    const rows: TagRow[] = [];
    if (game) {
        if (game.ownerDisplayName) {
            rows.push({
                name: 'Uploaded By',
                value: {
                    displayName: game.ownerDisplayName,
                    username: game.owner,
                    previousCohort: game.ownerPreviousCohort,
                },
            });
        }
        rows.push({ name: 'Cohort', value: game.cohort });
    }

    rows.push(...defaultTags.map((name) => ({ name, value: tags[name] || '' })));

    for (const [tag, value] of Object.entries(tags || {})) {
        if (!defaultTags.includes(tag) && !uneditableTags.includes(tag)) {
            rows.push({ name: tag, value });
        }
    }

    for (const tag of uneditableTags) {
        rows.push({ name: tag, value: tags[tag] || '' });
    }

    return (
        <Box height={1}>
            {allowEdits && (
                <Typography variant='body2' color='text.secondary' ml={1} mt={1} mb={1}>
                    Double click a cell to edit
                </Typography>
            )}

            <DataGridPro
                autoHeight
                sx={{ border: 0 }}
                columns={columns}
                rows={rows}
                getRowId={(row) => row.name}
                slots={{
                    columnHeaders: () => null,
                    footer: () => null,
                }}
                isCellEditable={(params) => {
                    if (!allowEdits) {
                        return false;
                    }
                    if (
                        params.row.name === 'Uploaded By' ||
                        params.row.name === 'Cohort'
                    ) {
                        return false;
                    }
                    return !uneditableTags.includes(params.row.name);
                }}
                processRowUpdate={(newRow) => {
                    chess.setHeader(newRow.name, newRow.value as string);
                    return newRow;
                }}
            />
        </Box>
    );
};

export default Tags;
