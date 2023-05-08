import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';

import {
    RatingSystem,
    dojoCohorts,
    formatRatingSystem,
    getRatingBoundary,
} from '../database/user';

const { Fide, Custom, ...others } = RatingSystem;

const RatingsTab = () => {
    const ratingSystems = Object.values(others);

    return (
        <TableContainer component={Paper}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>
                            {formatRatingSystem(Fide)} (Dojo Cohort)
                        </TableCell>
                        {ratingSystems.map((rs) => (
                            <TableCell key={rs} sx={{ fontWeight: 'bold' }}>
                                {formatRatingSystem(rs)}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {dojoCohorts.slice(0, dojoCohorts.length - 1).map((c, i) => (
                        <TableRow key={c}>
                            <TableCell key='Fide'>{c}</TableCell>
                            {ratingSystems.map((rs) => (
                                <TableCell key={rs}>
                                    {i === 0
                                        ? '0'
                                        : getRatingBoundary(dojoCohorts[i - 1], rs)}
                                    -{getRatingBoundary(c, rs)}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                    <TableRow>
                        <TableCell>{dojoCohorts[dojoCohorts.length - 1]}</TableCell>
                        {ratingSystems.map((rs) => (
                            <TableCell key={rs}>
                                {getRatingBoundary(
                                    dojoCohorts[dojoCohorts.length - 2],
                                    rs
                                )}
                                +
                            </TableCell>
                        ))}
                    </TableRow>
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default RatingsTab;
