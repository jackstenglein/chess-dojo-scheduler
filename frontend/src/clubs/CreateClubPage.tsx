import { LoadingButton } from '@mui/lab';
import {
    Checkbox,
    Container,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import { AxiosResponse } from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { ClubDetails } from '../database/club';
import LoadingPage from '../loading/LoadingPage';
import { ClubDetailsParams } from './ClubDetailsPage';

const CreateClubPage = () => {
    const api = useApi();
    const getRequest = useRequest<ClubDetails>();
    const saveRequest = useRequest();
    const navigate = useNavigate();
    const { id } = useParams<ClubDetailsParams>();

    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [unlisted, setUnlisted] = useState(false);
    const [approvalRequired, setApprovalRequired] = useState(false);
    const [allowFreeTier, setAllowFreeTier] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (id && !getRequest.isSent()) {
            getRequest.onStart();
            api.getClub(id)
                .then((resp) => {
                    console.log('getClub: ', resp);
                    getRequest.onSuccess(resp.data.club);
                    const club = resp.data.club;
                    setName(club.name);
                    setShortDescription(club.shortDescription);
                    setDescription(club.description);
                    setExternalUrl(club.externalUrl);
                    setCity(club.location.city);
                    setState(club.location.state);
                    setCountry(club.location.country);
                    setUnlisted(club.unlisted);
                    setApprovalRequired(club.approvalRequired);
                })
                .catch((err) => {
                    console.error(err);
                    getRequest.onFailure(err);
                });
        }
    }, [id, getRequest, api]);

    if (id && (!getRequest.isSent() || getRequest.isLoading())) {
        return <LoadingPage />;
    }

    const onSave = () => {
        const errors: Record<string, string> = {};
        if (name.trim().length === 0) {
            errors.name = 'This field is required';
        }
        if (!unlisted) {
            if (shortDescription.trim().length === 0) {
                errors.shortDescription = 'This field is required';
            } else if (shortDescription.length > 300) {
                errors.shortDescriptionOverride = 'true';
            }
        }
        if (description.trim().length === 0) {
            errors.description = 'This field is required';
        }
        setErrors(errors);
        if (Object.values(errors).length > 0) {
            return;
        }

        const club = {
            name,
            shortDescription,
            description,
            externalUrl,
            location: {
                city,
                state,
                country,
            },
            unlisted,
            approvalRequired,
            allowFreeTier,
        };

        saveRequest.onStart();
        let promise: Promise<AxiosResponse<ClubDetails>>;
        if (id) {
            promise = api.updateClub(id, club);
        } else {
            promise = api.createClub(club);
        }

        promise
            .then((resp) => {
                console.log('createClub: ', resp);
                navigate(`/clubs/${resp.data.id}`);
            })
            .catch((err) => {
                console.error('createClub: ', err);
                saveRequest.onFailure(err);
            });
    };

    return (
        <Container sx={{ py: 4 }}>
            <RequestSnackbar request={saveRequest} />

            <Typography variant='h5'>{id ? 'Edit Club' : 'Create New Club'}</Typography>

            <Stack spacing={3} mt={5}>
                <TextField
                    label='Name'
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={Boolean(errors.name)}
                    helperText={errors.name}
                />

                {!unlisted && (
                    <TextField
                        label='Short Description'
                        required
                        multiline
                        minRows={3}
                        value={shortDescription}
                        onChange={(e) => setShortDescription(e.target.value)}
                        error={
                            Boolean(errors.shortDescription) ||
                            shortDescription.length > 300
                        }
                        helperText={
                            errors.shortDescription ||
                            `${shortDescription.length}/300 characters. Displayed on the club list page.`
                        }
                    />
                )}

                <TextField
                    label='Full Description'
                    required
                    multiline
                    minRows={5}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    error={Boolean(errors.description)}
                    helperText={
                        errors.description ||
                        "Supports markdown formatting and is displayed on the club's main page"
                    }
                />

                <TextField
                    label='URL'
                    helperText='Add this if you want to link to an external site'
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                />

                <Grid2 container columnSpacing={2} rowSpacing={3}>
                    <Grid2 sm={4}>
                        <TextField
                            label='City'
                            fullWidth
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                        />
                    </Grid2>
                    <Grid2 sm={4}>
                        <TextField
                            label='State'
                            fullWidth
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                        />
                    </Grid2>
                    <Grid2 sm={4}>
                        <TextField
                            label='Country'
                            fullWidth
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                        />
                    </Grid2>
                </Grid2>

                <Stack spacing={1}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!allowFreeTier}
                                onChange={(_, checked) => setAllowFreeTier(!checked)}
                            />
                        }
                        label='Limit access to subscribers? If checked, free-tier users will not be able to join.'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={unlisted}
                                onChange={(_, checked) => setUnlisted(checked)}
                            />
                        }
                        label='Unlisted? If checked, this club will not appear in the list and can only be shared by its URL.'
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={approvalRequired}
                                onChange={(_, checked) => setApprovalRequired(checked)}
                            />
                        }
                        label="Require approval to join? If checked, you must manually approve each user's request to join."
                    />
                </Stack>

                <LoadingButton
                    variant='contained'
                    onClick={onSave}
                    loading={saveRequest.isLoading()}
                    sx={{ alignSelf: 'center' }}
                >
                    {id ? 'Save' : 'Create Club'}
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default CreateClubPage;
