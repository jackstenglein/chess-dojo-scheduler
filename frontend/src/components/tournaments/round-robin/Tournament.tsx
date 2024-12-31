import { useAuth } from '@/auth/Auth';
import { TournamentInfo } from '@/components/tournaments/round-robin/TournamentInfo';
import { PawnIcon } from '@/style/ChessIcons';
import {
    RoundRobin,
    RoundRobinPlayerStatuses,
} from '@jackstenglein/chess-dojo-common/src/roundRobin/api';
import { Group, TableChart, Timeline } from '@mui/icons-material';
import { TabContext, TabPanel } from '@mui/lab';
import {
    Button,
    Card,
    CardContent,
    CardHeader,
    Tab as MuiTab,
    Stack,
    TabProps,
    Tabs,
} from '@mui/material';
import { useState } from 'react';
import { Crosstable } from './Crosstable';
import { Games } from './Games';
import { Pairings } from './Pairings';
import { Stats } from './Stats';
import SubmitGameModal from './SubmitGameModal';
import { WithdrawModal } from './WithdrawModal';

/** Renders a single Round Robin tournament. */
export function Tournament({
    tournament,
    onUpdateTournaments,
}: {
    tournament: RoundRobin;
    onUpdateTournaments: (props: {
        waitlist?: RoundRobin;
        tournament?: RoundRobin;
    }) => void;
}) {
    const [tab, setTab] = useState('crosstable');
    const [showSubmitGame, setShowSubmitGame] = useState(false);
    const [showWithdraw, setShowWithdraw] = useState(false);
    const { user } = useAuth();

    return (
        <Card>
            <CardHeader title={<TournamentInfo tournament={tournament} />} />

            <CardContent>
                {user &&
                    tournament.players[user.username].status ===
                        RoundRobinPlayerStatuses.ACTIVE && (
                        <Stack direction='row' sx={{ mt: -2, mb: 3 }} gap={1}>
                            <Button
                                variant='contained'
                                color='success'
                                onClick={() => setShowSubmitGame(true)}
                            >
                                Submit Game
                            </Button>

                            <Button
                                variant='contained'
                                color='error'
                                onClick={() => setShowWithdraw(true)}
                            >
                                Withdraw
                            </Button>
                        </Stack>
                    )}

                <TabContext value={tab}>
                    <Tabs
                        variant='scrollable'
                        value={tab}
                        onChange={(_, t: string) => setTab(t)}
                        sx={{ borderBottom: 1, borderColor: 'divider' }}
                    >
                        <Tab
                            label='Crosstable'
                            value='crosstable'
                            icon={<TableChart />}
                        />
                        <Tab label='Pairings' value='pairings' icon={<Group />} />
                        <Tab label='Games' value='games' icon={<PawnIcon />} />
                        <Tab label='Stats' value='stats' icon={<Timeline />} />
                    </Tabs>

                    <TabPanel value='crosstable' sx={{ px: 0 }}>
                        <Crosstable tournament={tournament} />
                    </TabPanel>

                    <TabPanel value='pairings' sx={{ px: 0 }}>
                        <Pairings tournament={tournament} />
                    </TabPanel>

                    <TabPanel value='games' sx={{ px: 0 }}>
                        <Games tournament={tournament} />
                    </TabPanel>

                    <TabPanel value='stats' sx={{ px: 0 }}>
                        <Stats tournament={tournament} />
                    </TabPanel>
                </TabContext>
            </CardContent>

            {user && (
                <>
                    <SubmitGameModal
                        open={showSubmitGame}
                        onClose={() => setShowSubmitGame(false)}
                        user={user}
                        cohort={tournament.cohort}
                        startsAt={tournament.startsAt}
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

function Tab(props: TabProps) {
    return <MuiTab {...props} iconPosition='start' sx={{ minHeight: '48px' }} />;
}
