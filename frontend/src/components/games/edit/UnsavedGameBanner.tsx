import { Alert, Button, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import SaveGameDialogue, { SaveGameForm } from './SaveGameDialogue';

export function UnsavedGameBanner() {
    const [showDialogue, setShowDialogue] = useState<boolean>(false);

    const onSubmit = (form: SaveGameForm) => {
        console.log(form);
    };

    return (
        <>
            <Alert
                severity='warning'
                variant='outlined'
                action={<Button onClick={() => setShowDialogue(true)}>Create</Button>}
            >
                <Stack direction='row' alignItems='center'>
                    <Typography variant='body1'>
                        Changes not saved until game is created.
                    </Typography>
                </Stack>
            </Alert>
            <SaveGameDialogue
                open={showDialogue}
                title='Create Game'
                onSubmit={onSubmit}
                onClose={() => setShowDialogue(false)}
            />
        </>
    );
}
