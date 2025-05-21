import { dojoCohorts } from '@/database/user';
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
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'How to Play Against Bots | ChessDojo',
    description: `ChessDojo's recommendations for playing against bots at different skill levels`,
};

/** Renders a page that describes how to spar against bots. */
export default function BotsPage() {
    return (
        <Container sx={{ py: 3 }}>
            <Stack spacing={3} mb={5}>
                <Typography variant='h5' align='center'>
                    ChessDojo Guide to Playing Against Bots
                </Typography>
                <Typography>
                    It's always best to complete the Dojo sparring requirements by playing against a
                    fellow Dojo member from your cohort. They will be at your level, make very human
                    mistakes, and will often review the session with you afterward. But sometimes
                    finding an opponent who is available isn't easy. Fortunately, bot technology has
                    advanced, and we now have very human-like bots who serve as good substitutes for
                    human opponents. They are especially good for playing out the endgame algorithms
                    and Rook Endgame Progression. For these can be dreary for our human friends!
                    Below is a list of bots who are appropriate for your cohort. The Chess.com bots
                    are at the moment better than the Lichess ones as they are far more dialed in
                    terms of playing strength. The downside of them however is that you have to be a
                    Chess.com diamond member.
                </Typography>
            </Stack>

            <TableContainer component={Paper}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Dojo Cohort</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Chess.com Bot</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Lichess Bot</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {botData.map((b, i) => (
                            <TableRow key={i}>
                                <TableCell>{dojoCohorts[i]}</TableCell>
                                <TableCell>{b.chesscom}</TableCell>
                                <TableCell>{b.lichess}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
}

const botData = [
    { chesscom: 'Martin', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Noel', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Aron', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Zara', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Karim', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Maria', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Azeez', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Elena', lichess: 'Maia1, 5 and 9' },
    { chesscom: 'Vinh', lichess: 'RadianceEngine' },
    { chesscom: 'Wendy', lichess: 'RadianceEngine' },
    { chesscom: 'Antonio', lichess: 'RadianceEngine' },
    { chesscom: 'Pablo', lichess: 'RadianceEngine' },
    { chesscom: 'Isla', lichess: 'RadianceEngine' },
    { chesscom: 'Lorenzo', lichess: 'Boris-Trapsky' },
    { chesscom: 'Miguel', lichess: 'Boris-Trapsky' },
    { chesscom: 'Li', lichess: 'Boris-Trapsky' },
    { chesscom: 'Manuel', lichess: 'HalcyonBot' },
    { chesscom: 'Nora', lichess: 'HalcyonBot' },
    { chesscom: 'Arjun', lichess: 'Eubos' },
    { chesscom: 'Sofia', lichess: 'Eubos' },
    { chesscom: 'Luke', lichess: 'Cheng-4' },
    { chesscom: 'Wei', lichess: 'Cheng-4' },
    { chesscom: 'Paul Morphy', lichess: 'Chessatronbot' },
];
