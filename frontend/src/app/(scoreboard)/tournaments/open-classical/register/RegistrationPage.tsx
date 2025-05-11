'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, RequestStatus, useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import LoadingPage from '@/loading/LoadingPage';
import { LocationOn } from '@mui/icons-material';
import EmailIcon from '@mui/icons-material/Email';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { LoadingButton } from '@mui/lab';
import {
    Button,
    Checkbox,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    InputAdornment,
    Link,
    MenuItem,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { SiDiscord, SiLichess } from 'react-icons/si';

const RegistrationPage = () => {
    const { user, status } = useAuth();
    const api = useApi();

    const [email, setEmail] = useState('');
    const [lichessUsername, setLichessUsername] = useState(user?.ratings.LICHESS?.username || '');
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

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmedSteps, setConfirmedSteps] = useState([false, false, false]);

    const onSetConfirmedStep = (idx: number, checked: boolean) => {
        setConfirmedSteps([
            ...confirmedSteps.slice(0, idx),
            checked,
            ...confirmedSteps.slice(idx + 1),
        ]);
    };
    
    const allConfirmed = confirmedSteps.every(Boolean);    

    useEffect(() => {
        setLichessUsername(user?.ratings.LICHESS?.username || '');
        setDiscordUsername(user?.discordUsername || '');
    }, [user]);

    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    const onSetByeRequest = (idx: number, value: boolean) => {
        setByeRequests([...byeRequests.slice(0, idx), value, ...byeRequests.slice(idx + 1)]);
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
            .then(() => {
                request.onSuccess();
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
                    Register for the Dojo Open Classical
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
                        slotProps={{
                            input: {
                                startAdornment: (
                                    <InputAdornment position='start'>
                                        <EmailIcon fontSize='medium' color='dojoOrange' />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                )}

                <TextField
                    label='Lichess Username'
                    value={lichessUsername}
                    onChange={(e) => setLichessUsername(e.target.value)}
                    disabled={Boolean(user?.ratings.LICHESS?.username)}
                    required={!user?.ratings.LICHESS?.username}
                    fullWidth
                    error={Boolean(errors.lichessUsername)}
                    helperText={errors.lichessUsername}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SiLichess fontSize={23} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <TextField
                    label='Discord Username'
                    value={discordUsername}
                    onChange={(e) => setDiscordUsername(e.target.value)}
                    disabled={Boolean(user?.discordUsername)}
                    required={!user?.discordUsername}
                    fullWidth
                    error={Boolean(errors.discordUsername)}
                    helperText={errors.discordUsername}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <SiDiscord fontSize={23} style={{ color: '#5865f2' }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />

                <TextField
                    label='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    select
                    fullWidth
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <MilitaryTechIcon color='dojoOrange' fontSize='medium' />
                                </InputAdornment>
                            ),
                        },
                    }}
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
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <LocationOn color='dojoOrange' fontSize='medium' />
                                </InputAdornment>
                            ),
                        },
                    }}
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
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position='start'>
                                    <TrendingUpIcon color='dojoOrange' fontSize='medium' />
                                </InputAdornment>
                            ),
                        },
                    }}
                    fullWidth
                >
                    <MenuItem value='Open'>Open</MenuItem>
                    <MenuItem value='U1900'>U1900 (Lichess)</MenuItem>
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
                    onClick={validateAndProceed}
                    color='success'
                >
                    Register
                </LoadingButton>
            </Stack>
            <Dialog open={showConfirmDialog} maxWidth='sm' fullWidth>
                <DialogTitle>Registration Confirmation</DialogTitle>
                <DialogContent>
                    You've successfully registered for the Open Classical. Make sure to follow these
                    steps so that your opponents can contact you:
                    <ol>
                        <li>
                            Join the{' '}
                            <Link target='_blank' href='https://discord.gg/FGGrGVZKGG'>
                                ChessDojo Discord Server
                            </Link>
                        </li>
                        <li>
                            Give yourself the{' '}
                            <Link
                                rel='noreferrer'
                                target='_blank'
                                href='https://discord.com/channels/419042970558398469/830193432260640848/1097541886039834684'
                            >
                                Open Classical badge
                            </Link>
                        </li>
                        <li>
                            Make sure you are able to receive messages from people you share a
                            server with (
                            <Link
                                rel='noreferrer'
                                target='_blank'
                                href='https://medium.com/@ZombieInu/discord-enable-disable-allowing-dms-from-server-members-f84881d896c6'
                            >
                                instructions
                            </Link>
                            )
                        </li>
                    </ol>
                </DialogContent>
                <DialogActions>
                    <Button
                        href={`/tournaments/open-classical?region=${region}&ratingRange=${section}`}
                    >
                        Done
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default RegistrationPage;
