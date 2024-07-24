import {
    Container,
    Divider,
    Unstable_Grid2 as Grid,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useClubs } from '../../api/cache/clubs';
import { useRequiredAuth } from '../../auth/Auth';
import CohortIcon from '../../scoreboard/CohortIcon';
import Icon from '../../style/Icon';
import NewsfeedList from './NewsfeedList';

const NewsfeedListPage = () => {
    const { user } = useRequiredAuth();
    const { clubs } = useClubs(user.clubs || []);

    const [newsfeedIds, newsfeedIdOptions] = useMemo(() => {
        let newsfeedIds = ['following', user.dojoCohort];
        newsfeedIds = newsfeedIds.concat(clubs.map((c) => c.id));

        const newsfeedIdOptions = [
            {
                value: 'following',
                label: 'Followers',
                icon: <Icon name='followers' color='primary' />,
            },
            {
                value: user.dojoCohort,
                label: 'My Cohort',
                icon: <CohortIcon cohort={user.dojoCohort} size={25} tooltip='' />,
            },
        ].concat(
            clubs.map((club) => ({
                value: club.id,
                label: club.name,
                icon: <Icon name='clubs' color='primary' />,
            })),
        );

        return [newsfeedIds, newsfeedIdOptions];
    }, [clubs, user.dojoCohort]);

    return (
        <Container maxWidth='xl' sx={{ pt: 6, pb: 4 }}>
            <Grid container columnSpacing={8}>
                <Grid xs={12} md={7}>
                    <Stack spacing={3}>
                        <Typography variant='h6'>Newsfeed</Typography>

                        <NewsfeedList
                            initialNewsfeedIds={newsfeedIds}
                            newsfeedIdOptions={newsfeedIdOptions}
                            showAdditionalFilters={true}
                        />
                    </Stack>
                </Grid>

                <Grid md={5} display={{ xs: 'none', md: 'initial' }}>
                    <Stack direction='row' height={1}>
                        <Divider orientation='vertical' flexItem sx={{ mr: 8 }} />
                        <Stack spacing={3} width={1}>
                            <Stack
                                direction='row'
                                flexWrap='wrap'
                                justifyContent='space-between'
                                alignItems='center'
                            >
                                <Typography variant='h6'>Graduations</Typography>

                                <Link component={RouterLink} to='/recent'>
                                    View All
                                </Link>
                            </Stack>

                            <NewsfeedList initialNewsfeedIds={['GRADUATIONS']} />
                        </Stack>
                    </Stack>
                </Grid>
            </Grid>
        </Container>
    );
};

export default NewsfeedListPage;
