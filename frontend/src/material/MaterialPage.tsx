import { useSearchParams } from 'react-router-dom';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Container, Box, Tab } from '@mui/material';

import BooksTab from './BooksTab';
import RatingsTab from './RatingsTab';
import SparringTab from './SparringTab';
import ModelGamesTab from './ModelGamesTab';
import GamesToMemorizeTab from './GamesToMemorizeTab';
import CoursesTab from './CoursesTab';
import { CourseType } from '../database/course';

const MaterialPage = () => {
    const [searchParams, setSearchParams] = useSearchParams({ view: 'openings' });

    return (
        <Container maxWidth={false} sx={{ pt: 6, pb: 4 }}>
            <TabContext value={searchParams.get('view') || 'openings'}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <TabList
                        onChange={(_, t) => setSearchParams({ view: t })}
                        variant='scrollable'
                    >
                        <Tab label='Openings' value='openings' />
                        <Tab label='Books' value='books' />
                        <Tab label='Sparring Positions' value='sparring' />
                        <Tab label='Model Games' value='modelGames' />
                        <Tab label='Games to Memorize' value='memorizeGames' />
                        <Tab label='Rating Conversions' value='ratings' />
                    </TabList>
                </Box>

                <TabPanel value='books' sx={{ px: { xs: 0, sm: 3 } }}>
                    <BooksTab />
                </TabPanel>

                <TabPanel value='openings' sx={{ px: { xs: 0, sm: 3 } }}>
                    <CoursesTab type={CourseType.Opening} groupByColor />
                </TabPanel>

                <TabPanel value='sparring' sx={{ px: { xs: 0, sm: 3 } }}>
                    <SparringTab />
                </TabPanel>

                <TabPanel value='modelGames'>
                    <ModelGamesTab />
                </TabPanel>

                <TabPanel value='memorizeGames'>
                    <GamesToMemorizeTab />
                </TabPanel>

                <TabPanel value='ratings' sx={{ px: { xs: 0, sm: 3 } }}>
                    <RatingsTab />
                </TabPanel>
            </TabContext>
        </Container>
    );
};

export default MaterialPage;
