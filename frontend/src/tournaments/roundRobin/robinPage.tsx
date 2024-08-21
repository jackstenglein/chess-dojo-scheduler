import { Container, Typography } from '@mui/material';
import React from 'react';

// const TabPanel: React.FC<{
//     children?: React.ReactNode;
//     index: number;
//     value: number;
// }> = ({ children, value, index }) => {
//     return (
//         <div
//             role='tabpanel'
//             hidden={value !== index}
//             id={`tabpanel-${index}`}
//             aria-labelledby={`tab-${index}`}
//         >
//             {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
//         </div>
//     );
// };

const TournamentViewer: React.FC = () => {
    // const [tabValue, setTabValue] = useState(0);

    // const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    //     setTabValue(newValue);
    // };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <Typography>Nmp is working on it boss</Typography>
            {/* <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant='fullWidth'
                    aria-label='tournament viewer tabs'
                >
                    <Tab label='Info' icon={<InfoIcon />} />
                    <Tab label='Pairings' icon={<GroupIcon />} />
                    <Tab label='Crosstable' icon={<TableChartIcon />} />
                </Tabs>
            </Box>
            <TabPanel value={tabValue} index={0}>
                <InfoPage />
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
                <PairingsPage />
            </TabPanel>
            <TabPanel value={tabValue} index={2}>
                <Crosstable />
            </TabPanel> */}
        </Container>
    );
};

export default TournamentViewer;
