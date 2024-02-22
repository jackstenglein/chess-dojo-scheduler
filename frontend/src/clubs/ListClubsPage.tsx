import { TabContext, TabPanel } from '@mui/lab';
import { Box, Button, Container, Stack, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFreeTier } from '../auth/Auth';
import UpsellDialog, { RestrictedAction } from '../upsell/UpsellDialog';
import AllClubsTab from './AllClubsTab';
import { useClubFilters } from './ClubFilters';
import MyClubsTab from './MyClubsTab';

const ListClubsPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams({ view: 'all' });
    const isFreeTier = useFreeTier();
    const [upsellAction, setUpsellAction] = useState('');
    const filters = useClubFilters();

    const onCreateClub = () => {
        if (isFreeTier) {
            setUpsellAction(RestrictedAction.CreateClubs);
        } else {
            navigate('/clubs/create');
        }
    };

    return (
        <Container sx={{ py: 4 }}>
            <Stack
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                flexWrap='wrap'
                rowGap={2}
                mb={3}
            >
                <Typography variant='h5'>Clubs</Typography>

                <Button variant='contained' onClick={onCreateClub}>
                    Create Club
                </Button>
            </Stack>

            <TabContext value={searchParams.get('view') || 'all'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={searchParams.get('view') || 'all'}
                        onChange={(_, t) => setSearchParams({ view: t })}
                        variant='scrollable'
                    >
                        <Tab label='All Clubs' value='all' />
                        <Tab label='My Clubs' value='mine' />
                    </Tabs>
                </Box>

                <TabPanel value='all' sx={{ px: { xs: 0, sm: 3 } }}>
                    <AllClubsTab filters={filters} />
                </TabPanel>
                <TabPanel value='mine' sx={{ px: { xs: 0, sm: 3 } }}>
                    <MyClubsTab filters={filters} />
                </TabPanel>
            </TabContext>

            <UpsellDialog
                open={Boolean(upsellAction)}
                onClose={() => setUpsellAction('')}
                currentAction={upsellAction}
            />
        </Container>
    );
};

export default ListClubsPage;
