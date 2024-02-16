import {
    Button,
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    Container,
    Stack,
    SxProps,
    Theme,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2/Grid2';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useApi } from '../api/Api';
import { RequestSnackbar, useRequest } from '../api/Request';
import { Club } from '../database/club';
import LoadingPage from '../loading/LoadingPage';
import LocationChip from './LocationChip';
import MemberCountChip from './MemberCountChip';

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
                        <ListClubItem club={club} sx={{ height: 1 }} />
                    </Grid2>
                ))}
            </Grid2>
        </Container>
    );
};

interface ListClubItemProps {
    club: Club;
    sx?: SxProps<Theme>;
}

export const ListClubItem: React.FC<ListClubItemProps> = ({ club, sx }) => {
    const navigate = useNavigate();

    return (
        <Card variant='outlined' sx={sx}>
            <CardActionArea onClick={() => navigate(`/clubs/${club.id}`)}>
                <CardHeader sx={{ pb: 1 }} title={club.name} />
                <CardContent sx={{ pt: 0 }}>
                    <Stack direction='row' mb={2} spacing={1} flexWrap='wrap' rowGap={1}>
                        <MemberCountChip count={club.memberCount} />
                        <LocationChip location={club.location} />
                    </Stack>
                    <Typography>{club.shortDescription}</Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default ListClubsPage;
