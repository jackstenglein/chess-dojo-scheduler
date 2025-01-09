import { useAuth, useFreeTier } from '@/auth/Auth';
import { dojoCohorts } from '@/database/user';
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
    Typography,
} from '@mui/material';
import { useState } from 'react';
import { Players } from './Players';
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
    const isFreeTier = useFreeTier();
    const [showRegistration, setShowRegistration] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);

    const canRegister =
        user &&
        !tournament.players[user.username] &&
        Math.abs(
            dojoCohorts.indexOf(user.dojoCohort) - dojoCohorts.indexOf(tournament.cohort),
        ) <= 1;

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
                {canRegister && (
                    <Button
                        variant='contained'
                        color='success'
                        sx={{ mt: -2, mb: 3 }}
                        onClick={() => setShowRegistration(true)}
                    >
                        Register {isFreeTier && ' - $2'}
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

                <Players tournament={tournament} />
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
