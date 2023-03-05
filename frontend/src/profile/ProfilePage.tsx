import { Button, Container, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/Auth';
import { RatingSystem } from '../database/user';
import RatingCard from './RatingCard';

const ProfilePage = () => {
    const user = useAuth().user!;
    const navigate = useNavigate();

    return (
        <Container maxWidth='md' sx={{ pt: 6, pb: 4 }}>
            <Stack spacing={5}>
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack>
                        <Typography variant='h4'>{user.discordUsername}</Typography>
                        <Typography variant='h5' color='text.secondary'>
                            {user.dojoCohort}
                        </Typography>
                    </Stack>

                    <Button variant='contained' onClick={() => navigate('edit')}>
                        Edit Profile
                    </Button>
                </Stack>

                {user.bio !== '' && (
                    <Typography variant='body1' sx={{ whiteSpace: 'pre-line' }}>
                        {user.bio}
                    </Typography>
                )}

                <Stack spacing={4}>
                    <RatingCard
                        system={RatingSystem.Chesscom}
                        username={user.chesscomUsername}
                        currentRating={user.currentChesscomRating}
                        startRating={user.startChesscomRating}
                        isPreferred={user.ratingSystem === RatingSystem.Chesscom}
                    />

                    <RatingCard
                        system={RatingSystem.Lichess}
                        username={user.lichessUsername}
                        currentRating={user.currentLichessRating}
                        startRating={user.startLichessRating}
                        isPreferred={user.ratingSystem === RatingSystem.Lichess}
                    />

                    {user.fideId !== '' && (
                        <RatingCard
                            system={RatingSystem.Fide}
                            username={user.fideId}
                            currentRating={user.currentFideRating}
                            startRating={user.startFideRating}
                            isPreferred={user.ratingSystem === RatingSystem.Fide}
                        />
                    )}

                    {user.uscfId !== '' && (
                        <RatingCard
                            system={RatingSystem.Uscf}
                            username={user.uscfId}
                            currentRating={user.currentUscfRating}
                            startRating={user.startUscfRating}
                            isPreferred={user.ratingSystem === RatingSystem.Uscf}
                        />
                    )}
                </Stack>
            </Stack>
        </Container>
    );
};

export default ProfilePage;
