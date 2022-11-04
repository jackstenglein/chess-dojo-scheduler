import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
    Button,
    CircularProgress,
    Container,
    Stack,
    TextField,
    Typography,
} from '@mui/material';

import { AuthStatus, useAuth } from './Auth';

enum ForgotPasswordStep {
    Start = 'START',
    Confirm = 'CONFIRM',
    Success = 'SUCCESS',
}

const ForgotPasswordPage = () => {
    const auth = useAuth();

    const navigate = useNavigate();

    const [step, setStep] = useState(ForgotPasswordStep.Start);
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string>();

    if (auth.status === AuthStatus.Loading) {
        return (
            <Stack sx={{ pt: 6, pb: 4 }} justifyContent='center' alignItems='center'>
                <CircularProgress />
            </Stack>
        );
    }

    if (auth.status === AuthStatus.Authenticated) {
        return <Navigate to='/calendar' />;
    }

    const onSubmit = () => {
        if (email.length === 0) {
            setEmailError('Email is required');
            return;
        }
        setEmailError(undefined);

        auth.forgotPassword(email)
            .then(() => setStep(ForgotPasswordStep.Confirm))
            .catch((err) => {
                if (err.code === 'UserNotFoundException') {
                    setEmailError('Account with this email does not exist');
                } else {
                    setEmailError(err.message);
                }
            });
    };

    const onCancel = () => {
        navigate('/signin');
    };

    return (
        <Container maxWidth='md' sx={{ pt: 10 }}>
            <Stack justifyContent='center' alignItems='center' spacing={6}>
                <Stack alignItems='center'>
                    <Typography variant='h4'>Chess Dojo Scheduler</Typography>
                    <Typography variant='h6'>Forgot Password</Typography>
                </Stack>
                <Stack
                    direction='column'
                    justifyContent='center'
                    alignItems='center'
                    spacing={3}
                    paddingTop={1.5}
                >
                    {step === ForgotPasswordStep.Start && (
                        <StartStep
                            email={email}
                            setEmail={setEmail}
                            emailError={emailError}
                            onSubmit={onSubmit}
                            onCancel={onCancel}
                        />
                    )}

                    {step === ForgotPasswordStep.Confirm && (
                        <ConfirmStep
                            email={email}
                            onSuccess={() => setStep(ForgotPasswordStep.Success)}
                        />
                    )}

                    {step === ForgotPasswordStep.Success && <SuccessStep />}
                </Stack>
            </Stack>
        </Container>
    );
};

interface StartStepProps {
    email: string;
    setEmail: (email: string) => void;
    emailError?: string;
    onSubmit: () => void;
    onCancel: () => void;
}

const StartStep: React.FC<StartStepProps> = ({
    email,
    setEmail,
    emailError,
    onSubmit,
    onCancel,
}) => {
    return (
        <>
            <Typography variant='subtitle1' component='div' gutterBottom>
                Enter your email, and we'll send you a code to reset your password.
            </Typography>

            <TextField
                fullWidth
                id='email'
                label='Email'
                variant='outlined'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                error={!!emailError}
                helperText={emailError}
            />

            <Button
                variant='contained'
                onClick={onSubmit}
                fullWidth
                sx={{ textTransform: 'none' }}
            >
                Send Email
            </Button>

            <Button variant='text' sx={{ textTransform: 'none' }} onClick={onCancel}>
                Cancel
            </Button>
        </>
    );
};

interface ConfirmStepProps {
    email: string;
    onSuccess: () => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({ email, onSuccess }) => {
    const auth = useAuth();

    const [code, setCode] = useState('');
    const [codeError, setCodeError] = useState<string>();
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [passwordError, setPasswordError] = useState<string>();

    const onConfirm = () => {
        let failed = false;

        if (code.length === 0) {
            setCodeError('Recovery code is required');
            failed = true;
        } else {
            setCodeError(undefined);
        }

        if (password.length < 8) {
            setPasswordError('Password must be at least 8 characters');
            failed = true;
        } else if (password !== passwordConfirm) {
            setPasswordError('Passwords do not match');
            failed = true;
        } else {
            setPasswordError(undefined);
        }

        if (failed) return;

        auth.forgotPasswordConfirm(email, code, password)
            .then(onSuccess)
            .catch((err) => {
                console.dir(err);
                if (err.code === 'CodeMismatchException') {
                    setCodeError('Incorrect recovery code');
                } else {
                    setCodeError(err.message);
                }
            });
    };

    return (
        <>
            <Typography variant='subtitle1' component='div' gutterBottom>
                Email sent! Enter the code to reset your password.
            </Typography>

            <TextField
                fullWidth
                id='code'
                label='Recovery Code'
                variant='outlined'
                value={code}
                onChange={(event) => setCode(event.target.value)}
                error={!!codeError}
                helperText={codeError}
            />

            <TextField
                fullWidth
                id='password'
                label='New Password'
                type='password'
                variant='outlined'
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                error={!!passwordError}
                helperText={passwordError}
            />

            <TextField
                fullWidth
                id='password-confirm'
                label='Confirm New Password'
                type='password'
                variant='outlined'
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                error={!!passwordError}
                helperText={passwordError}
            />

            <Button
                variant='contained'
                onClick={onConfirm}
                fullWidth
                sx={{ textTransform: 'none' }}
            >
                Reset Password
            </Button>
        </>
    );
};

const SuccessStep = () => {
    const navigate = useNavigate();

    const onSignin = () => {
        navigate('/signin');
    };

    return (
        <>
            <Typography variant='subtitle1' component='div' gutterBottom>
                You can now sign in using your new password.
            </Typography>

            <Button
                variant='contained'
                onClick={onSignin}
                fullWidth
                sx={{ textTransform: 'none' }}
            >
                Sign In
            </Button>
        </>
    );
};

export default ForgotPasswordPage;
