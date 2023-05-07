import { useSearchParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Container, Box, Tab } from '@mui/material';

import BooksTab from './BooksTab';

const MaterialPage = () => {
    const [searchParams, setSearchParams] = useSearchParams({ view: 'books' });

    return (
        <Container maxWidth='lg' sx={{ pt: 6, pb: 4 }}>
            <TabContext value={searchParams.get('view') || 'books'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                        onChange={(_, t) => setSearchParams({ view: t })}
                        aria-label='profile tabs'
                    >
                        <Tab label='Books' value='books' />
                    </TabList>
                </Box>
                <TabPanel value='books' sx={{ px: { xs: 0, sm: 3 } }}>
                    <BooksTab />
                </TabPanel>
            </TabContext>
        </Container>
    );
};

export default MaterialPage;
