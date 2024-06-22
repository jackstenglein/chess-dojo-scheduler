import { EventType, PgnDate, PgnTime, TimeControl } from '@jackstenglein/chess';
import { Alert, Box, Link, Snackbar, Stack, Typography } from '@mui/material';
import {
    DataGridPro,
    GridCellParams,
    GridColDef,
    GridEditInputCell,
    GridEditSingleSelectCell,
    GridRenderCellParams,
    GridRenderEditCellParams,
} from '@mui/x-data-grid-pro';
import React, { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { isValidDate, stripTagValue } from '../../../../../api/gameApi';
import { Game } from '../../../../../database/game';
import Avatar from '../../../../../profile/Avatar';
import CohortIcon from '../../../../../scoreboard/CohortIcon';
import { useChess } from '../../../PgnBoard';
import { EditDateCell } from './DateEditor';
import { TimeControlEditor } from './TimeControlEditor';

interface OwnerValue {
    displayName: string;
    username: string;
    previousCohort: string;
}

function isOwnerValue(obj: unknown): obj is OwnerValue {
    return typeof obj === 'object' && obj !== null && 'displayName' in obj;
}

export interface TagRow {
    name: string;
    value: string | OwnerValue | PgnDate | PgnTime | TimeControl;
}

const columns: GridColDef<TagRow>[] = [
    { field: 'name', flex: 0.25 },
    {
        field: 'value',
        flex: 0.75,
        editable: true,
        renderCell: (params: GridRenderCellParams<TagRow>) => {
            if (isOwnerValue(params.row.value)) {
                return (
                    <Stack direction='row' spacing={1} alignItems='center' height={1}>
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

            if (typeof params.row.value === 'string') {
                return params.row.value;
            }

            return params.row.value.value;
        },
        renderEditCell: (params) => <CustomEditComponent {...params} />,
    },
];

const dateTags = ['Date', 'EventDate', 'UTCDate', 'EndDate'];

function CustomEditComponent(props: GridRenderEditCellParams<TagRow>) {
    if (props.row.name === 'Result') {
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
                        if (typeof value === 'string') {
                            return value;
                        }
                        // This should not happen but is required by eslint
                        return '';
                    },
                }}
            />
        );
    }
    if (props.row.name === 'TimeControl') {
        return <TimeControlEditor {...props} />;
    }
    if (dateTags.includes(props.row.name)) {
        return <EditDateCell {...props} />;
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

const uneditableTags = ['PlyCount'];

interface TagsProps {
    tags?: Record<string, string>;
    game?: Game;
    allowEdits?: boolean;
}

const Tags: React.FC<TagsProps> = ({ game, allowEdits }) => {
    const chess = useChess().chess;
    const [, setForceRender] = useState(0);
    const [error, setError] = useState('');

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

    const header = chess?.pgn.header;
    if (!header) {
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

    rows.push(...defaultTags.map((name) => ({ name, value: header.getRawValue(name) })));

    for (const tag of Object.keys(header.tags || {})) {
        if (!defaultTags.includes(tag) && !uneditableTags.includes(tag)) {
            rows.push({ name: tag, value: header.getValue(tag) });
        }
    }

    for (const tag of uneditableTags) {
        rows.push({ name: tag, value: header.getRawValue(tag) });
    }

    return (
        <Box height={1}>
            {allowEdits && (
                <Typography variant='body2' color='text.secondary' ml={1} mt={1} mb={1}>
                    Double click a cell to edit
                </Typography>
            )}
            {error && (
                <Snackbar
                    data-cy='error-snackbar'
                    open={!!error}
                    autoHideDuration={6000}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    onClose={() => setError('')}
                >
                    <Alert variant='filled' severity='error' sx={{ width: '100%' }}>
                        {error}
                    </Alert>
                </Snackbar>
            )}

            <DataGridPro
                autoHeight
                sx={{
                    border: 0,
                    '& .MuiDataGrid-cell--editing': { outline: 'none !important' },
                }}
                columns={columns}
                rows={rows}
                getRowId={(row) => row.name}
                slots={{
                    columnHeaders: NullHeader,
                }}
                hideFooter
                isCellEditable={(params: GridCellParams<TagRow>) => {
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
                processRowUpdate={(newRow, oldRow) => {
                    const value = newRow.value as string;
                    const name = newRow.name;

                    if (
                        ['White', 'Date', 'Black'].includes(name) &&
                        stripTagValue(value) === ''
                    ) {
                        setError(`${name} tag is required`);
                        return oldRow;
                    }

                    if (dateTags.includes(name) && value && !isValidDate(value)) {
                        setError('PGN dates must be in the format 2024.12.31');
                        return oldRow;
                    }

                    chess.setHeader(newRow.name, newRow.value as string);
                    return {
                        ...newRow,
                        value: chess.header().getValue(newRow.name),
                    };
                }}
                onProcessRowUpdateError={(err: Error) => {
                    setError(err.message);
                }}
            />
        </Box>
    );
};

export default Tags;

const NullHeader = React.forwardRef(() => null);
NullHeader.displayName = 'NullHeader';
