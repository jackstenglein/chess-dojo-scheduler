import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    Checkbox,
    Container,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

import { AuthStatus, useAuth } from '../../auth/Auth';
import LoadingPage from '../../loading/LoadingPage';
import { RequestSnackbar, useRequest } from '../../api/Request';
import { useApi } from '../../api/Api';

const RegistrationPage = () => {
    const auth = useAuth();
    const user = auth.user;
    const api = useApi();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [lichessUsername, setLichessUsername] = useState(
        user?.ratings?.LICHESS?.username || ''
    );
    const [discordUsername, setDiscordUsername] = useState(user?.discordUsername || '');
    const [title, setTitle] = useState('');
    const [region, setRegion] = useState('');
    const [section, setSection] = useState('');
    const [byeRequests, setByeRequests] = useState([
        false,
        false,
        false,
        false,
        false,
        false,
        false,
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const request = useRequest();

    useEffect(() => {
        setLichessUsername(user?.ratings?.LICHESS?.username || '');
        setDiscordUsername(user?.discordUsername || '');
    }, [user]);

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    const onSetByeRequest = (idx: number, value: boolean) => {
        setByeRequests([
            ...byeRequests.slice(0, idx),
            value,
            ...byeRequests.slice(idx + 1),
        ]);
    };

    const onRegister = () => {
        const newErrors: Record<string, string> = {};

        if (!user && email.trim() === '') {
            newErrors.email = 'This field is required';
        }
        if (lichessUsername.trim() === '') {
            newErrors.lichessUsername = 'This field is required';
        }
        if (discordUsername.trim() === '') {
            newErrors.discordUsername = 'This field is required';
        }
        if (region === '') {
            newErrors.region = 'This field is required';
        }
        if (section === '') {
            newErrors.section = 'This field is required';
        }
        if (byeRequests.every((v) => v)) {
            newErrors.byeRequests = 'You cannot request a bye for every round';
        }
        console.log('New errors: ', newErrors);

        setErrors(newErrors);
        if (Object.entries(newErrors).length > 0) {
            return;
        }

        request.onStart();
        api.registerForOpenClassical({
            email: email.trim(),
            lichessUsername: lichessUsername.trim(),
            discordUsername: discordUsername.trim(),
            title,
            region,
            section,
            byeRequests,
        })
            .then((resp) => {
                console.log('registerForOpenClassical: ', resp);
                navigate(
                    `/tournaments/open-classical?region=${region}&ratingRange=${section}`
                );
            })
            .catch((err) => {
                console.error(err);
                request.onFailure(err);
            });
    };

    return (
        <Container maxWidth='md' sx={{ pt: 5, pb: 10 }}>
            <RequestSnackbar request={request} />

            <Stack spacing={4} alignItems='center'>
                <Typography variant='h6' alignSelf='start'>
                    Register for the Open Classical
                </Typography>

                {!user && (
                    <TextField
                        label='Email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                    />
                )}

                <TextField
                    label='Lichess Username'
                    value={lichessUsername}
                    onChange={(e) => setLichessUsername(e.target.value)}
                    disabled={Boolean(user?.ratings?.LICHESS?.username)}
                    required={!Boolean(user?.ratings?.LICHESS?.username)}
                    fullWidth
                    error={Boolean(errors.lichessUsername)}
                    helperText={errors.lichessUsername}
                />

                <TextField
                    label='Discord Username'
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    disabled={Boolean(user?.discordUsername)}
                    required={!Boolean(user?.discordUsername)}
                    fullWidth
                    error={Boolean(errors.discordUsername)}
                    helperText={errors.discordUsername}
                />

                <TextField
                    label='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    select
                    fullWidth
                >
                    <MenuItem value=''>None</MenuItem>
                    <MenuItem value='GM'>GM</MenuItem>
                    <MenuItem value='WGM'>WGM</MenuItem>
                    <MenuItem value='IM'>IM</MenuItem>
                    <MenuItem value='WIM'>WIM</MenuItem>
                    <MenuItem value='FM'>FM</MenuItem>
                    <MenuItem value='WFM'>WFM</MenuItem>
                    <MenuItem value='CM'>CM</MenuItem>
                    <MenuItem value='WCM'>WCM</MenuItem>
                </TextField>

                <TextField
                    data-cy='region'
                    label='Region'
                    select
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    error={Boolean(errors.region)}
                    helperText={errors.region}
                    fullWidth
                >
                    <MenuItem value='A'>Region A (Americas)</MenuItem>
                    <MenuItem value='B'>Region B (Eurasia/Africa/Oceania)</MenuItem>
                </TextField>

                <TextField
                    data-cy='section'
                    label='Section'
                    select
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    error={Boolean(errors.section)}
                    helperText={errors.section}
                    fullWidth
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1800'>U1800 (Lichess)</MenuItem>
                </TextField>

                <FormControl error={Boolean(errors.byeRequests)}>
                    <FormLabel>Bye Requests</FormLabel>
                    <Stack direction='row' sx={{ flexWrap: 'wrap', columnGap: 2.5 }}>
                        {Array.from(Array(7)).map((_, i) => (
                            <FormControlLabel
                                key={i}
                                control={
                                    <Checkbox
                                        checked={byeRequests[i]}
                                        onChange={(event) =>
                                            onSetByeRequest(i, event.target.checked)
                                        }
                                    />
                                }
                                label={`Round ${i + 1}`}
                            />
                        ))}
                    </Stack>
                    <FormHelperText>{errors.byeRequests}</FormHelperText>
                </FormControl>

                <LoadingButton
                    variant='contained'
                    loading={request.isLoading()}
                    onClick={onRegister}
                >
                    Register
                </LoadingButton>
            </Stack>
        </Container>
    );
};

export default RegistrationPage;
