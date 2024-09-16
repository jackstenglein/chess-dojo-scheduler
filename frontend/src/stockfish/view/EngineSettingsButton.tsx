import SettingsIcon from '@mui/icons-material/Settings';
import { Fab } from '@mui/material';
import { useState } from 'react';
import EngineSettingsCard from './EngineSettings';

export default function EngineSettingsButton() {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            <Fab
                title='Engine settings'
                color='secondary'
                size='small'
                sx={{
                    top: 'auto',
                    right: 16,
                    bottom: 16,
                    left: 'auto',
                    position: 'fixed',
                }}
                onClick={() => setOpenDialog(true)}
            >
                <SettingsIcon fontSize='medium' />
            </Fab>

            <EngineSettingsCard open={openDialog} onClose={() => setOpenDialog(false)} />
        </>
    );
}
