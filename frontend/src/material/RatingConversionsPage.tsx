import {
    Container,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import {
    RatingSystem,
    dojoCohorts,
    formatRatingSystem,
    getRatingBoundary,
} from '../database/user';
import GraduationIcon from '../scoreboard/GraduationIcon';

const { Fide, Custom, ...others } = RatingSystem;

const RatingConversionsPage = () => {
    const ratingSystems = Object.values(others);

    return (
        <Container maxWidth={false} sx={{ py: 5 }}>
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
                                <TableCell key='Fide'>
                                    <Stack
                                        direction='row'
                                        spacing={2}
                                        alignItems='center'
                                    >
                                        <GraduationIcon cohort={c} tooltip='' />
                                        <Typography variant='body2'>{c}</Typography>
                                    </Stack>
                                </TableCell>
                                {ratingSystems.map((rs) => {
                                    const minRating =
                                        i === 0
                                            ? '0'
                                            : getRatingBoundary(dojoCohorts[i - 1], rs) ||
                                              0;
                                    const maxRating = getRatingBoundary(c, rs) || 0;

                                    if (!maxRating) {
                                        return <TableCell key={rs}>-</TableCell>;
                                    }

                                    return (
                                        <TableCell key={rs}>
                                            {`${minRating}-${maxRating}`}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                        <TableRow>
                            <TableCell>
                                <Stack direction='row' spacing={2} alignItems='center'>
                                    <GraduationIcon
                                        cohort={dojoCohorts[dojoCohorts.length - 1]}
                                        tooltip=''
                                    />
                                    <Typography variant='body2'>
                                        {dojoCohorts[dojoCohorts.length - 1]}
                                    </Typography>
                                </Stack>
                            </TableCell>
                            {ratingSystems.map((rs) => (
                                <TableCell key={rs}>
                                    {getRatingBoundary(
                                        dojoCohorts[dojoCohorts.length - 2],
                                        rs,
                                    )}
                                    +
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default RatingConversionsPage;
