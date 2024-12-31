import { useAuth } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import {
    MAX_ROUND_ROBIN_PLAYERS,
    RoundRobin,
    RoundRobinWaitlist,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { PeopleAlt } from '@mui/icons-material';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { RegisterModal } from './RegisterModal';
import { TimeControlChip } from './TimeControlChip';
import { WithdrawModal } from './WithdrawModal';

export function Waitlist({
    tournament,
    onUpdateTournaments,
}: {
    tournament: RoundRobinWaitlist;
    onUpdateTournaments: (props: {
        waitlist?: RoundRobin;
        tournament?: RoundRobin;
    }) => void;
}) {
    const { user } = useAuth();
    const [showRegistration, setShowRegistration] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    return (
        <Card>
            <CardHeader
                title={
                    <Stack direction='row' flexWrap='wrap' gap={2} alignItems='center'>
                        <Typography variant='h4'>Waitlist</Typography>

                        <Chip
                            label={`${Object.values(tournament.players).length}/10 players`}
                            icon={<PeopleAlt />}
                            color='secondary'
                        />

                        <TimeControlChip cohort={tournament.cohort} />
                    </Stack>
                }
            />
            <CardContent>
                {user && !tournament.players[user.username] && (
                    <Button
                        variant='contained'
                        color='success'
                        sx={{ mt: -2, mb: 3 }}
                        onClick={() => setShowRegistration(true)}
                    >
                        Register
                    </Button>
                )}

                {user && tournament.players[user.username] && (
                    <Button
                        variant='contained'
                        color='error'
                        sx={{ mt: -2, mb: 3 }}
                        onClick={() => setShowWithdraw(true)}
                    >
                        Withdraw
                    </Button>
                )}

                <Typography>
                    The tournament will start automatically once {MAX_ROUND_ROBIN_PLAYERS}{' '}
                    players have joined.
                </Typography>

                {Object.values(tournament.players).length > 0 && (
                    <Table sx={{ mt: 3 }}>
                        <TableHead>
                            <TableRow>
                                <TableCell>Player</TableCell>
                                <TableCell align='center'>Lichess Username</TableCell>
                                <TableCell align='center'>Chess.com Username</TableCell>
                                <TableCell align='center'>Discord Username</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {Object.values(tournament.players).map((player) => (
                                <TableRow key={player.username}>
                                    <TableCell>
                                        <Link href={`/profile/${player.username}`}>
                                            {player.displayName}
                                        </Link>
                                    </TableCell>
                                    <TableCell align='center'>
                                        {player.lichessUsername}
                                    </TableCell>
                                    <TableCell align='center'>
                                        {player.chesscomUsername}
                                    </TableCell>
                                    <TableCell align='center'>
                                        {player.discordUsername}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {user && (
                <>
                    <RegisterModal
                        open={showRegistration}
                        onClose={() => setShowRegistration(false)}
                        user={user}
                        cohort={tournament.cohort}
                        onUpdateTournaments={onUpdateTournaments}
                    />

                    <WithdrawModal
                        open={showWithdraw}
                        onClose={() => setShowWithdraw(false)}
                        user={user}
                        cohort={tournament.cohort}
                        startsAt={tournament.startsAt}
                        onUpdateTournaments={onUpdateTournaments}
                    />
                </>
            )}
        </Card>
    );
}
