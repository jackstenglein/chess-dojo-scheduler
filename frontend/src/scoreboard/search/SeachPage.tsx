import {
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    FormHelperText,
    Link,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridValueGetterParams,
} from '@mui/x-data-grid';
import { LoadingButton } from '@mui/lab';
import { Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';

import { useApi } from '../../api/Api';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { RatingSystem, User } from '../../database/user';
import Avatar from '../../profile/Avatar';
import ScoreboardViewSelector from '../ScoreboardViewSelector';

const AllColumns: GridColDef[] = [
    {
        field: 'dojoCohort',
        headerName: 'Cohort',
        valueGetter: (params: GridValueGetterParams<User, any>) => params.row.dojoCohort,
        minWidth: 125,
    },
    {
        field: 'display',
        headerName: 'Display Name',
        valueGetter: (params: GridValueGetterParams<User, any>) => params.row.displayName,
        renderCell: (params: GridRenderCellParams<User, string>) => {
            return (
                <Stack direction='row' spacing={1} alignItems='center'>
                    <Avatar
                        username={params.row.username}
                        displayName={params.value}
                        size={32}
                    />
                    <Link component={RouterLink} to={`/profile/${params.row.username}`}>
                        {params.value}
                    </Link>
                </Stack>
            );
        },
        minWidth: 250,
        flex: 1,
    },
    {
        field: 'discord',
        headerName: 'Discord Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.discordUsername,
        flex: 1,
    },
    {
        field: RatingSystem.Chesscom,
        headerName: 'Chess.com Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Chesscom]?.username,
        flex: 1,
        minWidth: 175,
    },
    {
        field: RatingSystem.Lichess,
        headerName: 'Lichess Username',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Lichess]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Fide,
        headerName: 'FIDE ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Fide]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Uscf,
        headerName: 'USCF ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Uscf]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Cfc,
        headerName: 'CFC ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Cfc]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Ecf,
        headerName: 'ECF ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Ecf]?.username,
        flex: 1,
    },
    {
        field: RatingSystem.Dwz,
        headerName: 'DWZ ID',
        valueGetter: (params: GridValueGetterParams<User, any>) =>
            params.row.ratings[RatingSystem.Dwz]?.username,
        flex: 1,
    },
];

const SearchFields = ['display', 'discord', ...Object.values(RatingSystem)];

function getDisplayString(field: string): string {
    switch (field) {
        case 'display':
            return 'Display Name';
        case 'discord':
            return 'Discord Username';
        case RatingSystem.Chesscom:
            return 'Chess.com Username';
        case RatingSystem.Lichess:
            return 'Lichess Username';
        case RatingSystem.Fide:
            return 'FIDE ID';
        case RatingSystem.Uscf:
            return 'USCF ID';
        case RatingSystem.Cfc:
            return 'CFC ID';
        case RatingSystem.Ecf:
            return 'ECF ID';
        case RatingSystem.Dwz:
            return 'DWZ ID';
    }
    return '';
}

const SearchPage = () => {
    const api = useApi();
    const request = useRequest<User[]>();

    const [query, setQuery] = useState('');
    const [allFields, setAllFields] = useState(true);
    const [fields, setFields] = useState<Record<string, boolean>>(
        SearchFields.reduce((map, field) => {
            map[field] = false;
            return map;
        }, {} as Record<string, boolean>)
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [columns, setColumns] = useState(AllColumns);

    const onChangeField = (field: string, value: boolean) => {
        setFields({
            ...fields,
            [field]: value,
        });
    };

    const onSearch = () => {
        const newErrors: Record<string, string> = {};
        if (query.trim() === '') {
            newErrors.query = 'This field is required';
        }
        const selectedFields = allFields
            ? ['all']
            : Object.keys(fields).filter((f) => fields[f]);
        if (selectedFields.length === 0) {
            newErrors.fields = 'At least one search field is required';
        }

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();

        if (allFields) {
            setColumns(AllColumns);
        } else {
            setColumns(AllColumns.filter((c, i) => i <= 1 || fields[c.field]));
        }

        api.searchUsers(query.trim(), selectedFields)
            .then((resp) => {
                console.log('searchUsers: ', resp);
                request.onSuccess(resp);
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Container maxWidth='xl' sx={{ pt: 4, pb: 4 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={4}>
                <ScoreboardViewSelector value='search' />

                <Stack spacing={1} alignItems='start'>
                    <TextField
                        data-cy='search-query'
                        label='Search Query'
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        fullWidth
                        error={!!errors.query}
                        helperText={errors.query}
                    />

                    <Stack>
                        <Typography variant='subtitle1' color='text.secondary'>
                            Users with any matching field are included in the results.
                        </Typography>
                        <FormControl error={!!errors.fields}>
                            <FormControlLabel
                                data-cy='search-field'
                                control={
                                    <Checkbox
                                        checked={allFields}
                                        onChange={(event) =>
                                            setAllFields(event.target.checked)
                                        }
                                    />
                                }
                                label='All Fields'
                            />
                            <Stack
                                direction='row'
                                sx={{ flexWrap: 'wrap', columnGap: 2.5 }}
                            >
                                {SearchFields.map((field) => {
                                    if (field === RatingSystem.Custom) {
                                        return null;
                                    }
                                    return (
                                        <FormControlLabel
                                            data-cy='search-field'
                                            key={field}
                                            control={
                                                <Checkbox
                                                    checked={allFields || fields[field]}
                                                    onChange={(event) =>
                                                        onChangeField(
                                                            field,
                                                            event.target.checked
                                                        )
                                                    }
                                                />
                                            }
                                            disabled={allFields}
                                            label={getDisplayString(field)}
                                        />
                                    );
                                })}
                            </Stack>
                            <FormHelperText>{errors.fields}</FormHelperText>
                        </FormControl>
                    </Stack>

                    <LoadingButton
                        data-cy='search-button'
                        variant='contained'
                        onClick={onSearch}
                        loading={request.isLoading()}
                    >
                        Search
                    </LoadingButton>
                </Stack>

                {request.data && (
                    <DataGrid
                        data-cy='search-results'
                        autoHeight
                        columns={columns}
                        rows={request.data ?? []}
                        pageSizeOptions={[5, 10, 25]}
                        initialState={{
                            pagination: {
                                paginationModel: {
                                    page: 0,
                                    pageSize: 10,
                                },
                            },
                        }}
                        getRowId={(row) => row.username}
                    />
                )}
            </Stack>
        </Container>
    );
};

export default SearchPage;
