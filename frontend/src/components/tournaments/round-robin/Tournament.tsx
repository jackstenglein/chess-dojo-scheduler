import { RoundRobinModel } from '@/app/(scoreboard)/tournaments/round-robin/roundRobinApi';
import { TournamentInfo } from '@/components/tournaments/round-robin/TournamentEntry';
import { PawnIcon } from '@/style/ChessIcons';
import { Group, TableChart, Timeline } from '@mui/icons-material';
import { TabContext, TabPanel } from '@mui/lab';
import {
    Card,
    CardContent,
    CardHeader,
    Tab as MuiTab,
    TabProps,
    Tabs,
} from '@mui/material';
import { useState } from 'react';
import { Crosstable } from './Crosstable';
import { Games } from './Games';
import { Pairings } from './Pairings';
import { Stats } from './Stats';

/** Renders a single Round Robin tournament. */
export function Tournament({ tournament }: { tournament: RoundRobinModel }) {
    const [tab, setTab] = useState('crosstable');

    return (
        <Card>
            <CardHeader title={<TournamentInfo tournament={tournament} />} />

            <CardContent>
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
        </Card>
    );
}

function Tab(props: TabProps) {
    return <MuiTab {...props} iconPosition='start' sx={{ minHeight: '48px' }} />;
}
