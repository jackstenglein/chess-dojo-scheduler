import {
    Container,
    Divider,
    Unstable_Grid2 as Grid,
    Link,
    Stack,
    Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { useAuth } from '../../auth/Auth';
import NewsfeedList from './NewsfeedList';

const NewsfeedListPage = () => {
    const user = useAuth().user!;

    return (
        <Container maxWidth='xl' sx={{ pt: 6, pb: 4 }}>
            <Grid container columnSpacing={8}>
                <Grid xs={12} md={7}>
                    <Stack spacing={3}>
                        <Typography variant='h6'>Newsfeed</Typography>

                        <NewsfeedList
                            initialNewsfeedIds={['following', user.dojoCohort]}
                            newsfeedIdLabels={{
                                following: 'People I Follow',
                                [user.dojoCohort]: 'My Cohort',
                            }}
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
