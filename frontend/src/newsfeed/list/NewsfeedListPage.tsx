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
import { useAuth } from '../../auth/Auth';
import NewsfeedList from './NewsfeedList';

const NewsfeedListPage = () => {
    const user = useAuth().user!;
    const { clubs } = useClubs(user.clubs || []);
    

    const [newsfeedIds, newsfeedIdLabels] = useMemo(() => {
        let newsfeedIds = ['following', user.dojoCohort];
        newsfeedIds = newsfeedIds.concat(clubs.map((c) => c.id));

        const newsfeedIdLabels = clubs.reduce(
            (map, club) => {
                map[club.id] = club.name;
                return map;
            },
            {} as Record<string, string>,
        );
        newsfeedIdLabels['following'] = 'Followers';
        newsfeedIdLabels[user.dojoCohort] = 'My Cohort';

        return [newsfeedIds, newsfeedIdLabels];
    }, [clubs, user.dojoCohort]);

    return (
        <Container maxWidth='xl' sx={{ pt: 6, pb: 4 }}>
            <Grid container columnSpacing={8}>
                <Grid xs={12} md={7}>
                    <Stack spacing={3}>
                        <Typography variant='h6'>Newsfeed</Typography>

                        <NewsfeedList
                            initialNewsfeedIds={newsfeedIds}
                            newsfeedIdLabels={newsfeedIdLabels}
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
