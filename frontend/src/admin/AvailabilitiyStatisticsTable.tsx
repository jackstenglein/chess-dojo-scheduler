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
import { AvailabilityStatistics } from '../database/statistics';
import { ByCohortTable, ByTypeTable } from './StatisticsTable';

interface AvailabilityStatisticsTableProps {
    stats: AvailabilityStatistics;
}

const AvailabilityStatisticsTable: React.FC<AvailabilityStatisticsTableProps> = ({
    stats,
}) => {
    const [createdOpen, setCreatedOpen] = useState(false);
    const [deletedOpen, setDeletedOpen] = useState(false);

    return (
        <Stack>
            <Typography variant='h6' gutterBottom>
                Availabilities
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

                                        <ByTypeTable
                                            title='By Bookable Type'
                                            data={stats.types}
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
                                    onClick={() => setDeletedOpen(!deletedOpen)}
                                >
                                    {deletedOpen ? (
                                        <KeyboardArrowUpIcon />
                                    ) : (
                                        <KeyboardArrowDownIcon />
                                    )}
                                </IconButton>
                            </TableCell>
                            <TableCell scope='row' align='left'>
                                Total Deleted
                            </TableCell>
                            <TableCell align='left' sx={{ borderBottom: 'unset' }}>
                                {stats.deleted}
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell
                                style={{ paddingBottom: 0, paddingTop: 0 }}
                                colSpan={3}
                            >
                                <Collapse in={deletedOpen} timeout='auto' unmountOnExit>
                                    <Stack spacing={3} sx={{ margin: 1 }}>
                                        <ByCohortTable
                                            title='By Deleter Cohort'
                                            data={stats.deleterCohorts}
                                        />
                                    </Stack>
                                </Collapse>
                            </TableCell>
                        </TableRow>

                        <TableRow>
                            <TableCell />
                            <TableCell scope='row' align='left'>
                                Total Booked
                            </TableCell>
                            <TableCell align='left'>{stats.booked}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};

export default AvailabilityStatisticsTable;
