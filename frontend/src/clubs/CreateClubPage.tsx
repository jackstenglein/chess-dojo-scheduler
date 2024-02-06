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
import { useNavigate } from 'react-router-dom';

import { useState } from 'react';
import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';

const CreateClubPage = () => {
    const api = useApi();
    const request = useRequest();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [externalUrl, setExternalUrl] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [unlisted, setUnlisted] = useState(false);
    const [approvalRequired, setApprovalRequired] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const onCreate = () => {
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

        request.onStart();
        api.createClub({
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
        })
            .then((resp) => {
                console.log('createClub: ', resp);
                navigate(`/clubs/${resp.data.id}`);
            })
            .catch((err) => {
                console.error('createClub: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Container sx={{ py: 4 }}>
            <RequestSnackbar request={request} />

            <Typography variant='h5'>Create New Club</Typography>

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
                    onClick={onCreate}
                    loading={request.isLoading()}
                    sx={{ alignSelf: 'center' }}
                >
                    Create Club
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default CreateClubPage;
