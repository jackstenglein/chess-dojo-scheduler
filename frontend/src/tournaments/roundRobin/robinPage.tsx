import { PawnIcon } from '@/style/ChessIcons';
import {
    Group as GroupIcon,
    Info as InfoIcon,
    TableChart as TableChartIcon,
} from '@mui/icons-material';
import { Box, Container, Tab, Tabs } from '@mui/material';
import React, { useState } from 'react';
import Crosstable from './CrosstablePage';
import GameSubmission from './gameSubmission';
import InfoPage from './InfoPage';
import PairingsPage from './PairingPage';

/**
 * Preview tab of the pannel
 * @param index the int index value
 * @param value the int value
 * @param children ReactNode children
 * @returns
 */

const TabPanel: React.FC<{
    children?: React.ReactNode;
    index: number;
    value: number;
}> = ({ children, value, index }) => {
    return (
        <div
            role='tabpanel'
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

/**
 * Handles the logic for tournament viewer
 * @returns
 */

const TournamentViewer: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth='xl' sx={{ py: 5 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    variant='fullWidth'
                    aria-label='tournament viewer tabs'
                >
                    <Tab label='Info' icon={<InfoIcon />} />
                    <Tab label='Pairings' icon={<GroupIcon />} />
                    <Tab label='Crosstable' icon={<TableChartIcon />} />
                    <Tab label='Games' icon={<PawnIcon />} />
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
            </TabPanel>
            <TabPanel value={tabValue} index={3}>
                <GameSubmission />
            </TabPanel>
        </Container>
    );
};

export default TournamentViewer;
