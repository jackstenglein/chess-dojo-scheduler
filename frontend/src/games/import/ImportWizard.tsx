import { TabContext, TabPanel } from '@mui/lab';
import { Box, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { CreateGameRequest } from '../../api/gameApi';
import { OnlineGameForm } from './OnlineGameForm';
import { PGNForm } from './PGNForm';
import { PositionForm } from './PositionForm';

enum ImportSource {
    URL = 'url',
    Position = 'position',
    PGNText = 'pgn-text',
}

interface ImportTabPanelProps {
    children: React.ReactNode;
    source: ImportSource;
}

const ImportTabPanel: React.FC<ImportTabPanelProps> = ({ children, source }) => {
    return (
        <TabPanel value={source} sx={{ px: { xs: 0, sm: 3 } }}>
            {children}
        </TabPanel>
    );
};

interface ImportWizardProps {
    loading: boolean;
    onSubmit: (game: CreateGameRequest) => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ onSubmit, loading }) => {
    const [source, setSource] = useState<ImportSource>(ImportSource.URL);

    const handleTabChange = (_event: React.SyntheticEvent, source: ImportSource) => {
        setSource(source);
    };

    return (
        <>
            <TabContext value={source}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        onChange={handleTabChange}
                        value={source}
                        aria-label='import sources tabs'
                        variant='scrollable'
                    >
                        <Tab
                            value={ImportSource.URL}
                            label={'Lichess & Chess.com'}
                            data-cy={'import-url'}
                            disabled={loading}
                        />
                        <Tab
                            value={ImportSource.Position}
                            label='Position'
                            data-cy={'import-position'}
                            disabled={loading}
                        />
                        <Tab
                            value={ImportSource.PGNText}
                            label='PGN'
                            data-cy={'import-pgn-text'}
                            disabled={loading}
                        />
                    </Tabs>
                </Box>
                <ImportTabPanel source={ImportSource.URL}>
                    <OnlineGameForm onSubmit={onSubmit} loading={loading} />
                </ImportTabPanel>
                <ImportTabPanel source={ImportSource.PGNText}>
                    <PGNForm onSubmit={onSubmit} loading={loading} />
                </ImportTabPanel>
                <ImportTabPanel source={ImportSource.Position}>
                    <PositionForm onSubmit={onSubmit} loading={loading} />
                </ImportTabPanel>
            </TabContext>
        </>
    );
};

export default ImportWizard;
