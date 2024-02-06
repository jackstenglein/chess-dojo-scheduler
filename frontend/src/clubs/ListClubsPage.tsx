import { useEffect } from 'react';
import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    Container,
    Stack,
    Typography,
} from '@mui/material';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Club } from '../database/club';
import LoadingPage from '../loading/LoadingPage';
import { useNavigate } from 'react-router-dom';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';

const ListClubsPage = () => {
    const api = useApi();
    const request = useRequest<Club[]>();
    const navigate = useNavigate();

    useEffect(() => {
        if (!request.isSent()) {
            request.onStart();
            api.listClubs()
                .then((clubs) => {
                    console.log('listClubs: ', clubs);
                    request.onSuccess(clubs);
                })
                .catch((err) => {
                    console.error('listClubs: ', err);
                    request.onFailure(err);
                });
        }
    }, [request, api]);

    if (!request.isSent() || request.isLoading()) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 4 }}>
            <RequestSnackbar request={request} />

            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                rowGap={2}
                mb={3}
            >
                <Typography variant='h5'>Clubs</Typography>

                <Button variant='contained' onClick={() => navigate('/clubs/create')}>
                    Create Club
                </Button>
            </Stack>

            {!request.data?.length && <Typography>No clubs found</Typography>}

            <Grid2 container rowSpacing={2} columnSpacing={2}>
                {request.data?.map((club) => (
                    <Grid2 key={club.id} xs={12} sm={6} md={4}>
                        <Card variant='outlined'>
                            <CardActionArea onClick={() => navigate(`/clubs/${club.id}`)}>
                                <CardHeader title={club.name} />
                                <CardContent>
                                    <Typography>{club.shortDescription}</Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid2>
                ))}
            </Grid2>
        </Container>
    );
};

export default ListClubsPage;
