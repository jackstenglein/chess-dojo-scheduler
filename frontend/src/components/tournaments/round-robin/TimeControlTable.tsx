import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';

const TimeControlTable = () => {
    const timeControls = [
        { cohort: 'Under 800', timeControl: '30+0' },
        { cohort: '800-1200', timeControl: '30+30' },
        { cohort: '1200-1600', timeControl: '45+30' },
        { cohort: '1600-2000', timeControl: '60+30' },
        { cohort: '2000+', timeControl: '90+30' },
    ];

    return (
        <TableContainer
            component={Paper}
            sx={{
                maxWidth: '400px',
                border: '1px solid',
                borderColor: 'divider',
                borderBottom: '0px',
                boxShadow: 'none',
            }}
        >
            <Typography
                variant='subtitle1'
                sx={{
                    p: 1,
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                }}
            >
                Dojo Time Controls
            </Typography>
            <Table size='small' sx={{ fontSize: '0.8rem' }}>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ py: 0.5, px: 1, fontWeight: 700 }}>
                            Dojo Cohort
                        </TableCell>
                        <TableCell sx={{ py: 0.5, px: 1, fontWeight: 700 }}>
                            Time Control
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {timeControls.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell sx={{ py: 0.3, px: 1 }}>{row.cohort}</TableCell>
                            <TableCell sx={{ py: 0.3, px: 1 }}>
                                {row.timeControl}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default TimeControlTable;
