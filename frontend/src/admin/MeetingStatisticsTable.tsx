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
import { MeetingStatistics } from '../database/statistics';
import { ByCohortTable, ByTypeTable } from './StatisticsTable';

interface MeetingStatisticsTableProps {
    stats: MeetingStatistics;
}

const MeetingStatisticsTable: React.FC<MeetingStatisticsTableProps> = ({ stats }) => {
    const [createdOpen, setCreatedOpen] = useState(false);
    const [canceledOpen, setCanceledOpen] = useState(false);

    return (
        <Stack>
            <Typography variant='h6' gutterBottom>
                Meetings
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
                            <TableCell scope='row' align='left'>
                                Total Created
                            </TableCell>
                            <TableCell align='left' sx={{ borderBottom: 'unset' }}>
                                {stats.created}
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
                                            data={stats.ownerCohorts}
                                        />

                                        <ByCohortTable
                                            title='By Booker Cohort'
                                            data={stats.participantCohorts}
                                        />

                                        <ByTypeTable title='By Type' data={stats.types} />
                                    </Stack>
                                </Collapse>
                            </TableCell>
                        </TableRow>

                        <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                            <TableCell sx={{ width: '16px', borderBottom: 'unset' }}>
                                <IconButton
                                    aria-label='expand row'
                                    size='small'
                                    onClick={() => setCanceledOpen(!canceledOpen)}
                                >
                                    {canceledOpen ? (
                                        <KeyboardArrowUpIcon />
                                    ) : (
                                        <KeyboardArrowDownIcon />
                                    )}
                                </IconButton>
                            </TableCell>
                            <TableCell scope='row' align='left'>
                                Total Canceled
                            </TableCell>
                            <TableCell align='left' sx={{ borderBottom: 'unset' }}>
                                {stats.canceled}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={3}
                            >
                                <Collapse in={canceledOpen} timeout='auto' unmountOnExit>
                                    <Stack spacing={3} sx={{ margin: 1 }}>
                                        <ByCohortTable
                                            title='By Canceler Cohort'
                                            data={stats.cancelerCohorts}
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

export default MeetingStatisticsTable;
