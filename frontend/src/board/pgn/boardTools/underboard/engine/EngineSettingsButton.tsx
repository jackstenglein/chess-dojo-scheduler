import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';
import {Button} from '@mui/material';
import EngineSettingsDialog from './EngineSettings'; // Updated import for the Dialog

export default function EngineSettingsButton() {
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <>
            {/* Dialog component for engine settings */}
            <EngineSettingsDialog open={openDialog} onClose={() => setOpenDialog(false)} />

            {/* IconButton for opening the dialog, positioned on the left */}
            <Button
                title='Engine settings'
                color='primary'
                onClick={() => setOpenDialog(true)}
                sx={{alignSelf: "flex-end"}}
            >
                <SettingsIcon fontSize='medium' />
            </Button>
        </>
    );
}

