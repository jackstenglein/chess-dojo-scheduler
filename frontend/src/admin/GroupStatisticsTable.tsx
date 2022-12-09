import {
    Collapse,
    Divider,
    IconButton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { useState } from 'react';
import { AvailabilityStatistics, MeetingStatistics } from '../database/statistics';
import { ByCohortTable } from './StatisticsTable';

interface GroupStatisticsTableProps {
    availabilityStats: AvailabilityStatistics;
    meetingStats: MeetingStatistics;
}

const GroupStatisticsTable: React.FC<GroupStatisticsTableProps> = ({
    availabilityStats,
    meetingStats,
}) => {
    const [createdOpen, setCreatedOpen] = useState(false);
    const [joinsOpen, setJoinsOpen] = useState(false);

    const totalCreated = Object.values(availabilityStats.groupCohorts).reduce(
        (sum, num) => sum + num
    );

    const totalJoins = Object.values(meetingStats.groupCohorts).reduce(
        (sum, num) => sum + num
    );

    return (
        <Stack>
            <Typography variant='h6' gutterBottom>
                Groups
            </Typography>
            <Divider />
            <TableContainer>
                <Table>
                    <TableBody>
                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                            <TableCell sx={{ width: '16px', borderBottom: 'unset' }}>
                                <IconButton
                                    aria-label='expand row'
                                    size='small'
                                    onClick={() => setCreatedOpen(!createdOpen)}
                                >
                                    {createdOpen ? (
                                        <KeyboardArrowUpIcon />
                                    ) : (
                                        <KeyboardArrowDownIcon />
                                    )}
                                </IconButton>
                            </TableCell>
                            <TableCell
                                scope='row'
                                align='left'
                                sx={{ borderBottom: 'unset' }}
                            >
                                Total Created
                            </TableCell>
                            <TableCell align='left' sx={{ borderBottom: 'unset' }}>
                                {totalCreated}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={3}
                            >
                                <Collapse in={createdOpen} timeout='auto' unmountOnExit>
                                    <Stack spacing={3} sx={{ margin: 1 }}>
                                        <ByCohortTable
                                            title='By Owner Cohort'
                                            data={availabilityStats.groupCohorts}
                                        />
                                    </Stack>
                                </Collapse>
                            </TableCell>
                        </TableRow>

                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                            <TableCell sx={{ width: '16px', borderBottom: 'unset' }}>
                                <IconButton
                                    aria-label='expand row'
                                    size='small'
                                    onClick={() => setJoinsOpen(!joinsOpen)}
                                >
                                    {joinsOpen ? (
                                        <KeyboardArrowUpIcon />
                                    ) : (
                                        <KeyboardArrowDownIcon />
                                    )}
                                </IconButton>
                            </TableCell>
                            <TableCell
                                scope='row'
                                align='left'
                                sx={{ borderBottom: 'unset' }}
                            >
                                Total Joins
                            </TableCell>
                            <TableCell align='left' sx={{ borderBottom: 'unset' }}>
                                {totalJoins}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={3}
                            >
                                <Collapse in={joinsOpen} timeout='auto' unmountOnExit>
                                    <Stack spacing={3} sx={{ margin: 1 }}>
                                        <ByCohortTable
                                            title='By Joiner Cohort'
                                            data={meetingStats.groupCohorts}
                                        />
                                    </Stack>
                                </Collapse>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};

export default GroupStatisticsTable;
