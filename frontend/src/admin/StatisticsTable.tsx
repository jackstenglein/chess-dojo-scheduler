import {
    Box,
    Stack,
    IconButton,
    Typography,
    Collapse,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import { useState } from 'react';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import { AvailabilityType, getDisplayString } from '../database/availability';
import { dojoCohorts } from '../database/user';

interface ByCohortTableProps {
    title: string;
    data: Record<string, number>;
}

export const ByCohortTable: React.FC<ByCohortTableProps> = ({ title, data }) => {
    const [open, setOpen] = useState(true);

    return (
        <Box>
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={() => setOpen(!open)}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography variant='subtitle1'>{title}</Typography>
            </Stack>

            <Collapse in={open} timeout='auto' unmountOnExit>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Cohort</TableCell>
                            <TableCell>Count</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dojoCohorts.map((cohort) => (
                            <TableRow key={cohort}>
                                <TableCell>{cohort}</TableCell>
                                <TableCell>{data[cohort]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Collapse>
        </Box>
    );
};

interface ByTypeTableProps {
    title: string;
    data: Record<AvailabilityType, number>;
}

export const ByTypeTable: React.FC<ByTypeTableProps> = ({ title, data }) => {
    const [open, setOpen] = useState(true);

    return (
        <Box>
            <Stack direction='row' alignItems='center'>
                <IconButton size='small' onClick={() => setOpen(!open)}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
                <Typography variant='subtitle1'>{title}</Typography>
            </Stack>

            <Collapse in={open} timeout='auto' unmountOnExit>
                <Table size='small'>
                    <TableHead>
                        <TableRow>
                            <TableCell>Type</TableCell>
                            <TableCell>Count</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {Object.values(AvailabilityType).map((type) => (
                            <TableRow key={type}>
                                <TableCell>{getDisplayString(type)}</TableCell>
                                <TableCell>{data[type]}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Collapse>
        </Box>
    );
};
