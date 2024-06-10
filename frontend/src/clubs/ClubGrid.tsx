import {
    Card,
    CardActionArea,
    CardContent,
    CardHeader,
    Stack,
    SxProps,
    Theme,
    Typography,
} from '@mui/material';
import Grid2 from '@mui/material/Unstable_Grid2';
import { useNavigate } from 'react-router-dom';
import { Request, RequestSnackbar } from '../api/Request';
import { Club } from '../database/club';
import { ClubAvatar } from '../profile/Avatar';
import LocationChip from './LocationChip';
import MemberCountChip from './MemberCountChip';

interface ClubGridProps {
    clubs?: Club[];
    request: Request<unknown>;
}

const ClubGrid: React.FC<ClubGridProps> = ({ clubs, request }) => {
    if (!clubs || clubs.length === 0) {
        return (
            <>
                <RequestSnackbar request={request} />
                <Typography>No clubs found</Typography>
            </>
        );
    }

    return (
        <Grid2 container rowSpacing={2} columnSpacing={2}>
            <RequestSnackbar request={request} />
            {clubs.map((club) => (
                <Grid2 key={club.id} xs={12} sm={6} md={4}>
                    <ListClubItem club={club} sx={{ height: 1 }} />
                </Grid2>
            ))}
        </Grid2>
    );
};

export default ClubGrid;

interface ListClubItemProps {
    club: Club;
    sx?: SxProps<Theme>;
}

export const ListClubItem: React.FC<ListClubItemProps> = ({ club, sx }) => {
    const navigate = useNavigate();

    return (
        <Card variant='outlined' sx={sx}>
            <CardActionArea
                sx={{
                    height: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'start',
                    justifyContent: 'start',
                }}
                onClick={() => navigate(`/clubs/${club.id}`)}
            >
                <CardHeader
                    sx={{ pb: 1 }}
                    title={
                        <Stack direction='row' spacing={1} alignItems='center'>
                            <ClubAvatar club={club} size={40} />
                            <Typography variant='h5'>{club.name}</Typography>
                        </Stack>
                    }
                />
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
